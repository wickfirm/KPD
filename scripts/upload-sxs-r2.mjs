import fs from "node:fs";
import path from "node:path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const root = process.cwd();
const envText = fs.readFileSync(path.join(root, ".env.local"), "utf8");
const env = {};
for (const line of envText.split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)="([^"]*)"/);
  if (match) env[match[1]] = match[2];
}
const required = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET", "R2_PUBLIC_BASE_URL"];
for (const key of required) if (!env[key]) throw new Error(`Missing ${key}`);

const sources = [
  "src/components/public/sxs/SevenXSevenFresh.tsx",
  "src/components/public/sxs/MobilePublicSite.tsx",
];
const refs = new Set();
for (const file of sources) {
  const text = fs.readFileSync(path.join(root, file), "utf8");
  for (const match of text.matchAll(/\/assets\/[^"'`\s]+/g)) refs.add(match[0].replace(/[),]+$/, ""));
}

const types = { ".png": "image/png", ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".mp4": "video/mp4", ".webm": "video/webm", ".svg": "image/svg+xml" };
const client = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
});
const base = env.R2_PUBLIC_BASE_URL.replace(/\/$/, "");
const map = {};
const list = [...refs].sort();
console.log(`Uploading ${list.length} residence assets`);
let done = 0;
for (const ref of list) {
  const decoded = decodeURIComponent(ref);
  const filePath = path.join(root, "public", decoded.replace(/^\//, "").replaceAll("/", path.sep));
  if (!fs.existsSync(filePath)) {
    console.log(`MISSING ${ref}`);
    continue;
  }
  const ext = path.extname(filePath).toLowerCase();
  const key = `sxs/${decoded.replace(/^\//, "")}`;
  const body = fs.readFileSync(filePath);
  await client.send(new PutObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: types[ext] || "application/octet-stream",
    CacheControl: "public, max-age=31536000, immutable",
  }));
  map[ref] = `${base}/${key.split("/").map(encodeURIComponent).join("/")}`;
  done += 1;
  console.log(`${done}/${list.length} ${path.basename(filePath)} ${(body.length / 1024 / 1024).toFixed(1)} MB`);
}
const out = path.join(root, "src/lib/sxs-r2-map.json");
fs.writeFileSync(out, `${JSON.stringify(map, null, 2)}\n`);
console.log(`Wrote ${Object.keys(map).length} urls`);
