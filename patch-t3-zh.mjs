#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
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
            \`try{localStorage.setItem("t3code:locale",\${JSON.stringify(currentLocale)});location.reload();}catch{}\`
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
    "Copy Email Address": "复制电子邮件地址",
    "Copy Image": "复制图像",
    "Open in integrated browser": "在内置浏览器中打开",
    "Open in system browser": "在系统浏览器中打开",
    "Link to thread": "关联到当前对话",
    "Unlink from thread": "取消关联此对话",
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

  function trMainString(str) {
    if (getMainLocale() === "en" || typeof str !== "string" || !str) return str;
    if (MENU_LABELS_ZH[str]) return MENU_LABELS_ZH[str];
    let m;
    if ((m = /^About (.+)$/.exec(str))) return "关于 " + m[1];
    if ((m = /^Hide (.+)$/.exec(str))) return "隐藏 " + m[1];
    if ((m = /^Quit (.+)$/.exec(str))) return "退出 " + m[1];
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
        if (isAppMenu && (origLabel === "View" || origLabel === "视图")) {
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

  // Build fresh zh-cn-i18n.js bundle
  const { buildI18nBundle } = await import("./build-i18n.mjs");
  const builtRuntimeCode = buildI18nBundle(I18N_ASSET_PATH);

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
    ? fs.readFileSync(ONEPASSWORD_PRELOAD_PATH, "utf8")
    : "";

  try {
    const modifiedFiles = new Map();

    // (a) zh-cn-i18n.js
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

    // (c) jsx-runtime-*.js (adaptive filename + adaptive minifier variable names)
    const jsxRuntimePath = findClientAsset(header, /^jsx-runtime-[A-Za-z0-9_-]+\.js$/);
    if (!jsxRuntimePath) throw new Error("Could not find jsx-runtime-*.js in ASAR");
    let jsxRuntime = readFileFromAsar(srcFd, dataOffset, header, jsxRuntimePath);
    jsxRuntime =
      `import"./zh-cn-i18n.js";` +
      replaceRequiredRegex(
        jsxRuntime,
        /return\s+([A-Za-z0-9_$]+)=([A-Za-z0-9_$]+)\.ref,\{\$\$typeof:([A-Za-z0-9_$]+),type:([A-Za-z0-9_$]+),key:([A-Za-z0-9_$]+),ref:\1===void 0\?null:\1,props:\2\}/,
        (_match, ref, props, marker, type, key) =>
          `return ${ref}=${props}.ref,${props}=globalThis.__t3TransformProps?globalThis.__t3TransformProps(${type},${props}):${props},{$$typeof:${marker},type:${type},key:${key},ref:${ref}===void 0?null:${ref},props:${props}}`,
        `${path.basename(jsxRuntimePath)} transformProps hook`
      );
    modifiedFiles.set(jsxRuntimePath, Buffer.from(jsxRuntime, "utf8"));

    // (d) react-*.js (adaptive filename + adaptive minifier variable names)
    const reactPath = findClientAsset(header, /^react-[A-Za-z0-9_-]+\.js$/);
    if (reactPath) {
      let reactBundle = readFileFromAsar(srcFd, dataOffset, header, reactPath);
      const res = replaceOptionalRegex(
        reactBundle,
        /function\s+([A-Za-z0-9_$]+)\(([A-Za-z0-9_$]+),([A-Za-z0-9_$]+),([A-Za-z0-9_$]+)\)\{var\s+([A-Za-z0-9_$]+)=\4\.ref;return\{\$\$typeof:([A-Za-z0-9_$]+),type:\2,key:\3,ref:\5===void 0\?null:\5,props:\4\}\}/,
        (_match, fn, type, key, props, ref, marker) =>
          `function ${fn}(${type},${key},${props}){var ${ref}=${props}.ref;return ${props}=globalThis.__t3TransformProps?globalThis.__t3TransformProps(${type},${props}):${props},{$$typeof:${marker},type:${type},key:${key},ref:${ref}===void 0?null:${ref},props:${props}}}`,
        `${path.basename(reactPath)} createElement hook`
      );
      if (res.applied) modifiedFiles.set(reactPath, Buffer.from(res.code, "utf8"));
    }

    // (e) main-*.js (Sidebar footer 1-click [中/EN] toggle icon button)
    const mainBundlePath = findClientAsset(header, /^main-[A-Za-z0-9_-]+\.js$/);
    if (mainBundlePath) {
      let mainBundle = readFileFromAsar(srcFd, dataOffset, header, mainBundlePath);
      const res = replaceOptionalRegex(
        mainBundle,
        /\(0,([A-Za-z0-9_$]+)\.jsxs\)\(\1\.Fragment,\{children:\[\(0,\1\.jsx\)\(([A-Za-z0-9_$]+),\{icon:\(0,\1\.jsx\)\(([A-Za-z0-9_$]+),\{\}\),label:`Settings`,onClick:([A-Za-z0-9_$]+)\}\),([A-Za-z0-9_$]+)\?\(0,\1\.jsx\)\(\2,\{icon:\(0,\1\.jsx\)\(([A-Za-z0-9_$.]+),\{\}\),label:`Pull requests`,onClick:([A-Za-z0-9_$]+)\}\):null,\(0,\1\.jsx\)\(\2,\{icon:\(0,\1\.jsx\)\(([A-Za-z0-9_$]+),\{\}\),label:`Usage`,onClick:([A-Za-z0-9_$]+)\}\)\]\}\)/,
        `(0,$1.jsxs)($1.Fragment,{children:[(0,$1.jsx)($2,{icon:(0,$1.jsx)($3,{}),label:\`Settings\`,onClick:$4}),$5?(0,$1.jsx)($2,{icon:(0,$1.jsx)($6,{}),label:\`Pull requests\`,onClick:$7}):null,(0,$1.jsx)($2,{icon:(0,$1.jsx)($8,{}),label:\`Usage\`,onClick:$9}),(0,$1.jsx)($2,{icon:(0,$1.jsx)(\`span\`,{className:\`text-[11px] font-bold leading-none tracking-tighter\`,children:(globalThis.__t3GetLocale?globalThis.__t3GetLocale():\`zh-CN\`)===\`en\`?\`中\`:\`EN\`}),label:(globalThis.__t3GetLocale?globalThis.__t3GetLocale():\`zh-CN\`)===\`en\`?\`切换为简体中文\`:\`Switch to English (切换语言)\`,onClick:()=>{let cur=globalThis.__t3GetLocale?globalThis.__t3GetLocale():\`zh-CN\`;globalThis.__t3SetLocale&&globalThis.__t3SetLocale(cur===\`en\`?\`zh-CN\`:\`en\`)}})]})`,
        `${path.basename(mainBundlePath)} sidebar footer language switcher`
      );
      if (res.applied) modifiedFiles.set(mainBundlePath, Buffer.from(res.code, "utf8"));
    }

    // (e2) Optional PreviewPanel-*.js 1Password button (only when --with-1password is explicitly enabled)
    if (enable1Password) {
      const previewPanelPath = findClientAsset(header, /^PreviewPanel-[A-Za-z0-9_-]+\.js$/);
      if (previewPanelPath) {
        let previewPanel = readFileFromAsar(srcFd, dataOffset, header, previewPanelPath);
        const tooltipExtractRe = /\(0,([A-Za-z0-9_$]+)\.jsxs\)\(([A-Za-z0-9_$]+),\{children:\[\(0,\1\.jsx\)\(([A-Za-z0-9_$]+),\{render:\(0,\1\.jsx\)\(([A-Za-z0-9_$]+),\{variant:[A-Za-z0-9_$]+\?`secondary`:`ghost`,size:`icon-xs`,onClick:[A-Za-z0-9_$]+,"aria-label":[A-Za-z0-9_$]+\?`Close floating preview`:`Float preview over chat`[\s\S]*?\(0,\1\.jsx\)\(([A-Za-z0-9_$]+),\{children:/;
        const tm = tooltipExtractRe.exec(previewPanel);
        if (tm) {
          const [, jsxNs, TooltipRoot, TooltipTrigger, ButtonComp, TooltipContent] = tm;
          const opBtnExpr = `(0,${jsxNs}.jsxs)(${TooltipRoot},{children:[(0,${jsxNs}.jsx)(${TooltipTrigger},{render:(0,${jsxNs}.jsx)(${ButtonComp},{variant:\`ghost\`,size:\`icon-xs\`,type:\`button\`,"aria-label":\`1Password\`,"data-t3-1password-toolbar-btn":!0,onClick:()=>{window.desktopBridge?.toggle1PasswordPopup?.().then(r=>{if(!r||!r.sentToWebview)globalThis.__t3ToggleMain1PasswordPopup?.()})}}),children:(0,${jsxNs}.jsxs)(\`svg\`,{viewBox:\`0 0 24 24\`,fill:\`none\`,className:\`size-4\`,children:[(0,${jsxNs}.jsx)(\`circle\`,{cx:\`12\`,cy:\`12\`,r:\`10\`,fill:\`#0A85EA\`}),(0,${jsxNs}.jsx)(\`circle\`,{cx:\`12\`,cy:\`12\`,r:\`7.3\`,stroke:\`#FFFFFF\`,strokeWidth:\`1.6\`}),(0,${jsxNs}.jsx)(\`rect\`,{x:\`10.7\`,y:\`7.2\`,width:\`2.6\`,height:\`4\`,rx:\`1.1\`,fill:\`#FFFFFF\`}),(0,${jsxNs}.jsx)(\`path\`,{d:\`M10.9 12.2H13.1L13.5 16.5H10.5L10.9 12.2Z\`,fill:\`#FFFFFF\`})]})}),(0,${jsxNs}.jsx)(${TooltipContent},{children:(globalThis.__t3GetLocale?globalThis.__t3GetLocale():\`zh-CN\`)===\`en\`?\`1Password Autofill (⌘\\\\)\`:\`1Password 自动填充 (⌘\\\\)\`})]})`;
          const res = replaceOptionalRegex(
            previewPanel,
            /(\(0,[A-Za-z0-9_$]+\.jsxs\)\(`form`,\{onSubmit:[A-Za-z0-9_$]+,className:`flex h-10 min-h-10 shrink-0 items-center gap-1[^`]*`,"data-surface-subheader":!0,children:\[[A-Za-z0-9_$]+,[A-Za-z0-9_$]+,[A-Za-z0-9_$]+,)([A-Za-z0-9_$]+,[A-Za-z0-9_$]+,[A-Za-z0-9_$]+,[A-Za-z0-9_$]+\]\}\))/,
            `$1${opBtnExpr},$2`,
            `${path.basename(previewPanelPath)} 1Password toolbar button`
          );
          if (res.applied) modifiedFiles.set(previewPanelPath, Buffer.from(res.code, "utf8"));
        }
      }
    }

    // (f) _chat.settings-*.js (Settings Top Header Bar prominent Language Switcher button)
    const chatSettingsPath = findClientAsset(header, /^_chat\.settings-[A-Za-z0-9_-]+\.js$/);
    if (chatSettingsPath) {
      let chatSettings = readFileFromAsar(srcFd, dataOffset, header, chatSettingsPath);
      const restoreIdx = chatSettings.indexOf("Restore device defaults");
      const btnIdentMatch =
        restoreIdx !== -1
          ? /\(0,[A-Za-z0-9_$]+\.jsxs?\)\(([A-Za-z0-9_$]+),\{size:`xs`,variant:`(?:outline|ghost)`/.exec(
              chatSettings.slice(Math.max(0, restoreIdx - 150), restoreIdx + 350)
            )
          : null;
      const btnIdent = btnIdentMatch ? btnIdentMatch[1] : null;
      const langBtnRender = btnIdent
        ? `(0,$6.jsx)(${btnIdent},{size:\`xs\`,variant:\`outline\`,onClick:()=>{let cur=globalThis.__t3GetLocale?globalThis.__t3GetLocale():\`zh-CN\`;globalThis.__t3SetLocale&&globalThis.__t3SetLocale(cur===\`en\`?\`zh-CN\`:\`en\`)},title:\`切换界面语言 / Switch UI Language\`,children:(globalThis.__t3GetLocale?globalThis.__t3GetLocale():\`zh-CN\`)===\`en\`?\`🌐 简体中文\`:\`🌐 English\`})`
        : `(0,$6.jsx)(\`button\`,{type:\`button\`,className:\`inline-flex h-6 items-center justify-center rounded-md border border-border bg-background px-2 text-xs font-medium text-foreground hover:bg-accent\`,onClick:()=>{let cur=globalThis.__t3GetLocale?globalThis.__t3GetLocale():\`zh-CN\`;globalThis.__t3SetLocale&&globalThis.__t3SetLocale(cur===\`en\`?\`zh-CN\`:\`en\`)},title:\`切换界面语言 / Switch UI Language\`,children:(globalThis.__t3GetLocale?globalThis.__t3GetLocale():\`zh-CN\`)===\`en\`?\`🌐 简体中文\`:\`🌐 English\`})`;

      const res = replaceOptionalRegex(
        chatSettings,
        /let\s+([A-Za-z0-9_$]+);([A-Za-z0-9_$]+)\[(\d+)\]===([A-Za-z0-9_$]+)\?\1=\2\[(\d+)\]:\(\1=\(0,([A-Za-z0-9_$]+)\.jsxs\)\(`div`,\{className:`ms-auto flex shrink-0 items-center gap-1`,children:\[\4,([A-Za-z0-9_$]+)\]\}\),\2\[\3\]=\4,\2\[\5\]=\1\);/,
        `let langBtn=${langBtnRender},$1;$2[$3]===$4?$1=$2[$5]:($1=(0,$6.jsxs)(\`div\`,{className:\`ms-auto flex shrink-0 items-center gap-1.5\`,children:[langBtn,$4,$7]}),$2[$3]=$4,$2[$5]=$1);`,
        `${path.basename(chatSettingsPath)} header language toggle button`
      );
      if (res.applied) modifiedFiles.set(chatSettingsPath, Buffer.from(res.code, "utf8"));
    }

    // (g) SettingsPanels-*.js (UI language selector in Display at top of Settings -> General)
    const settingsPanelsPath = findClientAsset(header, /^SettingsPanels-[A-Za-z0-9_-]+\.js$/);
    if (settingsPanelsPath) {
      let settingsPanels = readFileFromAsar(srcFd, dataOffset, header, settingsPanelsPath);
      const triggerMatch = /\(0,([A-Za-z0-9_$]+)\.jsx\)\(([A-Za-z0-9_$]+),\{size:`sm`,className:`w-full sm:w-40`,"aria-label":`Timestamp format`,children:\(0,\1\.jsx\)\(([A-Za-z0-9_$]+),/.exec(
        settingsPanels
      );
      const popupMatch = /\(0,[A-Za-z0-9_$]+\.jsxs\)\(([A-Za-z0-9_$]+),\{align:`end`,alignItemWithTrigger:!1,children:\[\(0,[A-Za-z0-9_$]+\.jsx\)\(([A-Za-z0-9_$]+),\{hideIndicator:!0,value:`locale`/.exec(
        settingsPanels
      );
      const rootMatch = /\(0,[A-Za-z0-9_$]+\.jsxs\)\(([A-Za-z0-9_$]+),\{value:[A-Za-z0-9_$.]+timestampFormat,onValueChange:/.exec(
        settingsPanels
      );

      if (triggerMatch && popupMatch && rootMatch) {
        const jsxNs = triggerMatch[1];
        const selTrigger = triggerMatch[2];
        const selValue = triggerMatch[3];
        const selPopup = popupMatch[1];
        const selItem = popupMatch[2];
        const selRoot = rootMatch[1];

        const r1 = replaceOptionalRegex(
          settingsPanels,
          /\(0,([A-Za-z0-9_$]+)\.jsx\)\(([A-Za-z0-9_$]+),\{id:`display`,title:`Display`,children:\(0,\1\.jsx\)\(([A-Za-z0-9_$]+),\{\.\.\.([A-Za-z0-9_$]+),description:`System default follows your browser or OS clock preference\.`,resetAction:([A-Za-z0-9_$]+),control:([A-Za-z0-9_$]+)\}\)\}\)/,
          `(0,${jsxNs}.jsxs)($2,{id:\`display\`,title:\`Display\`,children:[(0,${jsxNs}.jsx)($3,{id:\`language\`,title:\`UI language\`,description:\`Choose the display language for the T3 Code interface.\`,control:(0,${jsxNs}.jsxs)(${selRoot},{value:globalThis.__t3GetLocale?globalThis.__t3GetLocale():\`zh-CN\`,onValueChange:e=>{globalThis.__t3SetLocale&&globalThis.__t3SetLocale(e)},children:[(0,${jsxNs}.jsx)(${selTrigger},{size:\`sm\`,className:\`w-full sm:w-40\`,"aria-label":\`UI language\`,children:(0,${jsxNs}.jsx)(${selValue},{children:(globalThis.__t3GetLocale?globalThis.__t3GetLocale():\`zh-CN\`)===\`en\`?\`English\`:\`简体中文\`})}),(0,${jsxNs}.jsxs)(${selPopup},{align:\`end\`,alignItemWithTrigger:!1,children:[(0,${jsxNs}.jsx)(${selItem},{hideIndicator:!0,value:\`zh-CN\`,children:\`简体中文\`}),(0,${jsxNs}.jsx)(${selItem},{hideIndicator:!0,value:\`en\`,children:\`English\`})]})]})}),(0,${jsxNs}.jsx)($3,{...$4,description:\`System default follows your browser or OS clock preference.\`,resetAction:$5,control:$6})]})`,
          `${path.basename(settingsPanelsPath)} Language selector in Display`
        );

        let finalCode = r1.code;
        let r2Applied = false;
        const dispVarMatch = /([A-Za-z0-9_$]+)=\(0,[A-Za-z0-9_$]+\.jsxs?\)\([A-Za-z0-9_$]+,\{id:`display`,title:`Display`/.exec(
          finalCode
        );
        if (dispVarMatch) {
          const dispVar = dispVarMatch[1];
          const escapedDispVar = dispVar.replace(/\$/g, "\\$");
          const r2 = replaceOptionalRegex(
            finalCode,
            new RegExp(`children:\\[((?:[A-Za-z0-9_$]+,)+)${escapedDispVar}\\]\\}\\)`),
            (_m, before) => `children:[${dispVar},${before.slice(0, -1)}]})`,
            `${path.basename(settingsPanelsPath)} move Display section to top of General`
          );
          finalCode = r2.code;
          r2Applied = r2.applied;
        }
        if (r1.applied || r2Applied) {
          modifiedFiles.set(settingsPanelsPath, Buffer.from(finalCode, "utf8"));
        }
      } else {
        console.warn(
          `[WARN] Optional patch skipped (Select primitives changed): ${path.basename(settingsPanelsPath)}`
        );
      }
    }

    // (h) settingsSearch-*.js (UI language item + bilingual search)
    const settingsSearchPath = findClientAsset(header, /^settingsSearch-[A-Za-z0-9_-]+\.js$/);
    if (settingsSearchPath) {
      let settingsSearch = readFileFromAsar(srcFd, dataOffset, header, settingsSearchPath);
      const r1 = replaceOptionalRegex(
        settingsSearch,
        /\{id:`time-format`,title:`Time format`,to:`\/settings\/general`,searchTerms:\[`timestamp clock locale system browser os 12 hour 24 hour`\]\}/,
        `{id:\`language\`,title:\`UI language\`,to:\`/settings/general\`,searchTerms:[\`language ui locale chinese english 简体中文 语言 界面语言 汉化\`]},{id:\`time-format\`,title:\`Time format\`,to:\`/settings/general\`,searchTerms:[\`timestamp clock locale system browser os 12 hour 24 hour\`]}`,
        `${path.basename(settingsSearchPath)} language entry`
      );
      const r2 = replaceOptionalRegex(
        r1.code,
        /let\s+([A-Za-z0-9_$]+)=([A-Za-z0-9_$]+)\(([A-Za-z0-9_$]+)\.title\),([A-Za-z0-9_$]+)=\[\1,\2\(([A-Za-z0-9_$]+)\[\3\.to\]\),\.\.\.\(\3\.searchTerms\?\?\[\]\)\.map\(\2\)\];/,
        `let _tr=globalThis.__t3TrForceZh||globalThis.__t3Tr,_zhT=_tr?_tr($3.title):"",_zhS=_tr&&$5[$3.to]?_tr($5[$3.to]):"",$1=$2($3.title),$4=[$1,$2(_zhT),$2($5[$3.to]),$2(_zhS),...($3.searchTerms??[]).map($2)];`,
        `${path.basename(settingsSearchPath)} bilingual search index`
      );
      if (r1.applied || r2.applied) {
        modifiedFiles.set(settingsSearchPath, Buffer.from(r2.code, "utf8"));
      }
    }

    // (h2) keybindingsSearch.logic-*.js (Bilingual Chinese/English shortcut search)
    const kbLogicPath = findClientAsset(header, /^keybindingsSearch\.logic-[A-Za-z0-9_-]+\.js$/);
    if (kbLogicPath) {
      let kbLogic = readFileFromAsar(srcFd, dataOffset, header, kbLogicPath);
      const res = replaceOptionalRegex(
        kbLogic,
        /return\[e\.label,e\.command,\.\.\.r,e\.groupLabel\]/,
        `return[e.label,globalThis.__t3Tr?globalThis.__t3Tr(e.label):"",e.command,...r,e.groupLabel,globalThis.__t3Tr?globalThis.__t3Tr(e.groupLabel):""]`,
        `${path.basename(kbLogicPath)} bilingual search`
      );
      if (res.applied) modifiedFiles.set(kbLogicPath, Buffer.from(res.code, "utf8"));
    }

    // (i) timestampFormat-*.js (Relative time localization)
    const tsFormatPath = findClientAsset(header, /^timestampFormat-[A-Za-z0-9_-]+\.js$/);
    if (tsFormatPath) {
      let tsFormat = readFileFromAsar(srcFd, dataOffset, header, tsFormatPath);
      const res = replaceOptionalRegex(
        tsFormat,
        /function\s+([A-Za-z0-9_$]+)\(([A-Za-z0-9_$]+)\)\{let\s+([A-Za-z0-9_$]+)=Math\.floor\(\2\/1e3\);if\(\3<60\)return\{value:`just now`,suffix:null\};let\s+([A-Za-z0-9_$]+)=Math\.floor\(\3\/60\);if\(\4<60\)return\{value:`\$\{\4\}m`,suffix:`ago`\};let\s+([A-Za-z0-9_$]+)=Math\.floor\(\4\/60\);return\s+\5<24\?\{value:`\$\{\5\}h`,suffix:`ago`\}:\{value:`\$\{Math\.floor\(\5\/24\)\}d`,suffix:`ago`\}\}/,
        `function $1($2){let zh=(globalThis.__t3GetLocale?globalThis.__t3GetLocale():\`zh-CN\`)!==\`en\`,$3=Math.floor($2/1e3);if($3<60)return{value:zh?\`刚刚\`:\`just now\`,suffix:null};let $4=Math.floor($3/60);if($4<60)return{value:zh?\`\${$4} 分钟\`:\`\${$4}m\`,suffix:zh?\`前\`:\`ago\`};let $5=Math.floor($4/60);return $5<24?{value:zh?\`\${$5} 小时\`:\`\${$5}h\`,suffix:zh?\`前\`:\`ago\`}:{value:zh?\`\${Math.floor($5/24)} 天\`:\`\${Math.floor($5/24)}d\`,suffix:zh?\`前\`:\`ago\`}}`,
        `${path.basename(tsFormatPath)} relative time`
      );
      if (res.applied) modifiedFiles.set(tsFormatPath, Buffer.from(res.code, "utf8"));
    }

    // (j) toast-*.js & toastHelpers-*.js
    const toastPath = findClientAsset(header, /^toast-[A-Za-z0-9_-]+\.js$/);
    if (toastPath) {
      let toastJs = readFileFromAsar(srcFd, dataOffset, header, toastPath);
      const res = replaceOptionalRegex(
        toastJs,
        /contextMenu:\{show:async\(([A-Za-z0-9_$]+),([A-Za-z0-9_$]+)\)=>window\.desktopBridge\?window\.desktopBridge\.showContextMenu\(\1,\2\):([A-Za-z0-9_$]+)\(\1,\2\),close:async\(\)=>\{window\.desktopBridge\|\|([A-Za-z0-9_$]+)\(\)\}\}/,
        `contextMenu:{show:async($1,$2)=>{let m=globalThis.__t3TrMenuItems?globalThis.__t3TrMenuItems($1):$1;return window.desktopBridge?window.desktopBridge.showContextMenu(m,$2):$3(m,$2)},close:async()=>{window.desktopBridge||$4()}}`,
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

    // (k) preload.cjs (UI locale bridge)
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

    // (k2) Optional preview-pick-preload.cjs (only when --with-1password is enabled)
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

    // (l) main.cjs
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
    clearCaches();
    console.log(
      `\n✅ Successfully patched T3 Code (v${currentVersion}) with Simplified Chinese (zh-CN) localization!`
    );
    console.log(`   Target: ${appAsarPath}`);
    console.log(`   Tip: Press Cmd+R (macOS) or Ctrl+R (Win/Linux) inside T3 Code to reload immediately.`);
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
  // When invoked via `npx`, __dirname may point to a temporary npm cache directory.
  // Copy the self-contained patcher files into ~/.t3/zh-cn-patcher so LaunchAgent always has a permanent script.
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

function installAutoUpdateWatcher({ appPath = null } = {}) {
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
  console.log(`   Whenever T3 Code updates ${appAsarPath}, zh-CN localization will be re-applied automatically!`);
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
  await applyPatch({
    appPath: opts.appPath,
    onlyIfUnpatched: true,
    with1Password: opts.with1Password
  });
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
  installAutoUpdateWatcher({ appPath: opts.appPath });
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
