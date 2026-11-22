#!/usr/bin/env node
/**
 * Automated regression & smoke-test suite for t3-code-zh.
 * Verifies:
 *   1. V8 syntax cleanliness of dist/zh-cn-i18n.js and patched app.asar bundles
 *   2. Runtime React 19 jsx/Fragment transformProps behavior (Settings header switcher, Sidebar switcher, gt-react <T> hash preservation)
 *   3. Zero CJK-space-CJK anomalies, zero half-translated Chinglish, and zero forbidden geographic terms
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);

const { compileRuntimeSource } = await import(path.join(rootDir, "build-i18n.mjs"));
const bundlePath = path.join(rootDir, "dist", "zh-cn-i18n.js");
const bundleCode = fs.existsSync(bundlePath)
  ? fs.readFileSync(bundlePath, "utf8")
  : compileRuntimeSource();

// 1. V8 Syntax Check on generated runtime
new vm.Script(bundleCode, { filename: "zh-cn-i18n.js" });

// 2. Prohibited geographic terms check
for (const forbidden of ["Shanghai", "Beijing", "上海", "北京"]) {
  assert.equal(
    bundleCode.includes(forbidden),
    false,
    `Forbidden geographic term found in bundle: ${forbidden}`
  );
}

// 3. Simulated browser + React 19 + gt-react environment smoke tests
const store = new Map([["t3code:locale", "zh-CN"]]);
globalThis.localStorage = {
  getItem: k => store.get(k) ?? null,
  setItem: (k, v) => store.set(k, String(v))
};
globalThis.window = {
  location: { pathname: "/settings/general", reload: () => {} },
  addEventListener: () => {}
};
globalThis.document = {
  documentElement: { lang: "en" },
  body: null
};

require(bundlePath);
const tr = globalThis.__t3TrForceZh;
const tp = globalThis.__t3TransformProps;
const ELEMENT_MARKER = Symbol.for("react.transitional.element");
const FRAGMENT_MARKER = Symbol.for("react.fragment");

// 3a. Key translations & Chinglish regression checks
const expectedPairs = [
  ["Settings", "设置"],
  ["Input", "输入"],
  ["Thinking Level", "思考深度"],
  ["Auto-merge (squash and merge)", "自动合并（压缩并合并）"],
  ["Clipboard API is unavailable while copying connection diagnostics.", "复制连接诊断信息时剪贴板 API 不可用。"],
  ["Delegated from a linked environment. Connect to it to open the parent thread.", "由已关联环境委派。连接到该环境即可打开父会话。"],
  ["Closes this issue", "关闭此议题"],
  ["Link several environments", "关联多个环境"],
  ["Speed: not benchmarked", "速度：暂无基准测试数据"],
  ["New thread on main", "在 main 上新建对话"],
  ["Filter by ARTEX", "按 ARTEX 筛选"],
  ["Auto-settle behavior", "自动归置行为"],
  ["In 1 hour (13:24)", "1 小时后 (13:24)"],
  ["In 3 hours (15:24)", "3 小时后 (15:24)"],
  ["This evening (18:00)", "今天晚上 (18:00)"],
  ["Tomorrow (09:00)", "明天 (09:00)"],
  ["Next week (Mon 09:00)", "下周 (周一 09:00)"],
  ["Custom...", "自定义..."],
  ["(1 row)", "(1 行)"],
  ["Authenticated · pi", "已认证 · pi"],
  ["Not authenticated · codex", "未认证 · codex"],
  ["Branch: main", "分支：main"],
  ["Push to main", "推送到 main"],
  ["omarchy is waiting for someone to approve this device", "omarchy 正在等待有人批准此设备"]
];
for (const [src, exp] of expectedPairs) {
  assert.equal(tr(src), exp, `Translation mismatch for "${src}"`);
}

// 3a-2. Verify context menu items & nested snooze submenu detail translation
const menuOut = globalThis.__t3TrMenuItems([
  { id: "new-thread-on-branch", label: "New thread on main" },
  {
    id: "snooze",
    label: "Snooze",
    children: [
      { id: "snooze:1h", label: "In 1 hour", detail: "13:24" },
      { id: "snooze:next-week", label: "Next week", detail: "Mon 09:00" },
      { id: "snooze:custom", label: "Custom..." }
    ]
  }
]);
assert.equal(menuOut[0].label, "在 main 上新建对话");
assert.equal(menuOut[1].label, "暂缓");
assert.equal(menuOut[1].children[0].label, "1 小时后");
assert.equal(menuOut[1].children[1].label, "下周");
assert.equal(menuOut[1].children[1].detail, "周一 09:00");
assert.equal(menuOut[1].children[2].label, "自定义...");

// 3b. Context-sensitive sidebar status pill vs plain "Input" heading
const pillProps = tp(
  "span",
  { className: "inline-flex text-indigo-600", children: ["<icon/>", "Input"] },
  ELEMENT_MARKER
);
assert.equal(pillProps.children[1], "待输入");
const headingProps = tp("h2", { className: "font-semibold", children: "Input" }, ELEMENT_MARKER);
assert.equal(headingProps.children, "输入");

// 3c. gt-react <T> (_gtt = "translate-client") hash preservation — including initial boot frame (lang="en")
// AND bottom-up nested JSX tags (<span>Applying settings for</span> ... <span>across</span> + <Var> menus)!
function MockGtT(props) {
  return props.children;
}
MockGtT._gtt = "translate-client";
function MockGtVar(props) {
  return props.children;
}
MockGtVar._gtt = "variable-variable";
function jsxSim(type, rawProps) {
  const nextProps = tp(type, rawProps, ELEMENT_MARKER);
  return { $$typeof: ELEMENT_MARKER, type, key: null, ref: null, props: nextProps };
}

for (const htmlLang of ["en", "zh"]) {
  globalThis.document.documentElement.lang = htmlLang;
  const compoundKids = [
    "Reconnect ",
    jsxSim(MockGtVar, { children: "MacBook" }),
    " to change its settings."
  ];
  const gtEl = jsxSim(MockGtT, { children: compoundKids });
  assert.equal(
    gtEl.props.children[0],
    "Reconnect ",
    `gt-react <T> direct string child must stay unmutated when html lang=${htmlLang}`
  );

  // Simulate exact bottom-up evaluation of settingsLayout scope sentence:
  // <T><span><span>Applying settings for</span><Var><button>All projects</button></Var></span><span><span>across</span><Var><button>All environments</button></Var></span></T>
  const projTrigger = jsxSim("button", { children: "All projects" });
  const envTrigger = jsxSim("button", { children: "All environments" });
  assert.equal(projTrigger.props.children, "所有项目");
  assert.equal(envTrigger.props.children, "所有环境");

  const spanApplyLabel = jsxSim("span", { className: "shrink-0", children: "Applying settings for" });
  // Before wrapping in <T>, standalone <span> translates bottom-up:
  assert.equal(spanApplyLabel.props.children, "正在应用设置：");

  const scopeSentence = jsxSim(MockGtT, {
    context: "settings scope sentence; each variable is a menu",
    children: [
      jsxSim("span", {
        className: "flex min-w-0 items-center gap-1.5",
        children: [spanApplyLabel, jsxSim(MockGtVar, { children: projTrigger })]
      }),
      jsxSim("span", {
        className: "flex min-w-0 items-center gap-1.5",
        children: [
          jsxSim("span", { className: "shrink-0", children: "across" }),
          jsxSim(MockGtVar, { children: envTrigger })
        ]
      })
    ]
  });

  // Inside <T>, nested <span> source strings MUST be restored to exact English so hash 86d52b318b1a3e7a matches zh-*.js ("设置应用于 ... 位于 ..."),
  // while <Var> slots MUST keep their Chinese UI labels ("所有项目", "所有环境")!
  assert.equal(scopeSentence.props.children[0].props.children[0].props.children, "Applying settings for");
  assert.equal(scopeSentence.props.children[0].props.children[1].props.children.props.children, "所有项目");
  assert.equal(scopeSentence.props.children[1].props.children[0].props.children, "across");
  assert.equal(scopeSentence.props.children[1].props.children[1].props.children.props.children, "所有环境");

  // Also verify single-string upstream zh gap fallback (<T>Branch</T> -> "分支") still works!
  const fallbackBranch = jsxSim(MockGtT, { children: "Branch" });
  assert.equal(fallbackBranch.props.children, "分支");
}
globalThis.document.documentElement.lang = "en";

// 3d. Zero-regex Settings Header & Sidebar Footer button injection (in both zh-CN and en!)
for (const locale of ["zh-CN", "en"]) {
  store.set("t3code:locale", locale);
  const headerOut = tp(
    "header",
    {
      className: "flex h-12 shrink-0 items-center gap-3 border-b ps-5 pe-2",
      children: [
        { $$typeof: ELEMENT_MARKER, type: "div", key: null, ref: null, props: { children: "General" } },
        { $$typeof: ELEMENT_MARKER, type: "div", key: null, ref: null, props: { className: "ms-auto flex shrink-0 items-center gap-1", children: [null] } }
      ]
    },
    ELEMENT_MARKER
  );
  const injectedHeaderBtn = headerOut.children[1].props.children[0];
  assert.equal(injectedHeaderBtn.key, "__t3-zh-lang-btn");
  assert.equal(injectedHeaderBtn.type, "button");
  assert.equal(injectedHeaderBtn.props.children, locale === "en" ? "🌐 简体中文" : "🌐 English");

  function MockFooterIconBtn() {}
  const fragOut = tp(
    FRAGMENT_MARKER,
    {
      children: [
        { $$typeof: ELEMENT_MARKER, type: MockFooterIconBtn, key: "s", ref: null, props: { label: "Settings" } },
        { $$typeof: ELEMENT_MARKER, type: MockFooterIconBtn, key: "u", ref: null, props: { label: "Usage" } }
      ]
    },
    ELEMENT_MARKER
  );
  const injectedFooterBtn = fragOut.children[fragOut.children.length - 1];
  assert.equal(injectedFooterBtn.key, "__t3-sidebar-lang-btn");
  assert.equal(injectedFooterBtn.type, MockFooterIconBtn);
}
store.set("t3code:locale", "zh-CN");

// 4. If T3 Code is installed locally, audit patched app.asar for syntax & Chinglish cleanliness
const candidateAsar = "/Applications/T3 Code (Beta).app/Contents/Resources/app.asar";
if (fs.existsSync(candidateAsar)) {
  const buf = fs.readFileSync(candidateAsar);
  const hs = buf.readUInt32LE(12);
  const header = JSON.parse(buf.subarray(16, 16 + hs).toString("utf8"));
  const doff = 8 + buf.readUInt32LE(4);
  const assets = header.files.apps.files.server.files.dist.files.client.files.assets.files;

  for (const name of Object.keys(assets)) {
    if (/^(?:jsx-runtime|react|toast|toastHelpers|zh-cn-i18n).*\.js$/.test(name)) {
      const m = assets[name];
      const slice = buf.subarray(doff + Number(m.offset), doff + Number(m.offset) + m.size);
      execFileSync(process.execPath, ["--check", "--input-type=module"], {
        input: slice,
        stdio: ["pipe", "pipe", "pipe"]
      });
    }
  }

  let cjkSpace = 0;
  let chinglish = 0;
  const strRe = /(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|`((?:[^`$\\]|\\.)*)`)/g;
  for (const [name, meta] of Object.entries(assets)) {
    if (!name.endsWith(".js") || name === "zh-cn-i18n.js") continue;
    if (/^(?:de|en|es|fr|ja|ko|pt-BR|ru|sv|zh)-[A-Za-z0-9_-]+\.js$/.test(name)) continue;
    const code = buf.subarray(doff + Number(meta.offset), doff + Number(meta.offset) + meta.size).toString("utf8");
    let m;
    while ((m = strRe.exec(code)) !== null) {
      const raw = (m[1] ?? m[2] ?? m[3] ?? "").replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\'/g, "'");
      if (!raw || raw.length < 3 || raw.length > 260) continue;
      if (!/[A-Z]/.test(raw) && !/\s/.test(raw)) continue;
      if (/^[a-z0-9_./:@#$-]+$/i.test(raw) || /[{};=<>]/.test(raw)) continue;
      const out = tr(raw);
      if (out !== raw) {
        if (/[\u4e00-\u9fff][ ]+[\u4e00-\u9fff]/.test(out)) cjkSpace++;
        if (/[\u4e00-\u9fff]/.test(out) && /\b[a-z]{3,}\s+[a-z]{3,}\b/.test(out) && !/`/.test(out)) {
          chinglish++;
        }
      }
    }
  }
  assert.equal(cjkSpace, 0, `Expected 0 CJK-space-CJK anomalies, got ${cjkSpace}`);
  assert.equal(chinglish, 0, `Expected 0 half-translated Chinglish strings, got ${chinglish}`);
  console.log("✅ Verified installed app.asar: 0 syntax errors, 0 CJK-space anomalies, 0 Chinglish strings!");
}

console.log("✅ All t3-code-zh smoke & regression tests passed!");
