import { afterEach, describe, expect, it, vi } from "vitest";
import { r2PresignedDownload } from "./r2";

describe("r2PresignedDownload", () => {
  afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });
  it("matches the AWS reference signer (boto3 generate_presigned_url, UNSIGNED-PAYLOAD)", async () => {
    vi.useFakeTimers({ now: Date.UTC(2026, 10, 12, 11, 0, 0) });
    vi.stubEnv("R2_ACCOUNT_ID", "acc");
    vi.stubEnv("R2_ACCESS_KEY_ID", "k");
    vi.stubEnv("R2_SECRET_ACCESS_KEY", "s");
    vi.stubEnv("R2_BUCKET", "b");
    const url = await r2PresignedDownload("cms/2026/a b.pdf", "x.pdf");
    expect(url).toBe("https://acc.r2.cloudflarestorage.com/b/cms/2026/a%20b.pdf?response-content-disposition=attachment%3B%20filename%3D%22x.pdf%22&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=k%2F20261112%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20261112T110000Z&X-Amz-Expires=600&X-Amz-SignedHeaders=host&X-Amz-Signature=fd3f24c6145aefee4d54fbb22885e324a633ff93f71d431c12430833ee31023f");
  });
});
