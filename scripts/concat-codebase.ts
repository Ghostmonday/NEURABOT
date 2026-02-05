#!/usr/bin/env node
/**
 * Concatenate every line of project source code into one file with headers.
 * Project-agnostic: run from any repo. Copies content exactly (no regeneration).
 *
 * Usage:
 *   npx tsx concat-codebase.ts [rootDir] [outputFile]
 * Defaults: rootDir = cwd, outputFile = rootDir/BOTCODE.md
 */
import { createWriteStream, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve(process.argv[2] ?? process.cwd());
const OUT = process.argv[3] ? resolve(process.argv[3]) : join(ROOT, "BOTCODE.md");

const CODE_EXTS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".swift",
  ".kt",
  ".kts",
  ".py",
  ".go",
  ".sh",
  ".mdc",
]);
const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  "vendor",
  "coverage",
  ".build",
  ".swiftpm",
  ".pnpm-store",
  "__screenshots__",
  "playwright-report",
  "test-results",
  ".next",
  ".turbo",
]);

function collectFiles(dir: string, base: string): string[] {
  const out: string[] = [];
  let entries: { name: string; isDirectory: boolean }[];
  try {
    entries = readdirSync(dir, { withFileTypes: true }).map((e) => ({
      name: e.name,
      isDirectory: e.isDirectory(),
    }));
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = join(dir, e.name);
    const rel = relative(base, full);
    if (e.isDirectory) {
      if (SKIP_DIRS.has(e.name)) {
        continue;
      }
      out.push(...collectFiles(full, base));
    } else {
      const ext = e.name.includes(".") ? "." + e.name.split(".").pop()!.toLowerCase() : "";
      if (CODE_EXTS.has(ext)) {
        out.push(rel);
      }
    }
  }
  return out;
}

const files = collectFiles(ROOT, ROOT).toSorted();
const stream = createWriteStream(OUT, { encoding: "utf-8" });

const outBasename = process.argv[3] ? process.argv[3].replace(/^.*[/\\]/, "") : "BOTCODE.md";
stream.write(`# ${outBasename}\n\n`);
stream.write(
  "All project source code concatenated with file headers. Do not regenerate; this is a copy.\n",
);

for (const rel of files) {
  const abs = join(ROOT, rel);
  const header = `\n\n---\n## FILE: ${rel}\n\n`;
  stream.write(header);
  try {
    const raw = readFileSync(abs, "utf-8");
    stream.write(raw);
  } catch (err) {
    stream.write(`<!-- Could not read: ${String(err)} -->\n`);
  }
}

stream.end();
stream.on("finish", () => console.log(`Wrote ${files.length} files to ${OUT}`));
