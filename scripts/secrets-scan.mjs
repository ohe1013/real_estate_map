#!/usr/bin/env node
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const patterns = [
  { name: "aws_access_key", regex: "AKIA[0-9A-Z]{16}" },
  { name: "google_api_key", regex: "AIza[0-9A-Za-z-_]{35}" },
  { name: "slack_token", regex: "xox[baprs]-[0-9A-Za-z-]{10,}" },
  { name: "private_key", regex: "-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----" },
  { name: "generic_secret", regex: "(api[_-]?key|secret|token)\\s*[:=]\\s*[\"'][A-Za-z0-9_\\-]{16,}[\"']" },
];

function safeExec(command) {
  try {
    return execSync(command, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 1024 * 1024 * 20,
    }).trim();
  } catch (error) {
    if (error && typeof error === "object" && "stdout" in error) {
      return String(error.stdout || "").trim();
    }
    return "";
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  workingTree: [],
  gitHistory: [],
};

for (const pattern of patterns) {
  const workingTreeMatches = safeExec(
    `git grep -nIi -E "${pattern.regex}" -- . ':(exclude).env' ':(exclude).env.local'`
  )
    .split("\n")
    .filter(Boolean)
    .slice(0, 200);

  report.workingTree.push({
    pattern: pattern.name,
    regex: pattern.regex,
    count: workingTreeMatches.length,
    matches: workingTreeMatches,
  });

  const historyMatches = safeExec(
    `git rev-list --all | xargs -I{} git grep -nIi -E "${pattern.regex}" {} -- . ':(exclude).env' ':(exclude).env.local'`
  )
    .split("\n")
    .filter(Boolean)
    .slice(0, 400);

  report.gitHistory.push({
    pattern: pattern.name,
    regex: pattern.regex,
    count: historyMatches.length,
    matches: historyMatches,
  });
}

mkdirSync("docs/security", { recursive: true });
writeFileSync("docs/security/secrets-scan-latest.json", JSON.stringify(report, null, 2));

const totalWorkingTree = report.workingTree.reduce((sum, item) => sum + item.count, 0);
const totalHistory = report.gitHistory.reduce((sum, item) => sum + item.count, 0);

console.log(`[secrets-scan] report written: docs/security/secrets-scan-latest.json`);
console.log(`[secrets-scan] working-tree matches: ${totalWorkingTree}`);
console.log(`[secrets-scan] git-history matches: ${totalHistory}`);
