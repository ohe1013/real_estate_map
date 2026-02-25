#!/usr/bin/env node
import { execSync } from "node:child_process";

function run(command) {
  return execSync(command, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
    .trim()
    .split("\n")
    .filter(Boolean);
}

const changedFiles = run("git diff --name-only --diff-filter=ACMRTUXB HEAD")
  .filter((file) => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(file))
  .filter((file) => !file.startsWith(".next/"));

if (changedFiles.length === 0) {
  console.log("[lint:changed] No changed JS/TS files detected.");
  process.exit(0);
}

console.log(`[lint:changed] Running ESLint for ${changedFiles.length} files...`);
execSync(`npx eslint ${changedFiles.map((file) => `"${file}"`).join(" ")}`, {
  stdio: "inherit",
});
