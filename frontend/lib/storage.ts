import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

function getEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : "";
}

function encodeKey(key: string) {
  return key.split("/").map((part) => encodeURIComponent(part)).join("/");
}

export function getR2PublicBase() {
  return getEnv("R2_PUBLIC_URL") || getEnv("NEXT_PUBLIC_R2_PUBLIC_URL");
}

export function isR2Configured() {
  return Boolean(
    getEnv("R2_ACCOUNT_ID") &&
      getEnv("R2_ACCESS_KEY_ID") &&
      getEnv("R2_SECRET_ACCESS_KEY") &&
      getEnv("R2_BUCKET_NAME") &&
      getR2PublicBase(),
  );
}

let r2Client: S3Client | null = null;

function getR2Client() {
  if (r2Client) return r2Client;
  const accountId = getEnv("R2_ACCOUNT_ID");
  const accessKeyId = getEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = getEnv("R2_SECRET_ACCESS_KEY");

  r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return r2Client;
}

export function r2PublicUrlForKey(key: string) {
  const base = getR2PublicBase().replace(/\/+$/, "");
  return `${base}/${encodeKey(key)}`;
}

export async function uploadToR2(input: {
  key: string;
  body: Buffer;
  contentType: string;
  cacheControl?: string;
}) {
  const bucket = getEnv("R2_BUCKET_NAME");
  if (!isR2Configured()) {
    throw new Error("R2 is not fully configured");
  }

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      CacheControl: input.cacheControl ?? "public, max-age=31536000, immutable",
    }),
  );

  return r2PublicUrlForKey(input.key);
}
