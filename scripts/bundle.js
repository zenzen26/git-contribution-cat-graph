// scripts/bundle.js
// Bundles the entire project into a single precompiled JS file
// so users don't need to npm install anything when using the GitHub Action.

const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

async function bundle() {
  console.log("📦 Bundling with esbuild...");

  await esbuild.build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    platform: "node",
    target: "node20",
    outfile: "dist/index.js",
    minify: false,
    sourcemap: false,
  });

  // Make it executable
  const filePath = path.resolve("dist/index.js");
  fs.chmodSync(filePath, "755");

  console.log("✅ Bundle complete: dist/index.js");
  console.log(`   Size: ${(fs.statSync(filePath).size / 1024).toFixed(1)} KB`);
}

bundle().catch(err => {
  console.error("Bundle failed:", err);
  process.exit(1);
});
