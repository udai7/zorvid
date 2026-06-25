import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { createWriteStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import type { Readable } from "node:stream";

const useSsl = process.env.MINIO_USE_SSL === "true";
const endpoint = `${useSsl ? "https" : "http"}://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`;

export const BUCKETS = {
  inputs: process.env.BUCKET_INPUTS ?? "inputs",
  outputs: process.env.BUCKET_OUTPUTS ?? "outputs",
  thumbs: process.env.BUCKET_THUMBS ?? "thumbnails",
} as const;

export const s3 = new S3Client({
  endpoint,
  region: "us-east-1",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.MINIO_ROOT_USER ?? "",
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD ?? "",
  },
});

/** Source key written by the API at upload time (must match api/src/storage). */
export function inputKey(videoId: string, filename: string): string {
  return `${videoId}/${filename}`;
}

/** Download an object to a local file. */
export async function downloadTo(bucket: string, key: string, destPath: string): Promise<void> {
  const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  await pipeline(res.Body as Readable, createWriteStream(destPath));
}

/** Upload a local file (small HLS/thumbnail artifacts) to object storage. */
export async function uploadFile(
  bucket: string,
  key: string,
  filePath: string,
  contentType: string
): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: await readFile(filePath),
      ContentType: contentType,
    })
  );
}
