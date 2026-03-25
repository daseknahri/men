const fs = require("fs");
const path = require("path");

const { uploadsDir } = require("../site-store");
const { getThumbnailDir } = require("../image-thumbnails");

function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function scanFiles(rootDir, baseDir = rootDir) {
  if (!fs.existsSync(rootDir)) return [];

  const output = [];
  fs.readdirSync(rootDir, { withFileTypes: true }).forEach((entry) => {
    const absolutePath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      output.push(...scanFiles(absolutePath, baseDir));
      return;
    }

    const stats = fs.statSync(absolutePath);
    output.push({
      absolutePath,
      relativePath: path.relative(baseDir, absolutePath).replace(/\\/g, "/"),
      name: entry.name,
      extension: path.extname(entry.name).toLowerCase() || "(none)",
      size: stats.size,
      mtime: stats.mtime.toISOString()
    });
  });

  return output;
}

function sumSizes(files) {
  return files.reduce((total, file) => total + file.size, 0);
}

function printTopFiles(files, heading, limit = 12) {
  console.log(`\n${heading}`);
  if (!files.length) {
    console.log("  none");
    return;
  }

  files
    .slice()
    .sort((a, b) => b.size - a.size)
    .slice(0, limit)
    .forEach((file, index) => {
      console.log(
        `${String(index + 1).padStart(2, "0")}. ${formatBytes(file.size).padStart(8)}  ${file.relativePath}`
      );
    });
}

function printByExtension(files) {
  const groups = new Map();
  files.forEach((file) => {
    const current = groups.get(file.extension) || { count: 0, size: 0 };
    current.count += 1;
    current.size += file.size;
    groups.set(file.extension, current);
  });

  const sorted = Array.from(groups.entries()).sort((a, b) => b[1].size - a[1].size);
  console.log("\nBy extension");
  if (!sorted.length) {
    console.log("  none");
    return;
  }

  sorted.forEach(([extension, info]) => {
    console.log(
      `  ${extension.padEnd(8)} ${String(info.count).padStart(4)} file(s)  ${formatBytes(info.size).padStart(8)}`
    );
  });
}

function main() {
  const targetDir = process.argv[2]
    ? path.resolve(process.argv[2])
    : uploadsDir;
  const thumbnailDir = getThumbnailDir();

  console.log(`Uploads directory: ${targetDir}`);
  console.log(`Thumbnail directory: ${thumbnailDir}`);

  if (!fs.existsSync(targetDir)) {
    console.error("Uploads directory does not exist.");
    process.exitCode = 1;
    return;
  }

  const allFiles = scanFiles(targetDir);
  const thumbnailPrefix = path.relative(targetDir, thumbnailDir).replace(/\\/g, "/");
  const originalFiles = allFiles.filter((file) => !file.relativePath.startsWith(`${thumbnailPrefix}/`));
  const thumbnailFiles = allFiles.filter((file) => file.relativePath.startsWith(`${thumbnailPrefix}/`));

  console.log("\nSummary");
  console.log(`  originals : ${String(originalFiles.length).padStart(5)} file(s)  ${formatBytes(sumSizes(originalFiles))}`);
  console.log(`  thumbs    : ${String(thumbnailFiles.length).padStart(5)} file(s)  ${formatBytes(sumSizes(thumbnailFiles))}`);
  console.log(`  total     : ${String(allFiles.length).padStart(5)} file(s)  ${formatBytes(sumSizes(allFiles))}`);

  const oversized = originalFiles.filter((file) => file.size >= 512 * 1024);
  const huge = originalFiles.filter((file) => file.size >= 1024 * 1024);
  console.log("\nRisk flags");
  console.log(`  originals >= 512 KB : ${oversized.length}`);
  console.log(`  originals >= 1 MB   : ${huge.length}`);

  printByExtension(originalFiles);
  printTopFiles(originalFiles, "Largest original files");
  printTopFiles(thumbnailFiles, "Largest thumbnail files");
}

main();
