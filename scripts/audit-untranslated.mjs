#!/usr/bin/env node
/**
 * Audit T3 Code's client JS bundles inside app.asar against the compiled zh-cn-i18n.js runtime.
 * Usage:
 *   node scripts/audit-untranslated.mjs [--filter <substring>] [--app-path <path>]
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);

const args = process.argv.slice(2);
let filter = "";
let customAppPath = process.env.T3_CODE_APP_PATH || "";
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--filter" && args[i + 1]) filter = args[++i];
  else if (args[i] === "--app-path" && args[i + 1]) customAppPath = args[++i];
}

function findAsar(custom) {
  const home = os.homedir();
  const candidates = custom
    ? [
        custom.endsWith(".asar") ? custom : path.join(custom, "Contents/Resources/app.asar"),
        path.join(custom, "resources/app.asar"),
        path.join(custom, "app.asar")
      ]
    : [
        "/Applications/T3 Code (Beta).app/Contents/Resources/app.asar.bak",
        "/Applications/T3 Code (Beta).app/Contents/Resources/app.asar",
        "/Applications/T3 Code.app/Contents/Resources/app.asar.bak",
        "/Applications/T3 Code.app/Contents/Resources/app.asar",
        path.join(home, "Applications/T3 Code (Beta).app/Contents/Resources/app.asar")
      ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error("Could not find T3 Code app.asar. Pass --app-path <path>.");
}

const { buildI18nBundle } = await import(path.join(rootDir, "build-i18n.mjs"));
const bundlePath = path.join(rootDir, "dist", "zh-cn-i18n.js");
buildI18nBundle(bundlePath);
require(bundlePath);
const tr = globalThis.__t3TrForceZh;

const asarPath = findAsar(customAppPath);
const asarBuf = fs.readFileSync(asarPath);
const headerSize = asarBuf.readUInt32LE(12);
const header = JSON.parse(asarBuf.subarray(16, 16 + headerSize).toString("utf8"));
const dataOffset = 8 + asarBuf.readUInt32LE(4);
const assets = header.files.apps.files.server.files.dist.files.client.files.assets.files;

const strRe = /(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|`((?:[^`$\\]|\\.)*)`)/g;
const chinglish = [];
const cjkSpaced = [];
const untranslatedByFile = new Map();

for (const [name, meta] of Object.entries(assets)) {
  if (!name.endsWith(".js") || name === "zh-cn-i18n.js") continue;
  if (/^(?:de|en|es|fr|ja|ko|pt-BR|ru|sv|zh)-[A-Za-z0-9_-]+\.js$/.test(name)) continue;
  if (filter && !name.toLowerCase().includes(filter.toLowerCase())) continue;

  const off = dataOffset + Number(meta.offset);
  const code = asarBuf.subarray(off, off + meta.size).toString("utf8");
  let m;
  while ((m = strRe.exec(code)) !== null) {
    const raw = (m[1] ?? m[2] ?? m[3] ?? "")
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'");
    if (!raw || raw.length < 3 || raw.length > 260) continue;
    if (!/[A-Z]/.test(raw) && !/\s/.test(raw)) continue;
    if (/^[a-z0-9_./:@#$-]+$/i.test(raw)) continue;
    if (/[{};=<>]/.test(raw)) continue;
    if (/\b(?:flex|grid|bg-|text-|border-|rounded-|px-|py-|gap-|items-|justify-)\b/.test(raw)) continue;

    const out = tr(raw);
    if (out !== raw) {
      if (/[\u4e00-\u9fff][ ]+[\u4e00-\u9fff]/.test(out)) {
        cjkSpaced.push({ file: name, raw, out });
      }
      if (/[\u4e00-\u9fff]/.test(out) && /\b[a-z]{3,}\s+[a-z]{3,}\b/.test(out) && !/`/.test(out)) {
        chinglish.push({ file: name, raw, out });
      }
    } else if (/^[A-Z][A-Za-z0-9 ,.'“”‘’?!:;()-]{4,}$/.test(raw) && /\s/.test(raw)) {
      if (!untranslatedByFile.has(name)) untranslatedByFile.set(name, new Set());
      untranslatedByFile.get(name).add(raw);
    }
  }
}

console.log(`Audited ASAR: ${asarPath}`);
console.log(`CJK-space-CJK anomalies: ${cjkSpaced.length}`);
for (const item of cjkSpaced.slice(0, 15)) {
  console.log(`  [CJK-Space] ${item.file}: ${JSON.stringify(item.raw)} => ${JSON.stringify(item.out)}`);
}

console.log(`Potential half-translated Chinglish strings: ${chinglish.length}`);
for (const item of chinglish.slice(0, 20)) {
  console.log(`  [Mixed] ${item.file}: ${JSON.stringify(item.raw)} => ${JSON.stringify(item.out)}`);
}

if (filter) {
  for (const [file, set] of untranslatedByFile.entries()) {
    console.log(`\n=== Untranslated UI candidates in ${file} (${set.size}) ===`);
    for (const s of [...set].slice(0, 80)) {
      console.log(`  - ${JSON.stringify(s)}`);
    }
  }
} else {
  let totalCandidates = 0;
  for (const set of untranslatedByFile.values()) totalCandidates += set.size;
  console.log(`Untranslated multi-word English candidates across bundles: ${totalCandidates} (pass --filter <bundle> to inspect)`);
}
