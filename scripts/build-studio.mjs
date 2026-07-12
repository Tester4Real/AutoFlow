import { build } from "esbuild";
import { copyFile, mkdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");
const outdirArgument = process.argv.find((argument) => argument.startsWith("--outdir="));
const outdir = outdirArgument
  ? path.resolve(root, outdirArgument.slice("--outdir=".length))
  : path.join(root, "src", "project-studio", "generated");

await mkdir(path.join(outdir, "assets"), { recursive: true });

await build({
  entryPoints: [path.join(root, "src", "project-studio", "react", "studio.jsx")],
  bundle: true,
  format: "iife",
  target: ["chrome120"],
  outdir,
  entryNames: "studio.bundle",
  assetNames: "assets/[name]-[hash]",
  jsx: "automatic",
  legalComments: "none",
  minify: false,
  sourcemap: false,
  logLevel: "info",
});

const tailwindExecutable = path.join(
  root,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "tailwindcss.cmd" : "tailwindcss",
);
const cssResult = spawnSync(
  tailwindExecutable,
  [
    "-i",
    path.join(root, "src", "project-studio", "react", "studio-tailwind.css"),
    "-o",
    path.join(outdir, "studio.bundle.css"),
    "--minify",
  ],
  { cwd: root, encoding: "utf8", shell: process.platform === "win32" },
);
if (cssResult.status !== 0) {
  throw new Error(cssResult.stderr || cssResult.stdout || "Studio CSS build failed.");
}

for (const weight of [400, 500, 600, 700]) {
  await copyFile(
    path.join(
      root,
      "node_modules",
      "@fontsource",
      "poppins",
      "files",
      `poppins-latin-${weight}-normal.woff2`,
    ),
    path.join(outdir, "assets", `poppins-${weight}.woff2`),
  );
}
