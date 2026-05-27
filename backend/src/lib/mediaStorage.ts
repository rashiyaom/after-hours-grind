import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";

export type StoredMedia = {
  url: string;
  storagePath: string;
  provider: "local" | "cloudinary";
  bytes: number;
  contentType: string;
};

const inferExtension = (mime: string): string => {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  if (mime === "video/mp4") return "mp4";
  if (mime === "video/webm") return "webm";
  if (mime === "video/quicktime") return "mov";
  return "bin";
};

const useCloudinary =
  env.MEDIA_PROVIDER === "cloudinary" &&
  Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);

const cloudinaryConfigIncomplete =
  env.MEDIA_PROVIDER === "cloudinary" &&
  !useCloudinary;

if (useCloudinary) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const normalizePath = (value: string): string => value.split(path.sep).join("/");

export async function storeMediaFile(file: Express.Multer.File): Promise<StoredMedia> {
  if (!file.buffer || file.size <= 0) {
    throw new Error("Invalid upload payload");
  }

  if (cloudinaryConfigIncomplete) {
    throw new Error(
      "MEDIA_PROVIDER is set to cloudinary, but CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET are missing"
    );
  }

  if (useCloudinary) {
    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: env.MEDIA_CLOUDINARY_FOLDER,
          resource_type: "auto",
          use_filename: false,
          unique_filename: true,
        },
        (error, uploadResult) => {
          if (error || !uploadResult?.secure_url || !uploadResult.public_id) {
            reject(error ?? new Error("Cloudinary upload failed"));
            return;
          }
          resolve({ secure_url: uploadResult.secure_url, public_id: uploadResult.public_id });
        }
      );
      stream.end(file.buffer);
    });

    return {
      url: result.secure_url,
      storagePath: result.public_id,
      provider: "cloudinary",
      bytes: file.size,
      contentType: file.mimetype,
    };
  }

  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const ext = inferExtension(file.mimetype);
  const fileName = `${randomUUID()}.${ext}`;
  const relativePath = normalizePath(path.join(year, month, fileName));
  const targetDir = path.resolve(process.cwd(), "uploads", year, month);
  const absolutePath = path.join(targetDir, fileName);

  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(absolutePath, file.buffer);

  return {
    url: "",
    storagePath: relativePath,
    provider: "local",
    bytes: file.size,
    contentType: file.mimetype,
  };
}
