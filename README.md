![Google Antigravity 桌面客户端深度中文汉化补丁](docs/banner.jpg)

# Antigravity-ZH-CN-Patch

Google Antigravity 桌面客户端深度中文汉化补丁（已适配 **Antigravity v2.35.2+**）。

[![GitHub release](https://img.shields.io/github/v/release/binghe1980/Antigravity-ZH-CN-Patch?style=flat&color=blue)](https://github.com/binghe1980/Antigravity-ZH-CN-Patch/releases/latest)
[![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-blue)](https://github.com/binghe1980/Antigravity-ZH-CN-Patch)
[![Package Size](https://img.shields.io/badge/ASAR%20Size-~7.58%20MiB%20(Official%20Slim)-success)](https://github.com/binghe1980/Antigravity-ZH-CN-Patch/releases)
[![Node Runtime](https://img.shields.io/badge/Node.js-%3E%3D%2018.18.0-informational)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Antigravity-ZH-CN-Patch** 是一款专为 **Google Antigravity** 桌面客户端打造的深度中文汉化补丁，提供开箱即用的预制 `app.asar` 汉化包、跨平台一键安装脚本、本地可视化控制中心及完整的本地动态注入能力。

- **开箱即用，全平台支持**：已精准适配 **Antigravity v2.35.2**，按官方原生轻量规格（约 7.58 MiB）打包，支持 macOS / Windows / Linux 一键安装、可视化控制中心与智能体自动部署。
- **深度覆盖，体验自然**：内置 `4,965` 条零重复中文词条与动态规则，完整覆盖主界面、设置面板、权限沙盒、语音听写、规划模式、`Swarm` 多智能体、智能体错误卡片与原生菜单，并保留模型名等专业术语英文原生。
- **安全无损，随时可还原**：物理级隔离代码编辑器、输入框、AI Markdown 正文与行内代码；安装前严格校验版本与 SHA-256 并自动备份 `app.asar.bak`，防白屏且支持一键无损还原，通过 67/67 组自动化回归测试。
- **纯粹透明，仅限显示层**：严格只作用于前端 UI 文案与本地原生菜单，不修改任何账号认证、网络通信、配额计费或后端服务逻辑。

> [最新 Release 下载](https://github.com/binghe1980/Antigravity-ZH-CN-Patch/releases/latest) · [问题反馈 (Issues)](https://github.com/binghe1980/Antigravity-ZH-CN-Patch/issues) · [致谢上游社区](https://github.com/antigravity-cn-community/Antigravity-Chinese-Localization)

---

## 核心特性

| 维度 | 特性说明 |
| :--- | :--- |
| **精准适配 v2.35.2** | 基于官方原版 `Antigravity v2.35.2` 的 `app.asar` 解包注入并按原生轻量规格（约 7.58 MiB，`--unpack-dir '**/chrome-devtools-mcp'`）重新打包，版本号与原生解包结构完全一致。 |
| **全界面深度覆盖** | 覆盖 `4,965` 条零重复中文词条与动态规则，包含收件箱模式 (`Inbox Mode`)、插件权限管理、多语言语音听写、规划模式、系统设置、权限沙盒、Hooks、Remote SSH、Computer Use、`Swarm` 多智能体与 `plugin://` 子框架，以及全端原生应用菜单/右键菜单/托盘。 |
| **物理级编辑区与正文免疫** | 智能跳过输入框 (`INPUT`/`TEXTAREA`)、富文本编辑区、Monaco 代码编辑器、Diff 视图、AI Markdown 正文 (`[data-markdown-root]`) 与行内代码 (`CODE`/`PRE`/`KBD`/`SAMP`/`VAR`)；仅操作叶子文本节点，不破坏 React Fiber 结构。 |
| **专业术语原生保留** | 模型名称（Gemini 4 / Orchestrator / Claude 等）、思考链过程（Thinking/Thought）及相对时间保持英文原生，避免机翻歧义。 |
| **安全备份与防白屏** | 安装前严格校验本机客户端版本，自动备份纯净官方原版为 `app.asar.bak`，并通过暂存 + SHA-256 校验实现原子替换；全套 **67/67 组 TDD 回归测试** 100% 通过。 |
| **仅限 UI 显示层** | 严格仅作用于前端显示文案与本地原生菜单，**不修改**任何账号认证、网络通信、配额计费、安全校验或后端服务逻辑。 |

---

## 快速安装指南

> **重要提醒**：使用预制 `app.asar` 前，请务必确认你本机的 Antigravity 客户端版本与 Release 版本**完全一致**（当前为 `v2.35.2`）。版本不匹配时请勿强行覆盖，可改用下方的“本地动态注入”模式或等待新版本适配。

### 方式一：智能体一键安全安装（推荐）

如果你的 Antigravity 正在运行，可直接将下方提示词发给当前智能体，让它先校验版本与签名影响，再自动下载备份并后台重启安装：

```text
帮我安装 https://github.com/binghe1980/Antigravity-ZH-CN-Patch 的汉化补丁：请先检查当前操作系统和本机 Antigravity 的实际客户端版本，并在 Releases 查找明确支持该客户端版本的 app.asar；若任一版本无法确认或不完全匹配，请立即停止并告知原因，不要关闭客户端或覆盖文件。如果是 macOS，请先说明替换 app.asar 会使 Google 原始代码签名失效及还原方式，等我明确确认后再继续。确认版本完全匹配后，先为原版 resources/app.asar 创建纯净备份 app.asar.bak，再下载匹配的 app.asar 并编写独立后台脚本（延迟 2 秒、结束 Antigravity 进程、校验后覆盖 resources/app.asar 并自动重启客户端）分离执行。
```

---

### 方式二：macOS 安装

> **macOS 签名说明**：替换 `/Applications/Antigravity.app/Contents/Resources/app.asar` 会使 Google 原始代码签名失效。本项目脚本**默认不执行 `codesign` 重签**，以避免重置钥匙串与系统隐私权限（TCC）。若后续需要完全恢复 Google 原始签名，可将 `app.asar.bak` 还原或直接用官方安装包覆盖安装。

#### 1. 一键脚本安装（推荐）
```bash
git clone https://github.com/binghe1980/Antigravity-ZH-CN-Patch.git
cd Antigravity-ZH-CN-Patch
chmod +x install_mac.sh
./install_mac.sh
```
脚本会自动：
1. 检查本机 Antigravity 是否为 `2.35.2`；
2. 校验本地 `app.asar.ready` 的 SHA-256；
3. 延迟 2 秒后关闭 Antigravity，备份原版到 `/Applications/Antigravity.app/Contents/Resources/app.asar.bak`；
4. 原子覆盖 `app.asar` 并自动重新打开客户端。

#### 2. 使用可视化控制中心 / 更新恢复启动器
```bash
chmod +x 运行汉化.sh 一键更新汉化.command
./运行汉化.sh
```
浏览器将自动打开 `http://127.0.0.1:3388` 本地控制面板，可查看客户端版本状态、在线拉取 Release 或一键还原。

> **macOS 排障（可选）**：如在 Apple Silicon (`arm64`) 机型上遇到系统提示“应用已损坏，无法打开”，请优先尝试清除隔离属性：
> ```bash
> xattr -cr "/Applications/Antigravity.app"
> ```
> 若仍无法启动且你了解本地重签可能重置系统权限的影响，可执行：
> ```bash
> codesign --force --deep --sign - "/Applications/Antigravity.app"
> ```

---

### 方式三：Windows 安装

#### 1. 图形化控制中心 / 一键脚本
1. 前往 [Releases](https://github.com/binghe1980/Antigravity-ZH-CN-Patch/releases/latest) 下载源码包或直接 `git clone` 本仓库到本地文件夹（请完整解压后再运行）；
2. 双击运行 **`双击运行汉化.bat`**：
   - 已安装 Node.js（`>= 18.18.0`）：自动打开浏览器可视化控制中心（`http://127.0.0.1:3388`）；
   - 未安装 Node.js：自动切换至离线安全模式，校验版本后直接使用同目录的 `app.asar.ready` 完成备份与汉化（也支持输入 `R` 离线还原英文原版）。
3. 客户端官方更新后，可双击 **`一键更新汉化.bat`** 快速校验并恢复汉化。

#### 2. 手动替换
1. 从 [Releases](https://github.com/binghe1980/Antigravity-ZH-CN-Patch/releases/latest) 下载对应版本的 `app.asar` 并核对 `SHA256SUMS.txt`；
2. 彻底退出 Antigravity；
3. 打开默认资源目录：`%LOCALAPPDATA%\Programs\antigravity\resources\`；
4. 将原 `app.asar` 备份为 `app.asar.bak`，然后用下载的 `app.asar` 覆盖并重启客户端。

---

### 方式四：Linux 与命令行模式

确保已安装 **Node.js `>= 18.18.0`**，在项目目录执行：

```bash
# 启动可视化控制中心 (http://127.0.0.1:3388)
./运行汉化.sh

# 命令行查看客户端版本与补丁状态
node localize.js --check-status

# 官方更新后自动校验版本并安全恢复汉化（不兼容时自动拦截）
node localize.js --auto-restore

# 基于本机当前官方原版 app.asar 本地解包动态注入并部署
node localize.js --now

# 仅对已解包的 extracted/ 目录注入汉化代码（开发者调试用）
node localize.js --apply-only
```

> **参数白名单**：`localize.js` 仅接受 `--now`、`--auto-restore`、`--check-status`、`--apply-only` 四个参数，传入未知参数将立即报错退出。

---

## 无损还原英文原版

- **macOS**：彻底退出 Antigravity 后执行：
  ```bash
  mv -f "/Applications/Antigravity.app/Contents/Resources/app.asar.bak" "/Applications/Antigravity.app/Contents/Resources/app.asar"
  ```
- **Windows**：在控制中心点击“还原原版”，或退出 Antigravity 后将 `%LOCALAPPDATA%\Programs\antigravity\resources\app.asar.bak` 重命名覆盖回 `app.asar`。
- **通用兜底**：直接重新运行 Google Antigravity 官方安装包覆盖安装，即可 100% 恢复官方原版与原始签名。

---

## 本地测试与二次开发

```bash
# 运行全部 67 组自动化回归测试（含语法检查与 app.asar.ready 完整性验收）
npm test
```

- 词典与 DOM 翻译核心：`src/dictionary.js`、`src/dom-translator.js`、`src/build-injection.js`
- 主进程与原生菜单补丁：`localize.js`
- 预制校验与自动恢复：`auto-restore.js`、`asar-version.js`、`package-installer.js`

---

## 免责声明与致谢

- **致谢**：本项目核心汉化引擎、词典、控制中心与测试套件源自开源社区项目 **[antigravity-cn-community/Antigravity-Chinese-Localization](https://github.com/antigravity-cn-community/Antigravity-Chinese-Localization)**，谨向 `aabbWei` 及所有社区贡献者致谢！
- **声明**：本项目与 Google 官方无任何隶属关系，仅作为开源社区辅助本地化工具提供，仅供学习交流与个人桌面界面中文化使用。补丁不涉及任何付费绕过、账号修改或协议篡改；使用前请做好备份。
- **开源协议**：本项目遵循 [MIT License](LICENSE) 开源，保留上游全部版权与许可声明。
