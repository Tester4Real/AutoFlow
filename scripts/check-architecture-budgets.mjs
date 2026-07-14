#!/usr/bin/env node
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");
const args = new Set(process.argv.slice(2));
const strict = args.has("--strict");
const json = args.has("--json");

const sourceExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".jsx",
  ".mjs",
]);

const excludedDirectories = new Set([
  ".agents",
  ".git",
  ".serena",
  ".tokensave",
  "dist",
  "node_modules",
]);

const excludedPathParts = new Set([
  "src/project-studio/generated",
]);

const generatedBudgets = [
  {
    file: "src/project-studio/generated/studio.bundle.js",
    baselineBytes: 1656841,
  },
  {
    file: "src/project-studio/generated/studio.bundle.css",
    baselineBytes: 425681,
  },
];

const lineThresholds = Object.freeze({
  warn: 800,
  plan: 1200,
  block: 1500,
});

const generatedThresholds = Object.freeze({
  warnGrowth: 1.15,
  blockGrowth: 1.3,
});

function toPosix(relativePath) {
  return relativePath.split(path.sep).join("/");
}

function isExcluded(relativePath) {
  const posix = toPosix(relativePath);
  if (excludedPathParts.has(posix)) return true;
  return posix
    .split("/")
    .some((part) => excludedDirectories.has(part));
}

function classifyLines(lines) {
  if (lines >= lineThresholds.block) return "block";
  if (lines >= lineThresholds.plan) return "plan";
  if (lines >= lineThresholds.warn) return "warn";
  return "ok";
}

function classifyGenerated(bytes, baselineBytes) {
  if (typeof bytes !== "number") return "missing";
  if (bytes > baselineBytes * generatedThresholds.blockGrowth) return "block";
  if (bytes > baselineBytes * generatedThresholds.warnGrowth) return "warn";
  return "ok";
}

function countLines(source) {
  if (!source) return 0;
  return source.split(/\r\n|\r|\n/).length;
}

async function walk(directory, base = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = base ? path.join(base, entry.name) : entry.name;
    if (isExcluded(relativePath)) continue;

    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(absolutePath, relativePath));
      continue;
    }

    if (!entry.isFile()) continue;
    if (!sourceExtensions.has(path.extname(entry.name))) continue;
    files.push(relativePath);
  }

  return files;
}

async function sourceReport() {
  const files = await walk(root);
  const records = [];

  for (const relativePath of files) {
    const absolutePath = path.join(root, relativePath);
    const source = await readFile(absolutePath, "utf8");
    const lines = countLines(source);
    records.push({
      file: toPosix(relativePath),
      lines,
      status: classifyLines(lines),
    });
  }

  records.sort((a, b) => b.lines - a.lines || a.file.localeCompare(b.file));
  return records;
}

async function generatedReport() {
  const records = [];

  for (const budget of generatedBudgets) {
    const absolutePath = path.join(root, budget.file);
    try {
      const info = await stat(absolutePath);
      const growth = info.size / budget.baselineBytes;
      records.push({
        file: budget.file,
        bytes: info.size,
        baselineBytes: budget.baselineBytes,
        growth,
        status: classifyGenerated(info.size, budget.baselineBytes),
      });
    } catch (error) {
      if (error && error.code !== "ENOENT") throw error;
      records.push({
        file: budget.file,
        bytes: null,
        baselineBytes: budget.baselineBytes,
        growth: null,
        status: "missing",
      });
    }
  }

  return records;
}

function summarize(sourceRecords, generatedRecords) {
  const sourceCounts = { ok: 0, warn: 0, plan: 0, block: 0 };
  sourceRecords.forEach((record) => {
    sourceCounts[record.status] += 1;
  });

  const generatedCounts = { ok: 0, warn: 0, block: 0, missing: 0 };
  generatedRecords.forEach((record) => {
    generatedCounts[record.status] += 1;
  });

  return {
    strict,
    sourceThresholds: lineThresholds,
    generatedThresholds,
    sourceCounts,
    generatedCounts,
    sourceFindings: sourceRecords.filter((record) => record.status !== "ok"),
    generatedFindings: generatedRecords.filter((record) => record.status !== "ok"),
  };
}

function formatBytes(bytes) {
  if (typeof bytes !== "number") return "missing";
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function printText(report) {
  console.log("Architecture budget report");
  console.log(
    `Source thresholds: warn ${lineThresholds.warn}, plan ${lineThresholds.plan}, block ${lineThresholds.block} lines`,
  );

  if (!report.sourceFindings.length) {
    console.log("Source: no maintained files over budget.");
  } else {
    console.log("Source findings:");
    report.sourceFindings.forEach((record) => {
      console.log(`  [${record.status}] ${record.lines} lines  ${record.file}`);
    });
  }

  console.log(
    `Generated thresholds: warn +${Math.round((generatedThresholds.warnGrowth - 1) * 100)}%, block +${Math.round((generatedThresholds.blockGrowth - 1) * 100)}%`,
  );

  if (!report.generatedFindings.length) {
    console.log("Generated bundles: within baseline growth budgets.");
  } else {
    console.log("Generated bundle findings:");
    report.generatedFindings.forEach((record) => {
      const growth =
        typeof record.growth === "number" ? ` (${((record.growth - 1) * 100).toFixed(1)}%)` : "";
      console.log(
        `  [${record.status}] ${formatBytes(record.bytes)} / ${formatBytes(record.baselineBytes)}${growth}  ${record.file}`,
      );
    });
  }

  if (!strict) {
    console.log("Mode: report-only. Use --strict to fail blocking findings.");
  }
}

const sourceRecords = await sourceReport();
const generatedRecords = await generatedReport();
const report = summarize(sourceRecords, generatedRecords);

if (json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  printText(report);
}

const hasStrictFailure =
  report.sourceFindings.some((record) => record.status === "block") ||
  report.generatedFindings.some((record) => record.status === "block");

if (strict && hasStrictFailure) {
  process.exitCode = 1;
}
