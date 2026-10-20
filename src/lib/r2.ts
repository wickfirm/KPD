// ─────────────────────────────────────────────────────────────────────────────
// Cloudflare R2 (S3-compatible) asset storage.
// Used by the CMS media library to upload/store images, videos and documents.
// Public delivery goes through the bucket's public base URL (custom domain or
// r2.dev) so all assets are served via the Cloudflare CDN.
// ─────────────────────────────────────────────────────────────────────────────
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";
import { SignatureV4 } from "@smithy/signature-v4";
import { createHash, createHmac } from "node:crypto";

class R2Sha256 {
  private hash: ReturnType<typeof createHash> | ReturnType<typeof createHmac>;
  constructor(secret?: string | Uint8Array) { this.hash = secret ? createHmac("sha256", secret) : createHash("sha256"); }
  update(value: Uint8Array | string) { this.hash.update(value); }
  async digest() { return this.hash.digest(); }
}

function s3() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 is not configured (set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)");
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

/** Public CDN URL for an object key stored in the bucket. */
export function r2PublicUrl(key: string): string {
  const base = process.env.R2_PUBLIC_BASE_URL;
  if (!base) throw new Error("R2_PUBLIC_BASE_URL is not set");
  return `${base.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
}

/** Upload a file to R2. Returns the public URL of the stored object. */
export async function r2Upload(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<{ key: string; url: string }> {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) throw new Error("R2_BUCKET is not set");
  await s3().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return { key, url: r2PublicUrl(key) };
}

/// Short-lived browser-to-R2 PUT URL. Large files never pass through Vercel;
/// the CMS only issues the signature and subsequently registers the R2 URL.
export async function r2PresignedUpload(key: string, contentType: string): Promise<string> {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) throw new Error("R2 is not configured.");
  const hostname = `${accountId}.r2.cloudflarestorage.com`;
  const signer = new SignatureV4({ credentials: { accessKeyId, secretAccessKey }, region: "auto", service: "s3", sha256: R2Sha256 as never });
  const signed = await signer.presign({
    method: "PUT",
    protocol: "https:",
    hostname,
    path: `/${bucket}/${key}`,
    headers: { "content-type": contentType, host: hostname },
    query: {},
  }, { expiresIn: 300 });
  const query = new URLSearchParams(Object.entries(signed.query ?? {}).flatMap(([name, value]) => Array.isArray(value) ? value.map((item) => [name, item]) : [[name, value ?? ""]])).toString();
  return `https://${hostname}${signed.path}${query ? `?${query}` : ""}`;
}

/// Vercel rejects request bodies above 4.5 MB before a route can process them.
/// These helpers let the authenticated CMS stream larger (up to 25 MB) files
/// through several small route requests without exposing R2 credentials.
export async function r2StartMultipartUpload(key: string, contentType: string): Promise<string> {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) throw new Error("R2_BUCKET is not set");
  const result = await s3().send(new CreateMultipartUploadCommand({
    Bucket: bucket, Key: key, ContentType: contentType, CacheControl: "public, max-age=31536000, immutable",
  }));
  if (!result.UploadId) throw new Error("R2 did not create the multipart upload.");
  return result.UploadId;
}

export async function r2UploadPart(key: string, uploadId: string, partNumber: number, body: Uint8Array): Promise<string> {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) throw new Error("R2_BUCKET is not set");
  const result = await s3().send(new UploadPartCommand({ Bucket: bucket, Key: key, UploadId: uploadId, PartNumber: partNumber, Body: body }));
  if (!result.ETag) throw new Error("R2 did not return an upload-part tag.");
  return result.ETag;
}

export async function r2CompleteMultipartUpload(key: string, uploadId: string, parts: { partNumber: number; eTag: string }[]): Promise<{ key: string; url: string }> {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) throw new Error("R2_BUCKET is not set");
  await s3().send(new CompleteMultipartUploadCommand({
    Bucket: bucket,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: { Parts: parts.map((part) => ({ PartNumber: part.partNumber, ETag: part.eTag })) },
  }));
  return { key, url: r2PublicUrl(key) };
}

/** Delete an object from R2 (silently succeeds if it doesn't exist). */
export async function r2Delete(key: string): Promise<void> {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) throw new Error("R2_BUCKET is not set");
  await s3().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export type R2ObjectSummary = { key: string; size: number; lastModified: Date };

/** List objects in the bucket (used by the media library's "import existing files" action). */
export async function r2List(prefix = "", maxObjects = 2000): Promise<R2ObjectSummary[]> {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) throw new Error("R2_BUCKET is not set");
  const client = s3();
  const objects: R2ObjectSummary[] = [];
  let token: string | undefined;
  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix || undefined,
        ContinuationToken: token,
        MaxKeys: 1000,
      }),
    );
    for (const object of page.Contents ?? []) {
      if (object.Key) {
        objects.push({ key: object.Key, size: object.Size ?? 0, lastModified: object.LastModified ?? new Date(0) });
      }
    }
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token && objects.length < maxObjects);
  return objects.slice(0, maxObjects);
}

/** Collision-safe object key for CMS uploads: cms/<date>/<uuid><extension>. */
export function buildCmsKey(fileName: string): string {
  const extension = fileName.toLowerCase().match(/\.[a-z0-9]{1,8}$/)?.[0] || "";
  return `cms/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}${extension}`;
}

/** Best-effort MIME type from a file extension (used when importing existing R2 objects). */
export function contentTypeFromKey(key: string): string {
  const extension = key.toLowerCase().match(/\.([a-z0-9]{1,8})(?:\?|$)/)?.[1] ?? "";
  const map: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
    gif: "image/gif", svg: "image/svg+xml", mp4: "video/mp4", pdf: "application/pdf",
  };
  return map[extension] ?? "application/octet-stream";
}
