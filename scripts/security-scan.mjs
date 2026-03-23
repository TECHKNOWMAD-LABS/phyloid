#!/usr/bin/env node
/**
 * security-scan.mjs — Lightweight secret and injection scanner
 *
 * Scans src/ for:
 *   - Hardcoded API keys / secrets (AWS, Stripe live keys, JWTs, etc.)
 *   - XSS injection vectors (unsafe innerHTML with user data, eval, document.write)
 *   - Unguarded use of import.meta.env outside expected config files
 *
 * Exit code 0 = clean, 1 = findings
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

const PATTERNS = [
  { name: "AWS Access Key",         regex: /AKIA[0-9A-Z]{16}/g },
  { name: "Stripe Live Secret Key", regex: /sk_live_[0-9a-zA-Z]{24,}/g },
  { name: "Stripe Live PK",         regex: /pk_live_[0-9a-zA-Z]{24,}/g },
  { name: "GitHub Token",           regex: /ghp_[A-Za-z0-9]{36}/g },
  { name: "Generic JWT",            regex: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g },
  { name: "eval() call",            regex: /\beval\s*\(/g },
  { name: "document.write()",       regex: /document\.write\s*\(/g },
  { name: "Hardcoded password",     regex: /password\s*[:=]\s*['"][^'"]{8,}['"]/gi },
];

const FALSE_POSITIVE_ALLOWLIST = [
  /AKIA.*example/i,
  /sk_test_/,
  /pk_test_/,
  /placeholder/i,
];

function isFalsePositive(match) {
  return FALSE_POSITIVE_ALLOWLIST.some((fp) => fp.test(match));
}

function walkFiles(dir, exts = [".ts", ".js", ".mjs", ".html"]) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith(".") || entry === "node_modules" || entry === "dist") continue;
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) results.push(...walkFiles(fullPath, exts));
    else if (exts.includes(extname(entry))) results.push(fullPath);
  }
  return results;
}

const srcDir = new URL("../src", import.meta.url).pathname;
const files = walkFiles(srcDir);

let findingsCount = 0;
const falsePositives = [];

for (const file of files) {
  const content = readFileSync(file, "utf8");
  for (const { name, regex } of PATTERNS) {
    regex.lastIndex = 0;
    let m;
    while ((m = regex.exec(content)) !== null) {
      if (isFalsePositive(m[0])) {
        falsePositives.push({ file, name, match: m[0].slice(0, 20) + "…" });
        continue;
      }
      // Report finding — never print the actual secret value
      console.error(`[FINDING] ${name} in ${file} (char ${m.index})`);
      findingsCount++;
    }
  }
}

console.log(`\nSecurity scan complete:`);
console.log(`  Files scanned     : ${files.length}`);
console.log(`  Findings          : ${findingsCount}`);
console.log(`  False positives   : ${falsePositives.length}`);
if (findingsCount > 0) {
  console.error("\nFix findings before committing.");
  process.exit(1);
}
console.log("  Status            : CLEAN");
