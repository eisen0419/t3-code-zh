#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import vm from "node:vm";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const I18N_ASSET_PATH = path.join(__dirname, "dist", "zh-cn-i18n.js");
const ONEPASSWORD_PRELOAD_PATH = path.join(__dirname, "onepassword-preload.js");
const PERSISTENT_WATCHER_DIR = path.join(os.homedir(), ".t3", "zh-cn-patcher");
const LAUNCH_AGENT_LABEL = "com.t3code.zh-cn.patcher";
const LAUNCH_AGENT_PLIST = path.join(
  os.homedir(),
  "Library",
  "LaunchAgents",
  `${LAUNCH_AGENT_LABEL}.plist`
);

const BLOCK_SIZE = 4 * 1024 * 1024; // 4 MiB standard ASAR integrity block size

function parseArgs(argv) {
  const args = argv.slice(2);
  let command = "apply";
  let appPath = process.env.T3_CODE_APP_PATH || null;
  let onlyIfUnpatched = false;
  let with1Password = false;
  let showHelp = false;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "-h" || a === "--help" || a === "help") {
      showHelp = true;
    } else if (a === "--if-unpatched") {
      onlyIfUnpatched = true;
    } else if (a === "--with-1password") {
      with1Password = true;
    } else if (a === "--app-path" && args[i + 1]) {
      appPath = args[++i];
    } else if (a.startsWith("--app-path=")) {
      appPath = a.slice("--app-path=".length);
    } else if (!a.startsWith("-")) {
      command = a;
    }
  }

  return { command, appPath, onlyIfUnpatched, with1Password, showHelp };
}

function printHelp() {
  console.log(`
T3 Code 简体中文汉化工具 (t3-code-zh)

用法 / Usage:
  npx t3-code-zh [command] [options]

命令 / Commands:
  apply              一键汉化 T3 Code（默认命令）
  restore            还原为官方英文原版（并移除自动更新守护）
  status             查看当前 T3 Code 版本、汉化状态与守护状态
  install-watcher    汉化并安装 macOS 自动更新守护（客户端升级后自动重打补丁）
  uninstall-watcher  卸载 macOS 自动更新守护

选项 / Options:
  --app-path <path>  手动指定 T3 Code 安装路径（支持 .app 目录、安装根目录或 app.asar 路径）
  --if-unpatched     仅当检测到未汉化时才执行补丁（供后台更新守护调用）
  -h, --help         显示帮助信息
`.trim());
}

function getCandidateResourcesDirs(customPath) {
  if (customPath) {
    const resolved = path.resolve(customPath);
    if (resolved.endsWith("app.asar")) {
      return [path.dirname(resolved)];
    }
    return [
      path.join(resolved, "Contents", "Resources"),
      path.join(resolved, "resources"),
      resolved
    ];
  }

  const home = os.homedir();
  if (process.platform === "darwin") {
    return [
      "/Applications/T3 Code (Beta).app/Contents/Resources",
      "/Applications/T3 Code.app/Contents/Resources",
      path.join(home, "Applications/T3 Code (Beta).app/Contents/Resources"),
      path.join(home, "Applications/T3 Code.app/Contents/Resources")
    ];
  }

  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA || path.join(home, "AppData", "Local");
    const programFiles = process.env.PROGRAMFILES || "C:\\Program Files";
    return [
      path.join(localAppData, "Programs", "T3 Code (Beta)", "resources"),
      path.join(localAppData, "Programs", "T3 Code", "resources"),
      path.join(localAppData, "Programs", "t3-code", "resources"),
      path.join(programFiles, "T3 Code (Beta)", "resources"),
      path.join(programFiles, "T3 Code", "resources")
    ];
  }

  // Linux
  return [
    "/opt/T3 Code (Beta)/resources",
    "/opt/T3 Code/resources",
    "/opt/t3-code/resources",
    "/usr/lib/t3-code/resources",
    path.join(home, ".local/share/t3-code/resources")
  ];
}

function resolveAppResourcesDir(customPath) {
  const candidates = getCandidateResourcesDirs(customPath);
  for (const resDir of candidates) {
    if (fs.existsSync(path.join(resDir, "app.asar"))) {
      return resDir;
    }
  }
  throw new Error(
    `未找到 T3 Code 的 app.asar，已检查路径：\n  - ${candidates.join("\n  - ")}\n请使用 --app-path <路径> 手动指定 T3 Code 安装位置。`
  );
}

function computeIntegrity(buffer) {
  const hash = crypto.createHash("sha256").update(buffer).digest("hex");
  const blocks = [];
  for (let offset = 0; offset < buffer.length; offset += BLOCK_SIZE) {
    const slice = buffer.subarray(offset, Math.min(offset + BLOCK_SIZE, buffer.length));
    blocks.push(crypto.createHash("sha256").update(slice).digest("hex"));
  }
  if (blocks.length === 0) {
    blocks.push(crypto.createHash("sha256").update(Buffer.alloc(0)).digest("hex"));
  }
  return {
    algorithm: "SHA256",
    hash,
    blockSize: BLOCK_SIZE,
    blocks
  };
}

function readAsarHeader(asarPath) {
  const fd = fs.openSync(asarPath, "r");
  try {
    const sizeBuf = Buffer.alloc(16);
    fs.readSync(fd, sizeBuf, 0, 16, 0);
    const headerPickleSize = sizeBuf.readUInt32LE(4);
    const headerStringSize = sizeBuf.readUInt32LE(12);
    const paddedHeaderSize = headerPickleSize - 8;
    const dataOffset = 16 + paddedHeaderSize;
    const headerBuf = Buffer.alloc(headerStringSize);
    fs.readSync(fd, headerBuf, 0, headerStringSize, 16);
    const header = JSON.parse(headerBuf.toString("utf8"));
    return { header, dataOffset };
  } finally {
    fs.closeSync(fd);
  }
}

function getFileNode(header, relPath) {
  const parts = relPath.split("/");
  let curr = header;
  for (const part of parts) {
    if (!curr.files || !curr.files[part]) return null;
    curr = curr.files[part];
  }
  return curr;
}

function setFileNode(header, relPath, nodeObj) {
  const parts = relPath.split("/");
  let curr = header;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!curr.files) curr.files = {};
    if (!curr.files[part]) curr.files[part] = { files: {} };
    curr = curr.files[part];
  }
  curr.files[parts[parts.length - 1]] = nodeObj;
}

function readFileFromAsar(fd, dataOffset, header, relPath) {
  const node = getFileNode(header, relPath);
  if (!node || typeof node.size !== "number") {
    throw new Error(`File not found in ASAR: ${relPath}`);
  }
  const buf = Buffer.alloc(node.size);
  fs.readSync(fd, buf, 0, node.size, dataOffset + Number(node.offset));
  return buf.toString("utf8");
}

function readAsarVersion(asarPath) {
  try {
    const { header, dataOffset } = readAsarHeader(asarPath);
    const fd = fs.openSync(asarPath, "r");
    try {
      for (const pkgPath of ["apps/desktop/package.json", "package.json"]) {
        const node = getFileNode(header, pkgPath);
        if (node && typeof node.size === "number") {
          const pkg = JSON.parse(readFileFromAsar(fd, dataOffset, header, pkgPath));
          if (pkg && pkg.version) return String(pkg.version);
        }
      }
    } finally {
      fs.closeSync(fd);
    }
  } catch {}
  return "unknown";
}

function findClientAsset(header, regex) {
  const assetsDir = getFileNode(header, "apps/server/dist/client/assets");
  if (!assetsDir || !assetsDir.files) return null;
  const matches = Object.keys(assetsDir.files).filter(name => regex.test(name));
  if (matches.length === 0) return null;
  return `apps/server/dist/client/assets/${matches[0]}`;
}

function replaceRequiredRegex(source, regex, replacement, label) {
  if (!regex.test(source)) {
    throw new Error(`Required patch target not found for [${label}]`);
  }
  return source.replace(regex, replacement);
}

function replaceOptionalRegex(source, regex, replacement, label) {
  if (!regex.test(source)) {
    console.warn(`[WARN] Optional patch skipped (pattern changed in this version): ${label}`);
    return { code: source, applied: false };
  }
  return { code: source.replace(regex, replacement), applied: true };
}

/**
 * Automatically extract official en -> zh string & template pairs from T3 Code v0.1.10+
 * General Translation catalog bundles inside app.asar so brand-new upstream strings are
 * absorbed immediately during updates even before the open-source dictionary is updated.
 */
function evalPureCatalogModule(code) {
  const expIdx = code.lastIndexOf("export{");
  if (expIdx === -1) return null;
  const body = code.slice(0, expIdx);
  const expPart = code.slice(expIdx + 7, code.lastIndexOf("}"));
  const pairs = expPart
    .split(",")
    .map(s => {
      const m = /^\s*([A-Za-z0-9_$]+)(?:\s+as\s+([A-Za-z0-9_$]+))?\s*$/.exec(s);
      return m ? `${JSON.stringify(m[2] || m[1])}:${m[1]}` : "";
    })
    .filter(Boolean);
  const ctx = vm.createContext(Object.create(null));
  const mod = vm.runInNewContext(`(function(){${body}\nreturn {${pairs.join(",")}};})()`, ctx, {
    timeout: 2000
  });
  return mod?.default || mod;
}

function extractUpstreamGtCatalog(srcFd, dataOffset, header) {
  const extraExact = {};
  const extraTemplates = {};
  try {
    const enAssetPath = findClientAsset(header, /^en-[A-Za-z0-9_-]+\.js$/);
    const zhAssetPath = findClientAsset(header, /^zh-[A-Za-z0-9_-]+\.js$/);
    if (!enAssetPath || !zhAssetPath) return { extraExact, extraTemplates };

    const enObj = evalPureCatalogModule(readFileFromAsar(srcFd, dataOffset, header, enAssetPath));
    const zhObj = evalPureCatalogModule(readFileFromAsar(srcFd, dataOffset, header, zhAssetPath));
    if (!enObj || !zhObj) return { extraExact, extraTemplates };

    for (const [k, enVal] of Object.entries(enObj)) {
      const zhVal = zhObj[k];
      if (typeof enVal !== "string" || typeof zhVal !== "string" || enVal === zhVal) continue;
      if (/Shanghai|Beijing|上海|北京/i.test(zhVal)) continue;

      if (!enVal.includes("{") && !enVal.includes("<")) {
        // Skip lowercase space-separated search-index keyword lists (never rendered as UI text)
        if (/^[a-z0-9 ./+-]+$/.test(enVal) && enVal.split(" ").length >= 4) continue;
        extraExact[enVal] = zhVal;
      } else if (!enVal.includes(", plural,") && !enVal.includes(", select,")) {
        const stripped = enVal.replace(/\{[A-Za-z0-9_]+\}/g, "");
        if (stripped.includes("{") || stripped.includes("}") || stripped.includes("<")) continue;
        const vars = [...enVal.matchAll(/\{([A-Za-z0-9_]+)\}/g)].map(m => m[1]);
        const zhVars = [...zhVal.matchAll(/\{([A-Za-z0-9_]+)\}/g)].map(m => m[1]);
        if (
          vars.length >= 1 &&
          vars.length <= 4 &&
          new Set(vars).size === vars.length &&
          zhVars.every(v => vars.includes(v))
        ) {
          const litLetters = (stripped.match(/[A-Za-z]/g) || []).length;
          if (litLetters >= 6) {
            const tmplKey = enVal.replace(/\{[A-Za-z0-9_]+\}/g, "${}");
            const sameOrder =
              vars.length === zhVars.length && vars.every((v, idx) => v === zhVars[idx]);
            extraTemplates[tmplKey] = sameOrder
              ? zhVal.replace(/\{[A-Za-z0-9_]+\}/g, "${}")
              : zhVal.replace(
                  /\{([A-Za-z0-9_]+)\}/g,
                  (_m, vName) => `\${${vars.indexOf(vName) + 1}}`
                );
          }
        }
      }
    }
  } catch (err) {
    console.warn("[WARN] Upstream GT catalog extraction skipped:", err.message);
  }
  return { extraExact, extraTemplates };
}

/**
 * Pre-flight V8 syntax validation gate: ensures every modified .js / .cjs buffer
 * parses cleanly BEFORE tmpAsarPath ever replaces app.asar.
 */
function verifyModifiedBundles(modifiedFiles) {
  for (const [relPath, buf] of modifiedFiles.entries()) {
    if (relPath.endsWith(".cjs")) {
      const code = buf.toString("utf8");
      new vm.Script(code, { filename: relPath });
    } else if (relPath.endsWith(".js")) {
      execFileSync(process.execPath, ["--check", "--input-type=module"], {
        input: buf,
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 15000
      });
    }
  }
}

function buildMainProcessI18nHelper({ enable1Password = false } = {}) {
  const onePasswordBridgeSection = enable1Password
    ? `
  // --- Optional 1Password Built-in Browser Extension Main Process Bridge ---
  const childProcess = require("node:child_process");
  const OP_CANDIDATE_PATHS = ["/usr/local/bin/op", "/opt/homebrew/bin/op", "/usr/bin/op"];
  function resolveOpBinary() {
    for (const p of OP_CANDIDATE_PATHS) {
      try { if (fs.existsSync(p)) return p; } catch {}
    }
    return "op";
  }
  function getOpEnv() {
    return {
      ...process.env,
      PATH: ["/usr/local/bin", "/opt/homebrew/bin", "/usr/bin", "/bin", "/usr/sbin", "/sbin", process.env.PATH || ""].filter(Boolean).join(":")
    };
  }
  function execOp(args, timeoutMs = 60000) {
    const opBin = resolveOpBinary();
    return new Promise((resolve, reject) => {
      childProcess.execFile(opBin, args, { env: getOpEnv(), timeout: timeoutMs, maxBuffer: 32 * 1024 * 1024 }, (err, stdout, stderr) => {
        if (err) {
          const detail = (stderr || err.message || "").trim();
          reject(new Error(detail || "1Password CLI (op) failed"));
          return;
        }
        resolve(stdout);
      });
    });
  }
  function extractRegistrableDomain(hostname) {
    if (!hostname) return "";
    const h = String(hostname).toLowerCase().replace(/^www\\./, "");
    const parts = h.split(".").filter(Boolean);
    if (parts.length <= 2) return h;
    const twoPartTlds = new Set(["co.uk", "org.uk", "ac.uk", "com.cn", "net.cn", "org.cn", "gov.cn", "edu.cn", "com.hk", "co.jp", "ne.jp", "or.jp", "com.au", "com.tw", "com.sg"]);
    const lastTwo = parts.slice(-2).join(".");
    if (twoPartTlds.has(lastTwo) && parts.length >= 3) return parts.slice(-3).join(".");
    return lastTwo;
  }
  let opCachedItems = null;
  let opCachedAt = 0;
  let opInFlightPromise = null;
  const OP_CACHE_TTL_MS = 5 * 60 * 1000;
  async function loadOpLoginItems(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && opCachedItems && now - opCachedAt < OP_CACHE_TTL_MS) return opCachedItems;
    if (opInFlightPromise) return opInFlightPromise;
    opInFlightPromise = (async () => {
      try {
        const stdout = await execOp(["item", "list", "--categories", "Login", "--format", "json"]);
        const raw = JSON.parse(stdout || "[]");
        const normalized = (Array.isArray(raw) ? raw : []).map(item => {
          const urls = (item.urls || []).map(u => u?.href).filter(Boolean);
          const domains = [];
          let primaryUrl = "";
          for (const u of urls) {
            if (!primaryUrl) primaryUrl = u;
            try {
              const parsed = new URL(/^https?:\\/\\//i.test(u) ? u : "https://" + u);
              if (parsed.hostname) {
                const cleanHost = parsed.hostname.toLowerCase().replace(/^www\\./, "");
                if (!domains.includes(cleanHost)) domains.push(cleanHost);
              }
            } catch {}
          }
          const primaryObj = (item.urls || []).find(u => u?.primary && u?.href);
          if (primaryObj?.href) primaryUrl = primaryObj.href;
          return {
            id: item.id,
            title: item.title || "Untitled",
            username: item.additional_information || "",
            vaultId: item.vault?.id || "",
            vaultName: item.vault?.name || "",
            urls,
            domains,
            primaryDomain: domains[0] || "",
            primaryUrl,
            updatedAt: item.updated_at || ""
          };
        });
        normalized.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
        opCachedItems = normalized;
        opCachedAt = Date.now();
        return normalized;
      } finally {
        opInFlightPromise = null;
      }
    })();
    return opInFlightPromise;
  }
  try {
    electron.ipcMain?.handle("t3:1password:list", async (_event, payload) => {
      try {
        const forceRefresh = Boolean(payload?.forceRefresh);
        const items = await loadOpLoginItems(forceRefresh);
        let pageHost = String(payload?.domain || "").toLowerCase().replace(/^www\\./, "");
        if (!pageHost && payload?.url) {
          try { pageHost = new URL(payload.url).hostname.toLowerCase().replace(/^www\\./, ""); } catch {}
        }
        const pageRoot = extractRegistrableDomain(pageHost);
        const pageKeyword = pageRoot ? pageRoot.split(".")[0] : "";
        const matched = [], others = [];
        for (const item of items) {
          let score = 0;
          if (pageHost) {
            if (item.domains.some(d => d === pageHost)) score = 100;
            else if (pageRoot && item.domains.some(d => extractRegistrableDomain(d) === pageRoot)) score = 85;
            else if (pageKeyword && pageKeyword.length >= 3 && pageKeyword !== "localhost" && item.title.toLowerCase().includes(pageKeyword)) score = 60;
          }
          if (score > 0) matched.push({ ...item, matchScore: score });
          else others.push(item);
        }
        matched.sort((a, b) => b.matchScore - a.matchScore || String(b.updatedAt).localeCompare(String(a.updatedAt)));
        return { ok: true, matched, others, total: items.length, locale: getMainLocale() };
      } catch (err) {
        return { ok: false, error: err?.message || String(err), locale: getMainLocale() };
      }
    });
    electron.ipcMain?.handle("t3:1password:get", async (_event, payload) => {
      try {
        const itemId = payload?.itemId;
        const vaultId = payload?.vaultId;
        if (!itemId) throw new Error("Missing itemId");
        const args = ["item", "get", String(itemId), "--format", "json"];
        if (vaultId) args.push("--vault", String(vaultId));
        const stdout = await execOp(args);
        const detail = JSON.parse(stdout || "{}");
        const fields = Array.isArray(detail.fields) ? detail.fields : [];
        let username = "", password = "", otp = "", hasOtpField = false;
        for (const f of fields) {
          if (!f) continue;
          if (f.type === "OTP" || typeof f.totp === "string") {
            hasOtpField = true;
            if (f.totp && !otp) otp = String(f.totp).trim();
          }
          if (!username && f.value && (f.purpose === "USERNAME" || f.id === "username" || /^(username|user|email|e-mail|account|login|phone|mobile|用户名|账号|邮箱|手机)$/i.test(f.label || ""))) {
            username = String(f.value);
          }
          if (!password && f.value && (f.purpose === "PASSWORD" || f.id === "password" || f.type === "CONCEALED")) {
            password = String(f.value);
          }
        }
        if (!username && detail.additional_information) username = String(detail.additional_information);
        if (!otp && hasOtpField) {
          try {
            const otpArgs = ["item", "get", String(itemId), "--otp"];
            if (vaultId) otpArgs.push("--vault", String(vaultId));
            const otpOut = await execOp(otpArgs, 15000);
            if (otpOut && otpOut.trim()) otp = otpOut.trim();
          } catch {}
        }
        return { ok: true, credential: { id: detail.id || itemId, title: detail.title || "", username, password, otp } };
      } catch (err) {
        return { ok: false, error: err?.message || String(err) };
      }
    });
    electron.ipcMain?.handle("t3:1password:create", async (_event, payload) => {
      try {
        const title = String(payload?.title || "New Login").trim();
        const url = String(payload?.url || "").trim();
        const username = String(payload?.username || "");
        const password = String(payload?.password || "");
        const args = ["item", "create", "--category=login", \`--title=\${title}\`, "--format=json"];
        if (url) args.push(\`--url=\${url}\`);
        if (username) args.push(\`username=\${username}\`);
        if (password) args.push(\`password=\${password}\`);
        const stdout = await execOp(args);
        const created = JSON.parse(stdout || "{}");
        opCachedItems = null;
        return { ok: true, id: created.id };
      } catch (err) {
        return { ok: false, error: err?.message || String(err) };
      }
    });
    electron.ipcMain?.handle("t3:1password:open-app", async () => {
      try { await electron.shell.openPath("/Applications/1Password.app"); return { ok: true }; }
      catch (err) { return { ok: false, error: err?.message || String(err) }; }
    });
    electron.ipcMain?.handle("t3:1password:toggle-popup", async () => {
      let sentToWebview = false;
      try {
        for (const wc of electron.webContents.getAllWebContents()) {
          if (!wc || wc.isDestroyed() || wc.getType() !== "webview") continue;
          try {
            const visible = await wc.executeJavaScript("Boolean(document.documentElement && document.documentElement.clientWidth > 0 && document.documentElement.clientHeight > 0 && !document.hidden)");
            if (visible) { wc.send("t3:1password:toggle-popup"); sentToWebview = true; }
          } catch {}
        }
      } catch {}
      return { sentToWebview };
    });
  } catch {}
  globalThis.__t3BuildWebviewContextMenuPrefix = (contents, params) => {
    try {
      if (!contents || contents.isDestroyed() || contents.getType() !== "webview") return [];
      const isZh = getMainLocale() !== "en";
      const coords = { x: params?.x ?? 0, y: params?.y ?? 0 };
      return [
        { label: isZh ? "🔑 1Password 自动填充..." : "🔑 1Password Autofill...", click: () => { if (!contents.isDestroyed()) contents.send("t3:1password:context-menu", coords); } },
        { label: isZh ? "🎲 1Password 生成随机强密码" : "🎲 1Password Generate Password", click: () => { if (!contents.isDestroyed()) contents.send("t3:1password:generate-password", coords); } },
        { type: "separator" }
      ];
    } catch { return []; }
  };`
    : "";

  return `
// --- T3 Code Simplified Chinese (zh-CN) Main Process I18n ---
(() => {
  if (globalThis.__t3MainI18nInstalled) return;
  globalThis.__t3MainI18nInstalled = true;
  const fs = require("node:fs");
  const path = require("node:path");
  const electron = require("electron");

  let currentLocale = "zh-CN";
  let localeFileLoaded = false;

  function getLocaleFilePath() {
    try {
      return path.join(electron.app.getPath("userData"), "ui-locale.json");
    } catch {
      return null;
    }
  }

  function getMainLocale() {
    if (!localeFileLoaded) {
      const p = getLocaleFilePath();
      if (p) {
        localeFileLoaded = true;
        try {
          if (fs.existsSync(p)) {
            const data = JSON.parse(fs.readFileSync(p, "utf8"));
            if (data && (data.locale === "en" || data.locale === "zh-CN")) {
              currentLocale = data.locale;
            }
          }
        } catch {}
      }
    }
    return currentLocale;
  }

  function setMainLocale(next, notifyWindows = false) {
    currentLocale = next === "en" ? "en" : "zh-CN";
    localeFileLoaded = true;
    const p = getLocaleFilePath();
    if (p) {
      try {
        fs.mkdirSync(path.dirname(p), { recursive: true });
        fs.writeFileSync(p, JSON.stringify({ locale: currentLocale }), "utf8");
      } catch {}
    }
    if (globalThis.__t3LastAppMenuTemplate) {
      try {
        const translated = translateMenuTemplate(globalThis.__t3LastAppMenuTemplate, true);
        electron.Menu.setApplicationMenu(electron.Menu.buildFromTemplate(translated));
      } catch {}
    }
    if (notifyWindows) {
      try {
        for (const win of electron.BrowserWindow.getAllWindows()) {
          win.webContents.executeJavaScript(
            \`try{if(globalThis.__t3SetLocale){globalThis.__t3SetLocale(\${JSON.stringify(currentLocale)});}else{localStorage.setItem("t3code:locale",\${JSON.stringify(currentLocale)});location.reload();}}catch{}\`
          );
        }
      } catch {}
    }
  }

  try {
    electron.ipcMain?.on("desktop:set-ui-locale", (_event, locale) => {
      setMainLocale(locale, false);
    });
  } catch {}

  const ROLE_LABELS_ZH = {
    about: "关于",
    services: "服务",
    hide: "隐藏",
    hideOthers: "隐藏其他",
    unhide: "全部显示",
    quit: "退出",
    undo: "撤销",
    redo: "重做",
    cut: "剪切",
    copy: "拷贝",
    paste: "粘贴",
    delete: "删除",
    selectAll: "全选",
    startSpeaking: "开始朗读",
    stopSpeaking: "停止朗读",
    togglefullscreen: "切换全屏",
    windowMenu: "窗口",
    minimize: "最小化",
    zoom: "缩放",
    front: "前置全部窗口",
    help: "帮助"
  };

  const MENU_LABELS_ZH = {
    "File": "文件",
    "Edit": "编辑",
    "View": "视图",
    "Window": "窗口",
    "Help": "帮助",
    "Check for Updates...": "检查更新...",
    "Settings...": "设置...",
    "Close Developer Tools": "关闭开发者工具",
    "Close Window": "关闭窗口",
    "Paste as Text": "纯文本粘贴",
    "Speech": "语音",
    "Reload": "重新加载",
    "Force Reload": "强制重新加载",
    "Toggle Developer Tools": "切换开发者工具",
    "Actual Size": "实际大小",
    "Zoom In": "放大",
    "Zoom Out": "缩小",
    "No suggestions": "无拼写建议",
    "Copy Link": "复制链接",
    "Copy link": "复制链接",
    "Copy URL": "复制链接",
    "Copy Email Address": "复制电子邮件地址",
    "Copy Image": "复制图像",
    "Copy image": "复制图片",
    "Save image": "保存图片",
    "Save video": "保存视频",
    "Preview media": "预览媒体文件",
    "Open in file viewer": "在文件查看器中打开",
    "Open in integrated browser": "在内置浏览器中打开",
    "Open in system browser": "在系统浏览器中打开",
    "Open on host": "在托管平台上打开",
    "Link to thread": "关联到当前对话",
    "Unlink from thread": "取消关联此对话",
    "New thread": "新建对话",
    "Find in thread": "在对话中查找",
    "Pin thread": "置顶对话",
    "Unpin thread": "取消置顶对话",
    "Pin project": "置顶项目",
    "Unpin project": "取消置顶项目",
    "Settle thread": "归置对话",
    "Un-settle thread": "取消归置对话",
    "Snooze": "暂缓",
    "Wake thread": "唤醒对话",
    "Rename thread": "重命名对话",
    "Regenerate title": "重新生成标题",
    "Regenerating…": "正在生成…",
    "Mark unread": "标记为未读",
    "Share with guest": "分享给访客",
    "Show all projects": "显示全部项目",
    "Turn into project": "转为独立项目",
    "Auto-settle behavior": "自动归置行为",
    "Follow settings": "跟随设置",
    "Never": "从不",
    "Copy": "复制",
    "Copy path": "复制路径",
    "Copy relative path": "复制相对路径",
    "Copy full path": "复制完整路径",
    "Copy mention": "复制 @引用",
    "Add to chat": "添加到对话",
    "Path": "路径",
    "Branch": "分支",
    "Thread": "对话内容",
    "Thread ID": "对话 ID",
    "Project settings": "项目设置",
    "Archive thread": "归档对话",
    "Delete": "删除",
    "Discard": "放弃更改",
    "Discard draft": "丢弃草稿",
    "Open with": "打开方式",
    "Reveal in Finder": "在访达中显示",
    "Reveal in File Explorer": "在文件资源管理器中显示",
    "Reveal in File Manager": "在文件管理器中显示",
    "Custom...": "自定义...",
    "Custom…": "自定义…",
    "Close": "关闭",
    "Close others": "关闭其他标签页",
    "Close to the right": "关闭右侧标签页",
    "Close all": "关闭全部标签页",
    "OK": "确定",
    "Cancel": "取消",
    "Open": "打开",
    "Choose a passkey": "选择通行密钥 (Passkey)",
    "A new update is ready to install": "新版本已准备就绪，可供安装",
    "T3 Code could not start": "T3 Code 无法启动",
    "Updates unavailable": "更新不可用",
    "Automatic updates are not available right now.": "当前无法使用自动更新。",
    "You're up to date!": "当前已是最新版本！",
    "Update check failed": "检查更新失败",
    "Could not check for updates.": "无法检查更新。",
    "An unknown error occurred. Please try again later.": "发生未知错误，请稍后重试。"
  };

  const MAIN_DAY_MAP = { mon: "周一", tue: "周二", wed: "周三", thu: "周四", fri: "周五", sat: "周六", sun: "周日" };
  function trWhenDetail(d) {
    const dm = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\\s+(.+)$/i.exec(d);
    if (dm) return (MAIN_DAY_MAP[dm[1].toLowerCase()] || dm[1]) + " " + dm[2];
    return d;
  }

  function trMainString(str) {
    if (getMainLocale() === "en" || typeof str !== "string" || !str) return str;
    if (MENU_LABELS_ZH[str]) return MENU_LABELS_ZH[str];
    let m;
    if ((m = /^About (.+)$/.exec(str))) return "关于 " + m[1];
    if ((m = /^Hide (.+)$/.exec(str))) return "隐藏 " + m[1];
    if ((m = /^Quit (.+)$/.exec(str))) return "退出 " + m[1];
    if ((m = /^New thread on (.+)$/.exec(str))) return "在 " + m[1] + " 上新建对话";
    if ((m = /^Filter by (.+)$/.exec(str))) return "按 " + m[1] + " 筛选";
    if ((m = /^Open on (.+)$/.exec(str))) return "在 " + m[1] + " 上打开";
    if ((m = /^Settle \\((\\d+)\\)$/.exec(str))) return "归置 (" + m[1] + ")";
    if ((m = /^Snooze \\((\\d+)\\)$/.exec(str))) return "暂缓 (" + m[1] + ")";
    if ((m = /^In (\\d+) minutes?(?: \\(([^)]+)\\))?$/i.exec(str))) {
      return m[1] + " 分钟后" + (m[2] ? " (" + trWhenDetail(m[2]) + ")" : "");
    }
    if ((m = /^In (\\d+) hours?(?: \\(([^)]+)\\))?$/i.exec(str))) {
      return m[1] + " 小时后" + (m[2] ? " (" + trWhenDetail(m[2]) + ")" : "");
    }
    if ((m = /^(This evening|Tonight|Tomorrow|Next week) \\(([^)]+)\\)$/i.exec(str))) {
      const baseMap = { "this evening": "今天晚上", "tonight": "今晚", "tomorrow": "明天", "next week": "下周" };
      return (baseMap[m[1].toLowerCase()] || m[1]) + " (" + trWhenDetail(m[2]) + ")";
    }
    if ((m = /^T3 Code (.+) is currently the newest version available\\.$/.exec(str))) {
      return "T3 Code " + m[1] + " 已是当前可用的最新版本。";
    }
    if ((m = /^(.+) version (.+) has been downloaded and will be automatically installed on exit$/.exec(str))) {
      return m[1] + " 版本 " + m[2] + " 已下载完成，将在退出时自动安装。";
    }
    if ((m = /^Open this (.+) link\\?$/.exec(str))) {
      return "要打开此 " + m[1] + " 链接吗？";
    }
    if ((m = /^A page in the browser wants to open another application:\\n\\n([\\s\\S]+)$/.exec(str))) {
      return "浏览器中的页面想要打开另一个应用程序：\\n\\n" + m[1];
    }
    return str;
  }

  function buildLanguageMenuItem() {
    const isZh = getMainLocale() !== "en";
    return {
      id: "__t3-zh-view-lang-menu",
      label: isZh ? "界面语言 (Language)" : "Language (界面语言)",
      submenu: [
        {
          label: "简体中文",
          type: "radio",
          checked: isZh,
          click: () => setMainLocale("zh-CN", true)
        },
        {
          label: "English",
          type: "radio",
          checked: !isZh,
          click: () => setMainLocale("en", true)
        }
      ]
    };
  }

  function translateMenuTemplate(template, isAppMenu = false) {
    if (!Array.isArray(template)) return template;
    const isZh = getMainLocale() !== "en";
    return template.map(item => {
      if (!item || typeof item !== "object") return item;
      const origLabel = item.label;
      const next = { ...item };
      if (isZh) {
        if (typeof next.label === "string") {
          next.label = trMainString(next.label);
        } else if (typeof next.role === "string" && ROLE_LABELS_ZH[next.role]) {
          next.label = ROLE_LABELS_ZH[next.role];
        }
      }
      if (Array.isArray(next.submenu)) {
        next.submenu = translateMenuTemplate(next.submenu, false);
        if (
          isAppMenu &&
          (origLabel === "View" || origLabel === "视图") &&
          !next.submenu.some(sub => sub && sub.id === "__t3-zh-view-lang-menu")
        ) {
          next.submenu = [...next.submenu, { type: "separator" }, buildLanguageMenuItem()];
        }
      }
      return next;
    });
  }

  function translateDialogOptions(options) {
    if (getMainLocale() === "en" || !options || typeof options !== "object") return options;
    const next = { ...options };
    if (typeof next.title === "string") next.title = trMainString(next.title);
    if (typeof next.message === "string") next.message = trMainString(next.message);
    if (typeof next.detail === "string") next.detail = trMainString(next.detail);
    if (Array.isArray(next.buttons)) {
      next.buttons = next.buttons.map(b => trMainString(b));
    }
    return next;
  }

  globalThis.__t3TrMainString = trMainString;
  globalThis.__t3TranslateMenuTemplate = translateMenuTemplate;
  globalThis.__t3TranslateDialogOptions = translateDialogOptions;
${onePasswordBridgeSection}
})();
// --- End T3 Code Simplified Chinese Main Process I18n ---
`;
}

function syncDefaultClientSettingsLocale(targetLang) {
  const csPath = path.join(os.homedir(), ".t3", "userdata", "client-settings.json");
  try {
    if (!fs.existsSync(csPath)) return;
    const data = JSON.parse(fs.readFileSync(csPath, "utf8"));
    if (!data || typeof data !== "object") return;
    if (targetLang === "zh") {
      // Initialize native T3 Code v0.1.10+ language setting when unset/system so native menus & GT catalog start in Chinese
      if (!data.language || data.language === "system") {
        data.language = "zh";
        fs.writeFileSync(csPath, JSON.stringify(data), "utf8");
        console.log("Synced ~/.t3/userdata/client-settings.json -> language: \"zh\"");
      }
    } else if (targetLang === "en" && data.language === "zh") {
      data.language = "en";
      fs.writeFileSync(csPath, JSON.stringify(data), "utf8");
    }
  } catch {}
}

function clearCaches() {
  const home = os.homedir();
  const caches = [
    path.join(os.tmpdir(), "t3code", "compile-cache"),
    path.join(home, "Library/Application Support/t3code-v2/Code Cache/js"),
    path.join(home, "Library/Application Support/t3code/Code Cache/js"),
    path.join(home, "AppData/Roaming/t3code-v2/Code Cache/js"),
    path.join(home, "AppData/Roaming/t3code/Code Cache/js"),
    path.join(home, ".config/t3code-v2/Code Cache/js"),
    path.join(home, ".config/t3code/Code Cache/js")
  ];
  for (const dir of caches) {
    try {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log("Cleared cache:", dir);
      }
    } catch (err) {
      console.warn("Could not clear cache:", dir, err.message);
    }
  }
}

async function applyPatch({ appPath = null, onlyIfUnpatched = false, with1Password = false } = {}) {
  const resourcesDir = resolveAppResourcesDir(appPath);
  const appAsarPath = path.join(resourcesDir, "app.asar");
  const backupAsarPath = path.join(resourcesDir, "app.asar.bak");
  const tmpAsarPath = path.join(resourcesDir, "app.asar.zh-tmp");

  const { header: currentHeader } = readAsarHeader(appAsarPath);
  const isCurrentlyPatched = Boolean(
    getFileNode(currentHeader, "apps/server/dist/client/assets/zh-cn-i18n.js")
  );

  if (onlyIfUnpatched && isCurrentlyPatched) {
    return;
  }

  const ts = new Date().toISOString();
  console.log(`[${ts}] Starting T3 Code zh-CN patcher...`);

  const currentVersion = readAsarVersion(appAsarPath);

  if (!isCurrentlyPatched) {
    console.log(
      `Detected unpatched official T3 Code (v${currentVersion}) at app.asar -> refreshing clean backup app.asar.bak ...`
    );
    fs.copyFileSync(appAsarPath, backupAsarPath);
  } else if (!fs.existsSync(backupAsarPath)) {
    throw new Error(
      "app.asar is already patched, but clean backup app.asar.bak is missing!"
    );
  } else {
    const bakVersion = readAsarVersion(backupAsarPath);
    if (bakVersion !== currentVersion && currentVersion !== "unknown") {
      throw new Error(
        `Version mismatch between patched app.asar (v${currentVersion}) and app.asar.bak (v${bakVersion}). Refusing to overwrite with stale backup.`
      );
    }
    console.log(`Using clean backup app.asar.bak (v${bakVersion})`);
  }

  const { header, dataOffset } = readAsarHeader(backupAsarPath);
  const srcFd = fs.openSync(backupAsarPath, "r");

  const enable1Password = Boolean(with1Password && fs.existsSync(ONEPASSWORD_PRELOAD_PATH));
  const onePasswordPreloadCode = enable1Password
    ? `globalThis.__t3Enable1PasswordToolbar = true;\n` +
      fs.readFileSync(ONEPASSWORD_PRELOAD_PATH, "utf8")
    : "";

  try {
    // Automatically absorb any brand-new en -> zh translations shipped in T3 Code's own GT catalog
    const upstreamGt = extractUpstreamGtCatalog(srcFd, dataOffset, header);

    // Build fresh zh-cn-i18n.js bundle
    const { buildI18nBundle } = await import("./build-i18n.mjs");
    const builtRuntimeCode = buildI18nBundle(I18N_ASSET_PATH, upstreamGt);

    const modifiedFiles = new Map();

    // (a) zh-cn-i18n.js (all UI controls & translations live here — zero feature-bundle regex edits!)
    const baseI18nText = fs.existsSync(I18N_ASSET_PATH)
      ? fs.readFileSync(I18N_ASSET_PATH, "utf8")
      : builtRuntimeCode;
    const i18nCode = Buffer.from(
      enable1Password ? `${baseI18nText}\n${onePasswordPreloadCode}` : baseI18nText,
      "utf8"
    );
    modifiedFiles.set("apps/server/dist/client/assets/zh-cn-i18n.js", i18nCode);

    // (b) index.html (adaptive to any index-*.js hash)
    let indexHtml = readFileFromAsar(srcFd, dataOffset, header, "apps/server/dist/client/index.html");
    indexHtml = replaceRequiredRegex(
      indexHtml,
      /(<script\s+type="module"\s+crossorigin\s+src="\/assets\/index-[^"]+\.js"><\/script>)/,
      `<script src="/assets/zh-cn-i18n.js"></script>\n    $1`,
      "index.html script injection"
    );
    modifiedFiles.set("apps/server/dist/client/index.html", Buffer.from(indexHtml, "utf8"));

    // (c) jsx-runtime-*.js (pass only local parameters (type, props, marker) — zero cross-scope identifiers!)
    const jsxRuntimePath = findClientAsset(header, /^jsx-runtime-[A-Za-z0-9_-]+\.js$/);
    if (!jsxRuntimePath) throw new Error("Could not find jsx-runtime-*.js in ASAR");
    let jsxRuntime = readFileFromAsar(srcFd, dataOffset, header, jsxRuntimePath);
    jsxRuntime =
      `import"./zh-cn-i18n.js";` +
      replaceRequiredRegex(
        jsxRuntime,
        /return\s+([A-Za-z0-9_$]+)=([A-Za-z0-9_$]+)\.ref,\{\$\$typeof:([A-Za-z0-9_$]+),type:([A-Za-z0-9_$]+),key:([A-Za-z0-9_$]+),ref:\1===void 0\?null:\1,props:\2\}/,
        (_match, ref, props, marker, type, key) =>
          `return ${ref}=${props}.ref,${props}=globalThis.__t3TransformProps?globalThis.__t3TransformProps(${type},${props},${marker}):${props},{$$typeof:${marker},type:${type},key:${key},ref:${ref}===void 0?null:${ref},props:${props}}`,
        `${path.basename(jsxRuntimePath)} transformProps hook`
      );
    modifiedFiles.set(jsxRuntimePath, Buffer.from(jsxRuntime, "utf8"));

    // (d) react-*.js (createElement hook using only local parameters)
    const reactPath = findClientAsset(header, /^react-[A-Za-z0-9_-]+\.js$/);
    if (reactPath) {
      let reactBundle = readFileFromAsar(srcFd, dataOffset, header, reactPath);
      const res = replaceOptionalRegex(
        reactBundle,
        /function\s+([A-Za-z0-9_$]+)\(([A-Za-z0-9_$]+),([A-Za-z0-9_$]+),([A-Za-z0-9_$]+)\)\{var\s+([A-Za-z0-9_$]+)=\4\.ref;return\{\$\$typeof:([A-Za-z0-9_$]+),type:\2,key:\3,ref:\5===void 0\?null:\5,props:\4\}\}/,
        (_match, fn, type, key, props, ref, marker) =>
          `function ${fn}(${type},${key},${props}){var ${ref}=${props}.ref;return ${props}=globalThis.__t3TransformProps?globalThis.__t3TransformProps(${type},${props},${marker}):${props},{$$typeof:${marker},type:${type},key:${key},ref:${ref}===void 0?null:${ref},props:${props}}}`,
        `${path.basename(reactPath)} createElement hook`
      );
      if (res.applied) modifiedFiles.set(reactPath, Buffer.from(res.code, "utf8"));
    }

    // (e) toast-*.js & toastHelpers-*.js (supports both 2-arg and 3-arg showContextMenu signatures)
    const toastPath = findClientAsset(header, /^toast-[A-Za-z0-9_-]+\.js$/);
    if (toastPath) {
      let toastJs = readFileFromAsar(srcFd, dataOffset, header, toastPath);
      const res = replaceOptionalRegex(
        toastJs,
        /contextMenu:\{show:async\(([A-Za-z0-9_$]+),([A-Za-z0-9_$]+)(?:,([A-Za-z0-9_$]+))?\)=>window\.desktopBridge\?window\.desktopBridge\.showContextMenu\(\1,\2(?:,\3)?\):([A-Za-z0-9_$]+)\(\1,\2\),close:async\(\)=>\{window\.desktopBridge\|\|([A-Za-z0-9_$]+)\(\)\}\}/,
        (_m, itemsArg, arg2, arg3, fallbackFn, closeFn) => {
          const sig = arg3 ? `${itemsArg},${arg2},${arg3}` : `${itemsArg},${arg2}`;
          const bridgeArgs = arg3 ? `m,${arg2},${arg3}` : `m,${arg2}`;
          return `contextMenu:{show:async(${sig})=>{let m=globalThis.__t3TrMenuItems?globalThis.__t3TrMenuItems(${itemsArg}):${itemsArg};return window.desktopBridge?window.desktopBridge.showContextMenu(${bridgeArgs}):${fallbackFn}(m,${arg2})},close:async()=>{window.desktopBridge||${closeFn}()}}`;
        },
        `${path.basename(toastPath)} contextMenu.show hook`
      );
      if (res.applied) modifiedFiles.set(toastPath, Buffer.from(res.code, "utf8"));
    }

    const toastHelpersPath = findClientAsset(header, /^toastHelpers-[A-Za-z0-9_-]+\.js$/);
    if (toastHelpersPath) {
      let toastHelpers = readFileFromAsar(srcFd, dataOffset, header, toastHelpersPath);
      const res = replaceOptionalRegex(
        toastHelpers,
        /let\s+([A-Za-z0-9_$]+)=\{type:([A-Za-z0-9_$]+),title:([A-Za-z0-9_$]+),data:([A-Za-z0-9_$]+)\};return\s+([A-Za-z0-9_$]+)!==void 0&&\(\1\.description=\5\)/,
        `let $1={type:$2,title:typeof $3==="string"&&globalThis.__t3Tr?globalThis.__t3Tr($3):$3,data:$4};return $5!==void 0&&($1.description=typeof $5==="string"&&globalThis.__t3Tr?globalThis.__t3Tr($5):$5)`,
        `${path.basename(toastHelpersPath)} title/description hook`
      );
      if (res.applied) modifiedFiles.set(toastHelpersPath, Buffer.from(res.code, "utf8"));
    }

    // (f) preload.cjs (UI locale bridge)
    if (getFileNode(header, "apps/desktop/dist-electron/preload.cjs")) {
      let preloadCjs = readFileFromAsar(srcFd, dataOffset, header, "apps/desktop/dist-electron/preload.cjs");
      const extraBridge = enable1Password
        ? `\n\ttoggle1PasswordPopup: (url) => electron.ipcRenderer.invoke("t3:1password:toggle-popup", { url }),\n\tonePasswordInvoke: (channel, payload) => electron.ipcRenderer.invoke(channel, payload),`
        : "";
      const res = replaceOptionalRegex(
        preloadCjs,
        /(\trevealWindow:\s*\(\)\s*=>\s*electron\.ipcRenderer\.invoke\(REVEAL_WINDOW_CHANNEL\),)/,
        `$1\n\tsetUiLocale: (locale) => electron.ipcRenderer.send("desktop:set-ui-locale", locale),${extraBridge}`,
        "preload.cjs setUiLocale bridge"
      );
      if (res.applied) {
        modifiedFiles.set("apps/desktop/dist-electron/preload.cjs", Buffer.from(res.code, "utf8"));
      }
    }

    // (f2) Optional preview-pick-preload.cjs (only when --with-1password is enabled)
    if (
      enable1Password &&
      getFileNode(header, "apps/desktop/dist-electron/preview-pick-preload.cjs") &&
      onePasswordPreloadCode
    ) {
      let pickPreload = readFileFromAsar(
        srcFd,
        dataOffset,
        header,
        "apps/desktop/dist-electron/preview-pick-preload.cjs"
      );
      pickPreload = pickPreload + "\n" + onePasswordPreloadCode;
      modifiedFiles.set(
        "apps/desktop/dist-electron/preview-pick-preload.cjs",
        Buffer.from(pickPreload, "utf8")
      );
    }

    // (g) main.cjs
    if (getFileNode(header, "apps/desktop/dist-electron/main.cjs")) {
      let mainCjs = readFileFromAsar(srcFd, dataOffset, header, "apps/desktop/dist-electron/main.cjs");
      mainCjs = buildMainProcessI18nHelper({ enable1Password }) + "\n" + mainCjs;
      mainCjs = replaceOptionalRegex(
        mainCjs,
        /\t\t\tconst itemOption = \{\n\t\t\t\tlabel: item\.label,/,
        `\t\t\tconst itemOption = {\n\t\t\t\tlabel: globalThis.__t3TrMainString ? globalThis.__t3TrMainString(item.label) : item.label,`,
        "main.cjs buildTemplate label"
      ).code;
      mainCjs = replaceOptionalRegex(
        mainCjs,
        /\t\t\t\ttry: \(\) => \{\n\t\t\t\t\telectron\.Menu\.setApplicationMenu\(electron\.Menu\.buildFromTemplate\(\[\.\.\.template\]\)\);\n\t\t\t\t\},/,
        `\t\t\t\ttry: () => {\n\t\t\t\t\tglobalThis.__t3LastAppMenuTemplate = template;\n\t\t\t\t\telectron.Menu.setApplicationMenu(electron.Menu.buildFromTemplate(globalThis.__t3TranslateMenuTemplate ? globalThis.__t3TranslateMenuTemplate(template, true) : [...template]));\n\t\t\t\t},`,
        "main.cjs setApplicationMenu"
      ).code;
      mainCjs = replaceOptionalRegex(
        mainCjs,
        /\t\t\t\ttry: \(\) => electron\.Menu\.buildFromTemplate\(\[\.\.\.input\.template\]\)\.popup\(\{/,
        `\t\t\t\ttry: () => electron.Menu.buildFromTemplate(globalThis.__t3TranslateMenuTemplate ? globalThis.__t3TranslateMenuTemplate(input.template, false) : [...input.template]).popup({`,
        "main.cjs popupTemplate"
      ).code;
      mainCjs = replaceOptionalRegex(
        mainCjs,
        /\t\t\ttry: \(\) => owner === void 0 \? electron\.dialog\.showMessageBox\(options\) : electron\.dialog\.showMessageBox\(owner, options\),/,
        `\t\t\ttry: () => { const opts = globalThis.__t3TranslateDialogOptions ? globalThis.__t3TranslateDialogOptions(options) : options; return owner === void 0 ? electron.dialog.showMessageBox(opts) : electron.dialog.showMessageBox(owner, opts); },`,
        "main.cjs showMessageBox"
      ).code;
      if (enable1Password) {
        mainCjs = replaceOptionalRegex(
          mainCjs,
          /\t\t\t\tconst menuTemplate = \[\];/,
          `\t\t\t\tconst menuTemplate = globalThis.__t3BuildWebviewContextMenuPrefix ? globalThis.__t3BuildWebviewContextMenuPrefix(contents, params) : [];`,
          "main.cjs webview 1Password context menu"
        ).code;
      }
      modifiedFiles.set("apps/desktop/dist-electron/main.cjs", Buffer.from(mainCjs, "utf8"));
    }

    // Pre-flight V8 syntax validation BEFORE writing or replacing app.asar!
    verifyModifiedBundles(modifiedFiles);

    // 2. Append modified/new files to the end of the clean ASAR payload
    const bakStat = fs.statSync(backupAsarPath);
    let currentAppendOffset = bakStat.size - dataOffset;
    const appendBuffers = [];

    for (const [relPath, buf] of modifiedFiles.entries()) {
      setFileNode(header, relPath, {
        size: buf.length,
        offset: String(currentAppendOffset),
        integrity: computeIntegrity(buf)
      });
      appendBuffers.push(buf);
      currentAppendOffset += buf.length;
    }

    // 3. Serialize new ASAR header with proper 4-byte alignment
    const headerJson = JSON.stringify(header);
    const headerStringBuf = Buffer.from(headerJson, "utf8");
    const headerStringSize = headerStringBuf.length;
    const alignedStringSize = Math.ceil(headerStringSize / 4) * 4;
    const headerPickleSize = 4 + alignedStringSize;
    const outerPickleSize = 4 + headerPickleSize;

    const preHeaderBuf = Buffer.alloc(16 + alignedStringSize);
    preHeaderBuf.writeUInt32LE(4, 0);
    preHeaderBuf.writeUInt32LE(outerPickleSize, 4);
    preHeaderBuf.writeUInt32LE(headerPickleSize, 8);
    preHeaderBuf.writeUInt32LE(headerStringSize, 12);
    headerStringBuf.copy(preHeaderBuf, 16);

    // 4. Write new ASAR archive atomically via tmpAsarPath
    if (fs.existsSync(tmpAsarPath)) fs.unlinkSync(tmpAsarPath);
    const outFd = fs.openSync(tmpAsarPath, "w");
    try {
      fs.writeSync(outFd, preHeaderBuf, 0, preHeaderBuf.length, 0);
      let writePos = preHeaderBuf.length;

      const copyChunk = Buffer.alloc(4 * 1024 * 1024);
      let readPos = dataOffset;
      while (readPos < bakStat.size) {
        const bytesRead = fs.readSync(srcFd, copyChunk, 0, copyChunk.length, readPos);
        if (bytesRead <= 0) break;
        fs.writeSync(outFd, copyChunk, 0, bytesRead, writePos);
        readPos += bytesRead;
        writePos += bytesRead;
      }

      for (const buf of appendBuffers) {
        fs.writeSync(outFd, buf, 0, buf.length, writePos);
        writePos += buf.length;
      }
    } finally {
      fs.closeSync(outFd);
    }

    fs.renameSync(tmpAsarPath, appAsarPath);
    syncDefaultClientSettingsLocale("zh");
    clearCaches();
    console.log(
      `\n✅ Successfully patched T3 Code (v${currentVersion}) with Simplified Chinese (zh-CN) localization!`
    );
    console.log(`   Verified ${modifiedFiles.size} patched bundles with V8 syntax gate (0 warnings).`);
    console.log(`   Target: ${appAsarPath}`);
    console.log(`   Tip: Quit (Cmd+Q / Alt+F4) and reopen T3 Code once so the background server & native menus load the new app.asar.`);
  } catch (err) {
    if (fs.existsSync(tmpAsarPath)) {
      try {
        fs.unlinkSync(tmpAsarPath);
      } catch {}
    }
    throw err;
  } finally {
    fs.closeSync(srcFd);
  }
}

function restoreBackup({ appPath = null } = {}) {
  const resourcesDir = resolveAppResourcesDir(appPath);
  const appAsarPath = path.join(resourcesDir, "app.asar");
  const backupAsarPath = path.join(resourcesDir, "app.asar.bak");

  if (!fs.existsSync(backupAsarPath)) {
    console.error("Backup not found at:", backupAsarPath);
    process.exit(1);
  }
  if (process.platform === "darwin" && fs.existsSync(LAUNCH_AGENT_PLIST)) {
    uninstallAutoUpdateWatcher();
  }
  fs.copyFileSync(backupAsarPath, appAsarPath);
  syncDefaultClientSettingsLocale("en");
  clearCaches();
  console.log(`✅ Restored original English T3 Code from ${backupAsarPath}`);
}

function showStatus({ appPath = null } = {}) {
  const resourcesDir = resolveAppResourcesDir(appPath);
  const appAsarPath = path.join(resourcesDir, "app.asar");
  const backupAsarPath = path.join(resourcesDir, "app.asar.bak");
  const version = readAsarVersion(appAsarPath);
  const { header } = readAsarHeader(appAsarPath);
  const isPatched = Boolean(
    getFileNode(header, "apps/server/dist/client/assets/zh-cn-i18n.js")
  );
  const hasBackup = fs.existsSync(backupAsarPath);
  const watcherInstalled = process.platform === "darwin" && fs.existsSync(LAUNCH_AGENT_PLIST);

  console.log(`T3 Code Path     : ${resourcesDir}`);
  console.log(`T3 Code Version  : v${version}`);
  console.log(`zh-CN Patched    : ${isPatched ? "Yes (已汉化)" : "No (未汉化)"}`);
  console.log(`Clean Backup     : ${hasBackup ? backupAsarPath : "None"}`);
  if (process.platform === "darwin") {
    console.log(`Auto-Update Guard: ${watcherInstalled ? `Active (${LAUNCH_AGENT_PLIST})` : "Not installed"}`);
  }
}

function syncStandaloneWatcherRuntime() {
  const isTempDir = __dirname.includes("_npx") || __dirname.startsWith(os.tmpdir());
  if (!isTempDir) {
    return __filename;
  }

  fs.mkdirSync(path.join(PERSISTENT_WATCHER_DIR, "locales"), { recursive: true });
  fs.mkdirSync(path.join(PERSISTENT_WATCHER_DIR, "dist"), { recursive: true });

  for (const file of ["patch-t3-zh.mjs", "build-i18n.mjs", "package.json"]) {
    const src = path.join(__dirname, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(PERSISTENT_WATCHER_DIR, file));
    }
  }
  const localesDir = path.join(__dirname, "locales");
  if (fs.existsSync(localesDir)) {
    for (const f of fs.readdirSync(localesDir)) {
      if (f.endsWith(".json")) {
        fs.copyFileSync(path.join(localesDir, f), path.join(PERSISTENT_WATCHER_DIR, "locales", f));
      }
    }
  }
  return path.join(PERSISTENT_WATCHER_DIR, "patch-t3-zh.mjs");
}

function installAutoUpdateWatcher({ appPath = null, with1Password = false } = {}) {
  if (process.platform !== "darwin") {
    console.log("Note: LaunchAgent auto-update watcher is only supported on macOS.");
    return;
  }
  const resourcesDir = resolveAppResourcesDir(appPath);
  const appAsarPath = path.join(resourcesDir, "app.asar");
  const scriptToRun = syncStandaloneWatcherRuntime();
  const nodeBin = process.execPath;
  const logDir = path.join(os.homedir(), ".t3", "logs");
  const logPath = path.join(logDir, "zh-cn-auto-patch.log");

  fs.mkdirSync(path.dirname(LAUNCH_AGENT_PLIST), { recursive: true });
  fs.mkdirSync(logDir, { recursive: true });

  const programArgs = [nodeBin, scriptToRun, "--if-unpatched"];
  if (with1Password) {
    programArgs.push("--with-1password");
  }
  if (appPath) {
    programArgs.push("--app-path", resourcesDir);
  }

  const argsXml = programArgs
    .map(arg => `    <string>${arg.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</string>`)
    .join("\n");
  const watchPathXml = appAsarPath.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const logPathXml = logPath.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LAUNCH_AGENT_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
${argsXml}
  </array>
  <key>WatchPaths</key>
  <array>
    <string>${watchPathXml}</string>
  </array>
  <key>StandardOutPath</key>
  <string>${logPathXml}</string>
  <key>StandardErrorPath</key>
  <string>${logPathXml}</string>
  <key>RunAtLoad</key>
  <true/>
</dict>
</plist>
`;

  fs.writeFileSync(LAUNCH_AGENT_PLIST, plistContent, "utf8");
  try {
    execFileSync("launchctl", ["unload", LAUNCH_AGENT_PLIST], { stdio: "ignore" });
  } catch {}
  execFileSync("launchctl", ["load", LAUNCH_AGENT_PLIST], { stdio: "inherit" });
  console.log(`✅ Installed macOS LaunchAgent watcher: ${LAUNCH_AGENT_PLIST}`);
  console.log(`   Whenever T3 Code updates ${appAsarPath}, zh-CN localization will be verified & re-applied automatically!`);
}

function uninstallAutoUpdateWatcher() {
  if (process.platform !== "darwin") {
    console.log("LaunchAgent watcher is only applicable on macOS.");
    return;
  }
  if (fs.existsSync(LAUNCH_AGENT_PLIST)) {
    try {
      execFileSync("launchctl", ["unload", LAUNCH_AGENT_PLIST], { stdio: "ignore" });
    } catch {}
    fs.unlinkSync(LAUNCH_AGENT_PLIST);
    console.log(`✅ Uninstalled macOS LaunchAgent watcher: ${LAUNCH_AGENT_PLIST}`);
  } else {
    console.log("LaunchAgent watcher is not currently installed.");
  }
}

const opts = parseArgs(process.argv);

if (opts.showHelp) {
  printHelp();
} else if (opts.onlyIfUnpatched || opts.command === "--if-unpatched") {
  try {
    await applyPatch({
      appPath: opts.appPath,
      onlyIfUnpatched: true,
      with1Password: opts.with1Password
    });
  } catch (err) {
    // Safe fail-open on background auto-update: keep unpatched official app.asar intact so T3 Code never breaks!
    console.error(`[SAFE-ABORT] Auto-patch skipped to keep official T3 Code intact: ${err?.message || err}`);
    process.exit(0);
  }
} else if (opts.command === "restore" || opts.command === "uninstall") {
  restoreBackup({ appPath: opts.appPath });
} else if (opts.command === "status") {
  showStatus({ appPath: opts.appPath });
} else if (opts.command === "install-watcher") {
  await applyPatch({
    appPath: opts.appPath,
    onlyIfUnpatched: false,
    with1Password: opts.with1Password
  });
  installAutoUpdateWatcher({ appPath: opts.appPath, with1Password: opts.with1Password });
} else if (opts.command === "uninstall-watcher") {
  uninstallAutoUpdateWatcher();
} else if (opts.command === "apply") {
  await applyPatch({
    appPath: opts.appPath,
    onlyIfUnpatched: false,
    with1Password: opts.with1Password
  });
} else {
  console.error(`Unknown command: ${opts.command}`);
  printHelp();
  process.exit(1);
}
