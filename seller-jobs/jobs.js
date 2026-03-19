const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const SELLER_JOBS_ROOT = __dirname;
const SELLER_JOBS_RUNS_DIR = path.join(SELLER_JOBS_ROOT, "runs");
const DEFAULT_PHASE_DIRS = ["input", "extraction", "branding", "media", "review", "final"];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function ensureSellerJobsStructure() {
  ensureDir(SELLER_JOBS_RUNS_DIR);
}

function createSellerJob(kind = "import") {
  ensureSellerJobsStructure();
  const safeKind = String(kind || "job").trim().replace(/[^a-z0-9_-]+/gi, "-") || "job";
  const jobId = `${safeKind}_${Date.now()}_${crypto.randomBytes(5).toString("hex")}`;
  const jobDir = path.join(SELLER_JOBS_RUNS_DIR, jobId);

  DEFAULT_PHASE_DIRS.forEach((dirName) => {
    ensureDir(path.join(jobDir, dirName));
  });

  return { jobId, jobDir };
}

function resolveJobDir(jobId) {
  const safeJobId = String(jobId || "").trim();
  if (!safeJobId) throw new Error("seller_job_id_required");
  return path.join(SELLER_JOBS_RUNS_DIR, safeJobId);
}

function writeSellerJobText(jobId, relativePath, content) {
  const jobDir = resolveJobDir(jobId);
  const outputPath = path.join(jobDir, relativePath);
  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(outputPath, String(content ?? ""), "utf8");
  return outputPath;
}

function writeSellerJobJson(jobId, relativePath, value) {
  return writeSellerJobText(jobId, relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function copyFileIntoSellerJob(jobId, relativeDir, sourceFilePath, filename = "") {
  const absoluteSourcePath = path.resolve(String(sourceFilePath || ""));
  if (!absoluteSourcePath || !fs.existsSync(absoluteSourcePath)) {
    throw new Error("seller_job_source_missing");
  }

  const jobDir = resolveJobDir(jobId);
  const cleanDir = String(relativeDir || "").trim();
  const targetDir = path.join(jobDir, cleanDir);
  ensureDir(targetDir);

  const targetFilename = String(filename || "").trim() || path.basename(absoluteSourcePath);
  const outputPath = path.join(targetDir, targetFilename);
  fs.copyFileSync(absoluteSourcePath, outputPath);
  return outputPath;
}

module.exports = {
  SELLER_JOBS_ROOT,
  ensureSellerJobsStructure,
  createSellerJob,
  writeSellerJobJson,
  writeSellerJobText,
  copyFileIntoSellerJob
};
