import { build } from "tsup";
import { copyFile, mkdir } from "fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");

await build({
  entry: {
    background: path.join(rootDir, "src/background.ts"),
    popup: path.join(rootDir, "src/popup/index.tsx"),
  },
  sourcemap: true,
  format: ["esm"],
  clean: true,
  dts: false,
  splitting: false,
  outDir: distDir,
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "production"),
  },
});

await mkdir(distDir, { recursive: true });
await copyFile(path.join(rootDir, "manifest.json"), path.join(distDir, "manifest.json"));
await copyFile(path.join(rootDir, "src/popup/index.html"), path.join(distDir, "popup.html"));
