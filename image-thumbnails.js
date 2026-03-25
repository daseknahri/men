const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const { uploadsDir } = require("./site-store");

const THUMBNAIL_DIRNAME = ".thumbs";
const THUMBNAIL_WIDTH = Number.parseInt(process.env.IMAGE_THUMB_WIDTH || "320", 10) || 320;
const THUMBNAIL_HEIGHT = Number.parseInt(process.env.IMAGE_THUMB_HEIGHT || "320", 10) || 320;
const THUMBNAIL_QUALITY = Number.parseInt(process.env.IMAGE_THUMB_QUALITY || "72", 10) || 72;
const THUMBNAIL_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

function getThumbnailDir() {
  return path.join(uploadsDir, THUMBNAIL_DIRNAME);
}

function getUploadThumbnailPublicUrl(value) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/uploads/")) return value;

  const filename = path.basename(trimmed);
  const extension = path.extname(filename).toLowerCase();
  if (!THUMBNAIL_EXTENSIONS.has(extension)) return value;

  return `/uploads/${THUMBNAIL_DIRNAME}/${filename}.webp`;
}

async function ensureThumbnailFile(originalFileName, targetFileName) {
  const safeOriginalName = path.basename(originalFileName || "");
  const safeTargetName = path.basename(targetFileName || "");
  if (!safeOriginalName || !safeTargetName) {
    return null;
  }

  const originalPath = path.join(uploadsDir, safeOriginalName);
  if (!fs.existsSync(originalPath)) {
    return null;
  }

  const extension = path.extname(originalPath).toLowerCase();
  if (!THUMBNAIL_EXTENSIONS.has(extension)) {
    return originalPath;
  }

  const thumbnailDir = getThumbnailDir();
  const thumbnailPath = path.join(thumbnailDir, safeTargetName);

  fs.mkdirSync(thumbnailDir, { recursive: true });

  if (!fs.existsSync(thumbnailPath)) {
    const tempPath = path.join(
      thumbnailDir,
      `${safeTargetName}.${process.pid}.${Date.now()}.tmp`
    );

    try {
      await sharp(originalPath)
        .rotate()
        .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
          fit: "cover",
          position: "attention"
        })
        .webp({
          quality: THUMBNAIL_QUALITY,
          effort: 4
        })
        .toFile(tempPath);

      if (!fs.existsSync(thumbnailPath)) {
        fs.renameSync(tempPath, thumbnailPath);
      } else if (fs.existsSync(tempPath)) {
        fs.rmSync(tempPath, { force: true });
      }
    } catch (error) {
      if (fs.existsSync(tempPath)) {
        fs.rmSync(tempPath, { force: true });
      }
      if (!fs.existsSync(thumbnailPath)) {
        throw error;
      }
    }
  }

  return thumbnailPath;
}

function createThumbnailRequestHandler() {
  return async function handleThumbnailRequest(req, res, next) {
    try {
      const requestedFile = path.basename(req.params.file || "");
      if (!requestedFile.endsWith(".webp")) {
        res.status(404).type("text/plain").send("Not Found");
        return;
      }

      const originalFileName = requestedFile.slice(0, -".webp".length);
      const resolvedPath = await ensureThumbnailFile(originalFileName, requestedFile);

      if (!resolvedPath) {
        res.status(404).type("text/plain").send("Not Found");
        return;
      }

      res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
      res.sendFile(resolvedPath);
    } catch (error) {
      next(error);
    }
  };
}

function listThumbnailSourceFiles() {
  if (!fs.existsSync(uploadsDir)) return [];

  return fs.readdirSync(uploadsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => THUMBNAIL_EXTENSIONS.has(path.extname(name).toLowerCase()));
}

let thumbnailWarmupPromise = null;

function warmUploadThumbnailCache(options = {}) {
  if (thumbnailWarmupPromise) return thumbnailWarmupPromise;

  const logPrefix = options.logPrefix || "thumbs";
  const batchSize = Number.isInteger(options.batchSize) && options.batchSize > 0 ? options.batchSize : 12;

  thumbnailWarmupPromise = (async () => {
    const files = listThumbnailSourceFiles();
    if (!files.length) return;

    for (let index = 0; index < files.length; index += batchSize) {
      const batch = files.slice(index, index + batchSize);
      await Promise.all(batch.map((fileName) => ensureThumbnailFile(fileName, `${fileName}.webp`).catch((error) => {
        console.warn(`[${logPrefix}] Thumbnail warmup failed for ${fileName}:`, error?.message || error);
      })));
      await new Promise((resolve) => setTimeout(resolve, 15));
    }

    console.log(`[${logPrefix}] Warmed ${files.length} upload thumbnail(s).`);
  })();

  return thumbnailWarmupPromise;
}

module.exports = {
  createThumbnailRequestHandler,
  ensureThumbnailFile,
  getUploadThumbnailPublicUrl,
  getThumbnailDir,
  listThumbnailSourceFiles,
  warmUploadThumbnailCache
};
