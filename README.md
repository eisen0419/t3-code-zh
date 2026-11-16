<p align="center">
  <img src="assets/icon.svg" width="72" height="72" alt="T3 Code zh-CN">
</p>

<h1 align="center">T3 Code 简体中文汉化包 (t3-code-zh)</h1>

<p align="center">
  零外部依赖 · 一键命令行 <code>npx</code> 汉化 · 内置中英实时切换 · 支持 AI Agent Skill 自进化补词
</p>

---

本项目为桌面端 **T3 Code / T3 Code (Beta)**（支持 macOS / Windows / Linux）提供完整的**简体中文（`zh-CN`）**界面本地化支持，同时内置 [`SKILL.md`](./SKILL.md) 以便通过 Claude Code / Codex / Antigravity / T3 Code 自身的 Agent 自然语言一键安装或自动适配新版本词条。

## ✨ 核心特性

- **全量深度汉化**：覆盖 **6,290+ 条精确词条** 与 **780+ 条受保护动态插值模板**（侧边栏、对话流、命令面板、全部分类设置页、语音听写与转写、快捷键、工作树、源代码管理、拉取请求、差异对比、内置预览浏览器、远程环境与设备中心、用量统计等）。
- **原生系统菜单与弹窗汉化**：同步汉化顶部应用菜单栏、右键上下文菜单及系统原生对话框。
- **随时一键中英切换**：
  - 侧边栏左下角新增 **`EN / 中`** 快捷切换按钮；
  - 设置页顶部栏新增 **`🌐 English / 🌐 简体中文`** 按钮；
  - **设置 → 通用 → 显示（Display）** 新增 **界面语言（UI language）** 下拉框；
  - 顶部菜单栏 **视图（View）→ 界面语言** 同步切换。
- **中英双语搜索**：设置搜索框与快捷键搜索框同时支持中文（如 `语音`、`主题`、`工作树`、`快捷键`）与英文原词检索。
- **自适应升级与自动重打补丁**：基于文件名正则与 AST 模式匹配（不依赖固定构建 Hash），支持安装 macOS `LaunchAgent` 守护——**T3 Code 客户端自动更新后秒级无感恢复中文**。
- **安全可逆 & 零第三方依赖**：纯 Node.js 原生模块实现 ASAR 解包追加与 SHA-256 完整性重算，首次运行自动备份原版 `app.asar.bak`，随时一键无损还原。

---

## 🚀 快速开始（方式一：终端一行命令）

> 环境要求：已安装 **Node.js >= 18** 与 **T3 Code** 客户端。

### 1. 一键汉化（无需克隆，终端一行命令）

```bash
npx github:eisen0419/t3-code-zh
```

> 若已发布至 npm 也可运行 `npx t3-code-zh`，或克隆本仓库运行：
> ```bash
> git clone https://github.com/eisen0419/t3-code-zh.git
> cd t3-code-zh
> node patch-t3-zh.mjs
> ```

执行完成后，在已打开的 T3 Code 窗口按下 **`⌘R`**（macOS）或 **`Ctrl+R`**（Windows / Linux）即可立即看到中文界面！

### 2. 开启「客户端更新自动保持汉化」（macOS 推荐）

避免每次 T3 Code 自动更新后手动重跑脚本：

```bash
npx github:eisen0419/t3-code-zh install-watcher
# 或克隆仓库后：node patch-t3-zh.mjs install-watcher
```

### 3. 查看状态 / 一键还原英文原版

```bash
# 查看当前 T3 Code 版本、汉化状态与自动守护状态
npx github:eisen0419/t3-code-zh status

# 无损还原为官方英文原版（同时自动卸载更新守护）
npx github:eisen0419/t3-code-zh restore
```

> 如果你的 T3 Code 安装在非默认目录，可附加 `--app-path "/path/to/T3 Code.app"` 参数（或设置环境变量 `T3_CODE_APP_PATH`）。

---

## 🤖 方式二：作为 AI Agent Skill 安装（支持自动进化补词）

本仓库根目录内置标准 [`SKILL.md`](./SKILL.md)，可直接安装到支持 Skills 的编码 Agent（如 T3 Code、Claude Code、Codex、Cursor、Antigravity）：

```bash
npx skills add eisen0419/t3-code-zh
```

安装后，你可以直接在 T3 Code 对话框中用自然语言操作：
- 💬 *“帮我把 T3 Code 汉化成中文，并开启更新自动重打补丁”*
- 💬 *“把 T3 Code 还原成英文原版”*
- 💬 **版本更新自愈**：当未来 T3 Code 发布新版本出现个别未翻译的新按钮或文案时，直接截图发给 T3 Code 里的 Agent 说 *“把这个页面漏翻的英文补进汉化包”*——Agent 会按照 `SKILL.md` 自动运行 `scripts/audit-untranslated.mjs` 扫描新版 Bundle、更新词库并重打补丁！

---

## 📁 目录结构

```text
.
├── patch-t3-zh.mjs              # 跨平台 ASAR 补丁与完整性重签 CLI 主程序（零外部依赖）
├── build-i18n.mjs               # 词典合并与客户端运行时编译脚本
├── locales/                     # 按模块拆分的简体中文精确词典与模板 JSON
├── dist/
│   └── zh-cn-i18n.js            # 预编译的客户端汉化运行时
├── scripts/
│   └── audit-untranslated.mjs   # 新版本未翻译词条与语病自动扫描审计工具
├── SKILL.md                     # AI Agent Skill 指令定义文件
└── package.json                 # npm CLI 包定义（bin: t3-code-zh）
```

## 🛠️ 维护与贡献新词条

1. 运行审计工具扫描当前客户端特定模块的未翻译词条：
   ```bash
   npm run audit -- --filter voice
   ```
2. 在 [`build-i18n.mjs`](./build-i18n.mjs) 的 `curatedExact`（静态词条）或 `templateMap`（动态插值模板）中添加翻译。
3. 重新编译并应用到本机 T3 Code 验证效果：
   ```bash
   npm run patch
   ```

## 📄 License

[MIT](./LICENSE)
