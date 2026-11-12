import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/// In-memory stand-in for R2 that enforces the multipart rules R2 applies on
/// CompleteMultipartUpload: every part except the last must be at least 5 MiB
/// and those parts must all be the same size.
const MIN_PART = 5 * 1024 * 1024;
const storage = vi.hoisted(() => ({
  objects: new Map<string, Uint8Array>(),
  uploads: new Map<string, { key: string; parts: Map<number, Uint8Array> }>(),
  aborted: [] as string[],
  maxRequestBody: 0,
}));

vi.mock("@aws-sdk/client-s3", () => {
  class Command { constructor(public input: Record<string, unknown>) {} }
  class PutObjectCommand extends Command {}
  class GetObjectCommand extends Command {}
  class DeleteObjectCommand extends Command {}
  class ListObjectsV2Command extends Command {}
  class CreateMultipartUploadCommand extends Command {}
  class UploadPartCommand extends Command {}
  class CompleteMultipartUploadCommand extends Command {}
  class AbortMultipartUploadCommand extends Command {}
  class S3Client {
    async send(command: Command) {
      const input = command.input as Record<string, never>;
      if (command instanceof PutObjectCommand) { storage.objects.set(input.Key, input.Body); return {}; }
      if (command instanceof GetObjectCommand) {
        const body = storage.objects.get(input.Key);
        if (!body) throw Object.assign(new Error("The specified key does not exist."), { name: "NoSuchKey" });
        return { Body: { transformToByteArray: async () => body } };
      }
      if (command instanceof DeleteObjectCommand) { storage.objects.delete(input.Key); return {}; }
      if (command instanceof CreateMultipartUploadCommand) {
        const id = `upload-${storage.uploads.size + 1}`;
        storage.uploads.set(id, { key: input.Key, parts: new Map() });
        return { UploadId: id };
      }
      if (command instanceof UploadPartCommand) {
        storage.uploads.get(input.UploadId)!.parts.set(input.PartNumber, input.Body);
        return { ETag: `"etag-${input.PartNumber}"` };
      }
      if (command instanceof AbortMultipartUploadCommand) { storage.aborted.push(input.UploadId); storage.uploads.delete(input.UploadId); return {}; }
      if (command instanceof CompleteMultipartUploadCommand) {
        const upload = storage.uploads.get(input.UploadId)!;
        const listed = (input.MultipartUpload as { Parts: { PartNumber: number }[] }).Parts.map((part) => upload.parts.get(part.PartNumber)!);
        const leading = listed.slice(0, -1);
        if (leading.some((part) => part.length < MIN_PART || part.length !== leading[0].length)) {
          throw Object.assign(new Error("Your proposed upload is smaller than the minimum allowed object size."), { name: "EntityTooSmall" });
        }
        const whole = new Uint8Array(listed.reduce((sum, part) => sum + part.length, 0));
        let offset = 0;
        for (const part of listed) { whole.set(part, offset); offset += part.length; }
        storage.objects.set(upload.key, whole);
        return {};
      }
      throw new Error("unexpected command");
    }
  }
  return { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand };
});
vi.mock("@/lib/auth", () => ({ requireSession: async () => ({ email: "editor@test" }), getActor: async () => ({ user: { role: "admin" } }) }));
vi.mock("@/lib/permissions", () => ({ can: () => true }));
vi.mock("@/lib/db", () => ({ db: { mediaAsset: { create: async () => ({}) } } }));

const { NextRequest } = await import("next/server");
const route = await import("@/app/api/admin/assets/route");
const { planUploadParts, uploadCmsAsset, PART } = await import("./cms-upload");

const VERCEL_BODY_LIMIT = 4.5 * 1000 * 1000;

function fileOf(size: number, name = "brochure.pdf") {
  const bytes = new Uint8Array(size);
  for (let i = 0; i < size; i += 4096) bytes[i] = (i / 4096) % 251;
  bytes[size - 1] = 7;
  return { file: new File([bytes], name, { type: "application/pdf" }), bytes };
}

beforeEach(() => {
  process.env.R2_ACCOUNT_ID = "acct";
  process.env.R2_ACCESS_KEY_ID = "id";
  process.env.R2_SECRET_ACCESS_KEY = "secret";
  process.env.R2_BUCKET = "bucket";
  process.env.R2_PUBLIC_BASE_URL = "https://cdn.test";
  storage.objects.clear();
  storage.uploads.clear();
  storage.aborted.length = 0;
  storage.maxRequestBody = 0;
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    const body = init.body as Blob | FormData | string;
    if (body instanceof Blob) storage.maxRequestBody = Math.max(storage.maxRequestBody, body.size);
    const request = new NextRequest(new URL(url, "https://cms.test"), { method: init.method, headers: init.headers, body: body instanceof Blob ? await body.arrayBuffer() : body });
    return init.method === "PUT" ? route.PUT(request) : route.POST(request);
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("CMS multipart upload to R2", () => {
  it("plans equal parts of at least 5 MiB, sent in requests under Vercel's body cap", () => {
    for (const size of [4 * 1024 * 1024 + 1, 15_597_892, 20_376_903, PART, PART + 1, 250 * 1024 * 1024]) {
      const parts = planUploadParts(size);
      const leading = parts.slice(0, -1).map((part) => part.chunks.reduce((sum, chunk) => sum + chunk.end - chunk.start, 0));
      expect(leading.every((length) => length === PART && length >= MIN_PART)).toBe(true);
      expect(parts.flatMap((part) => part.chunks).every((chunk) => chunk.end - chunk.start <= VERCEL_BODY_LIMIT)).toBe(true);
      expect(parts.flatMap((part) => part.chunks).reduce((sum, chunk) => sum + chunk.end - chunk.start, 0)).toBe(size);
      expect(parts.length).toBeLessThanOrEqual(10000);
    }
  });

  // The two client samples (15.6 MB and 20.4 MB) plus the edges around each limit.
  it.each([15_597_892, 20_376_903, 4 * 1024 * 1024 + 1, 5 * 1024 * 1024, PART, PART + 1, 3 * PART - 1])("uploads a %i-byte file intact", async (size) => {
    const { file, bytes } = fileOf(size);
    const url = await uploadCmsAsset(file);
    const key = url.replace("https://cdn.test/", "");
    const stored = storage.objects.get(key);
    expect(stored?.length).toBe(size);
    expect(Buffer.compare(Buffer.from(stored!), Buffer.from(bytes))).toBe(0);
    expect([...storage.objects.keys()].filter((name) => name.startsWith("cms/_staging/"))).toEqual([]);
    expect(storage.maxRequestBody).toBeLessThanOrEqual(VERCEL_BODY_LIMIT);
  });

  it("uploads a 250 MB file", async () => {
    const { file } = fileOf(250 * 1024 * 1024);
    const url = await uploadCmsAsset(file);
    expect(storage.objects.get(url.replace("https://cdn.test/", ""))?.length).toBe(250 * 1024 * 1024);
  }, 60_000);

  it("aborts the storage upload when a part fails", async () => {
    const { file } = fileOf(20_376_903);
    const realFetch = globalThis.fetch;
    let puts = 0;
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      if (init.method === "PUT" && ++puts === 3) return new Response(JSON.stringify({ error: "boom" }), { status: 503 });
      return realFetch(url, init);
    });
    await expect(uploadCmsAsset(file)).rejects.toThrow("boom");
    expect(storage.aborted).toEqual(["upload-1"]);
  });
});
