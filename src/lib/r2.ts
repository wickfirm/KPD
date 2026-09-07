// ─────────────────────────────────────────────────────────────────────────────
// Cloudflare R2 (S3-compatible) asset storage.
// Used by the CMS media library to upload/store images, videos and documents.
// Public delivery goes through the bucket's public base URL (custom domain or
// r2.dev) so all assets are served via the Cloudflare CDN.
// ─────────────────────────────────────────────────────────────────────────────
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

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

/** Delete an object from R2 (silently succeeds if it doesn't exist). */
export async function r2Delete(key: string): Promise<void> {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) throw new Error("R2_BUCKET is not set");
  await s3().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
