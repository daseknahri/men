const path = require("path");

const { uploadsDir } = require("../site-store");
const {
  getThumbnailDir,
  listThumbnailSourceFiles,
  warmUploadThumbnailCache
} = require("../image-thumbnails");

async function main() {
  console.log(`Uploads directory: ${uploadsDir}`);
  console.log(`Thumbnail directory: ${getThumbnailDir()}`);

  const sources = listThumbnailSourceFiles();
  console.log(`Source images eligible for thumbs: ${sources.length}`);

  if (!sources.length) {
    console.log("No eligible upload images found.");
    return;
  }

  const startedAt = Date.now();
  await warmUploadThumbnailCache({
    logPrefix: "thumbs-build",
    batchSize: 16
  });
  const elapsedMs = Date.now() - startedAt;

  console.log(`Thumbnail warmup complete in ${(elapsedMs / 1000).toFixed(1)}s.`);
  console.log("Tip: run `npm run uploads:audit` to inspect original file sizes next.");
}

main().catch((error) => {
  console.error("Thumbnail build failed:", error?.message || error);
  process.exitCode = 1;
});
