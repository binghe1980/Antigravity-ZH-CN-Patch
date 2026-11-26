# Antigravity-ZH-CN-Patch 维护记忆与发版规范

本文件记录本仓库在适配 Antigravity 新版本与发布 GitHub 更新时必须严格遵守的核对清单与安全红线，避免遗漏步骤或越界修改。

## 1. 新版本适配与发布必检清单（缺一不可）

每次检测到 Antigravity 官方发布新版本 `v<X.Y.Z>` 并更新本项目时，必须按以下清单逐项完成并验证：

1. **版本与脚本元数据同步**：
   - `localize.js`：`CURRENT_VERSION` 与 `RELEASE_VERSION`
   - `package.json`：`version`
   - `install_mac.sh`：`EXPECTED_VERSION`
   - `index.html`：顶部状态栏 `控制中心 v<X.Y.Z>`
   - `extracted/package.json`：与官方新版本一致
2. **源码差异与前端扫漏**：
   - 解包本机官方 `app.asar`，逐文件比对 `dist/**` 变更，确保 `applyTranslations` 全部主进程补丁点 `0` 跳过命中；
   - 解包检查 `language_server` 内嵌前端资源（`main.js` 等），补齐新增/遗漏的高频 UI 文案，确保 `src/dictionary.js` **0 重复键**；
   - 动态正则规则严禁使用 `$1`/`$&` 模板替换字符串，必须使用回调函数保证 `$`-安全与幂等性。
3. **官方瘦身解包规范打包**：
   - 基于含 `chrome-devtools-mcp` 的官方解包目录执行打包，必须携带 `--unpack-dir "**/chrome-devtools-mcp"` 以保持与官方 `app.asar.unpacked` 的头信息完全一致；
   - 同步刷新仓库根目录 `app.asar.ready` 与 `extracted/`（`extracted/node_modules/chrome-devtools-mcp/` 保持由 `.gitignore` 排除）。
4. **文档与变更日志同步**：
   - `README.md` 与 `README.en.md`（适配版本、ASAR 体积、词典条目数、测试套件数量）
   - `CHANGELOG.md` 与 `CHANGELOG.en.md`（顶部新增 `## v<X.Y.Z> (YYYY-MM-DD)` 章节）
   - `docs/architecture.md` 与 `docs/architecture.en.md`
5. **全链路自动化验证**：
   - 新增/更新对应版本的专项测试并注册至 `tests/run-all-tests.js`；
   - 执行 `npm test` 全部通过（100% ALL GREEN）；
   - 对 `extracted/dist/**/*.js` 全量执行 `node --check`，对 `install_mac.sh` 执行 `bash -n`；
   - 执行 `node localize.js --check-status` 确认本机版本与 `app.asar.ready` 精确匹配。
6. **GitHub 仓库、Release 与 About 同步（重点防漏！）**：
   - 推送代码与版本标签 `v<X.Y.Z>` 到 `origin main`；
   - 发布 GitHub Release `v<X.Y.Z>`，上传 `app.asar`、`app.asar.ready` 与 `SHA256SUMS.txt`；
   - **必须同步更新 GitHub 仓库右侧 About 描述中的版本号**：
     ```bash
     gh repo edit binghe1980/Antigravity-ZH-CN-Patch --description "Google Antigravity v<X.Y.Z> 深度中文汉化补丁与跨平台安装工具 (MIT)"
     ```
     并在更新后通过 `gh repo view binghe1980/Antigravity-ZH-CN-Patch --json description` 复核确认。

## 2. 安全边界与不可逾越的红线

- **仅作用于本地 UI 显示层**：只修改前端 UI 显示文本与本地原生菜单/弹窗文案。
- **绝不修改核心二进制与业务逻辑**：严禁改动 `language_server` 及 `bin/` 下任何二进制文件，严禁触碰账号认证、OAuth、Token/Cookie、网络通信、请求头、计费配额、功能开关（Feature Flags）或安全沙盒策略逻辑。
- **严防误译正文与代码**：始终保持输入框（`INPUT`/`TEXTAREA`）、Monaco 编辑器、用户消息、AI Markdown 正文（`[data-markdown-root]`）与行内代码（`CODE`/`PRE`/`KBD`/`SAMP`/`VAR`）的物理隔离。
- **macOS 部署前必须告知签名影响**：替换 `app.asar` 前需明确说明会使 Google 原始签名失效及通过 `app.asar.bak` / 官方安装包恢复的方法，获用户确认后再通过独立分离进程备份并部署。
