---
name: t3-code-zh
description: Localize T3 Code desktop app into Simplified Chinese (zh-CN), restore English app.asar, enable auto-repatch across T3 updates, or fix untranslated/mangled UI strings on new T3 Code versions. Use when the user asks to translate/汉化 T3 Code, restore original English, check localization status, or fix untranslated strings in a T3 Code screenshot or release.
---

# T3 Code Simplified Chinese Localization (`t3-code-zh`)

Locate the repository root containing `patch-t3-zh.mjs` and `build-i18n.mjs` relative to this `SKILL.md` file (`<skill-dir>`). All commands run with Node.js >= 18 and zero external npm dependencies.

## 1. Apply, Restore, or Watch

Run `node <skill-dir>/patch-t3-zh.mjs <command>` according to user intent:

- **One-click localize (`apply`)**:
  ```bash
  node <skill-dir>/patch-t3-zh.mjs apply
  ```
- **Localize + auto-repatch after T3 Code updates on macOS (`install-watcher`)**:
  ```bash
  node <skill-dir>/patch-t3-zh.mjs install-watcher
  ```
- **Check version & patch status (`status`)**:
  ```bash
  node <skill-dir>/patch-t3-zh.mjs status
  ```
- **Restore official English build (`restore`)**:
  ```bash
  node <skill-dir>/patch-t3-zh.mjs restore
  ```
- **Custom install location**: pass `--app-path "/path/to/T3 Code.app"` (or the directory containing `app.asar`).

**Completion criterion**: `patch-t3-zh.mjs` exits `0` and prints `✅`. Tell the user to press `⌘R` (macOS) or `Ctrl+R` (Windows/Linux) inside T3 Code to reload the UI immediately.

## 2. Evolve Translations for New T3 Code Releases or Screenshots

When the user reports untranslated English text or a mangled translation after a T3 Code update:

1. **Audit target bundles**:
   ```bash
   node <skill-dir>/scripts/audit-untranslated.mjs --filter <keyword>
   ```
    Note: T3 Code's Rolldown bundler emits many static UI strings as backtick literals (`` `...` ``) alongside `"..."` and `'...'`; `audit-untranslated.mjs` scans all three forms from `app.asar.bak` / `app.asar`.
2. **Add translations in `build-i18n.mjs`**:
   - **Static strings**: add to `curatedExact` in `build-i18n.mjs` (overrides `locales/*.json`).
   - **Dynamic single-placeholder or multi-placeholder strings**: add to `templateMap` in `build-i18n.mjs` using `${}` (sequential) or `${1}` / `${2}` (reordered). Keep literal anchors specific (>= 2 words) so short templates never match arbitrary English prose.
   - **Split JSX child arrays** (e.g. `["Connect to ", <Badge/>, " to continue."]`) or **context-dependent labels** (e.g. sidebar status pill `"Input"` vs section heading `"Input"`): handle in `translateChildrenArray` or `transformProps` inside `build-i18n.mjs`.
3. **Rebuild, repatch, and verify**:
   ```bash
   node <skill-dir>/patch-t3-zh.mjs apply
   node <skill-dir>/scripts/audit-untranslated.mjs --filter <keyword>
   ```

**Completion criterion**: Every reported UI string translates cleanly with `0` `CJK-space-CJK` anomalies and `0` half-translated Chinglish outputs, and `app.asar` is freshly patched.
