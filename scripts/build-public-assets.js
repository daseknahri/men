const fs = require("fs/promises");
const path = require("path");
const esbuild = require("esbuild");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public-build");

const ASSETS = [
  { input: "style.css", loader: "css" },
  { input: "menu-page.css", loader: "css" },
  { input: "game.css", loader: "css" },
  { input: "shared-public.js", loader: "js" },
  { input: "app.js", loader: "js" },
  { input: "menu.js", loader: "js" },
  { input: "homepage-extras.js", loader: "js" },
  { input: "game.js", loader: "js" }
];

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function minifyAsset({ input, loader }) {
  const inputPath = path.join(ROOT, input);
  const source = await fs.readFile(inputPath, "utf8");
  const result = await esbuild.transform(source, {
    loader,
    minify: true,
    legalComments: "none",
    charset: "utf8",
    target: loader === "js" ? "es2019" : undefined
  });

  const outPath = path.join(OUT_DIR, input);
  await ensureDir(path.dirname(outPath));
  await fs.writeFile(outPath, result.code, "utf8");

  return {
    input,
    before: Buffer.byteLength(source),
    after: Buffer.byteLength(result.code)
  };
}

async function main() {
  await ensureDir(OUT_DIR);
  const results = [];

  for (const asset of ASSETS) {
    results.push(await minifyAsset(asset));
  }

  const totalBefore = results.reduce((sum, item) => sum + item.before, 0);
  const totalAfter = results.reduce((sum, item) => sum + item.after, 0);

  results.forEach((item) => {
    const saved = item.before - item.after;
    const pct = item.before > 0 ? Math.round((saved / item.before) * 100) : 0;
    console.log(`${item.input}: ${item.before} -> ${item.after} bytes (-${pct}%)`);
  });

  console.log(`Total: ${totalBefore} -> ${totalAfter} bytes`);
}

main().catch((error) => {
  console.error("Failed to build public assets:", error);
  process.exitCode = 1;
});
