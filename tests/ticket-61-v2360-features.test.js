'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { readAsarPackageVersion } = require('../asar-version');
const { loadTranslatorSandbox } = require('./helpers/translator-loader');
const { extractChangelogSection } = require('../release-assets/generate-release-assets');
const { dictionary, coreWords } = require('../src/dictionary');
const { CURRENT_VERSION, RELEASE_VERSION } = require('../localize');

const ROOT = path.resolve(__dirname, '..');

console.log('=== 开始 Ticket-61 Antigravity v2.36.0 全量适配与特性专项测试 ===\n');

function createElement(tagName, attributes = {}, children = []) {
  const attrs = { ...attributes };
  const classes = String(attrs.class || '').split(/\s+/).filter(Boolean);
  const node = {
    nodeType: 1,
    tagName: tagName.toUpperCase(),
    className: attrs.class || '',
    classList: { contains: (name) => classes.includes(name) },
    childNodes: children,
    firstChild: children[0] ?? null,
    parentElement: null,
    hasAttribute: (name) => Object.hasOwn(attrs, name),
    getAttribute: (name) => (Object.hasOwn(attrs, name) ? attrs[name] : null),
    setAttribute: (name, value) => { attrs[name] = value; },
    get textContent() {
      return this.childNodes.map((c) => (c.nodeType === 3 ? c.nodeValue : c.textContent)).join('');
    },
    matches: (selectorList) => String(selectorList)
      .split(',')
      .some((sel) => {
        const s = sel.trim();
        if (!s) return false;
        const m = s.match(/^([a-zA-Z0-9_-]+)?\[([^=\]]+)(?:="([^"]*)")?\]$/);
        if (m) {
          const [, tag, attr, val] = m;
          if (tag && node.tagName !== tag.toUpperCase()) return false;
          if (!node.hasAttribute(attr)) return false;
          return val === undefined ? true : node.getAttribute(attr) === val;
        }
        if (s.startsWith('.')) {
          return node.classList.contains(s.slice(1).replace(/\\\//g, '/'));
        }
        return node.tagName === s.toUpperCase();
      }),
    closest: (selectorList) => {
      let cur = node;
      while (cur && cur.nodeType === 1) {
        if (cur.matches(selectorList)) return cur;
        cur = cur.parentElement;
      }
      return null;
    },
  };
  for (const child of children) {
    child.parentElement = node;
  }
  return node;
}

function createText(value) {
  return { nodeType: 3, nodeValue: value, parentElement: null };
}

function readAsarHeader(asarPath) {
  const fd = fs.openSync(asarPath, 'r');
  try {
    const headerPrefix = Buffer.alloc(16);
    fs.readSync(fd, headerPrefix, 0, 16, 0);
    const jsonLen = headerPrefix.readUInt32LE(12);
    const jsonBuf = Buffer.alloc(jsonLen);
    fs.readSync(fd, jsonBuf, 0, jsonLen, 16);
    return JSON.parse(jsonBuf.toString('utf8'));
  } finally {
    fs.closeSync(fd);
  }
}

// 1. 版本元数据与文档同步检查
assert.equal(CURRENT_VERSION, '2.36.0', 'CURRENT_VERSION 应为 2.36.0');
assert.equal(RELEASE_VERSION, '2.36.0', 'RELEASE_VERSION 应为 2.36.0');

const rootPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const extractedPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'extracted', 'package.json'), 'utf8'));
assert.equal(rootPkg.version, '2.36.0', 'package.json version 应为 2.36.0');
assert.equal(extractedPkg.version, '2.36.0', 'extracted/package.json version 应为 2.36.0');

const installMac = fs.readFileSync(path.join(ROOT, 'install_mac.sh'), 'utf8');
assert.match(installMac, /EXPECTED_VERSION="2\.36\.0"/, 'install_mac.sh 预期版本应为 2.36.0');

const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
assert.match(indexHtml, /控制中心\s*v2\.36\.0/, 'index.html 顶部版本号应更新为 v2.36.0');

const changelogZh = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8');
const changelogEn = fs.readFileSync(path.join(ROOT, 'CHANGELOG.en.md'), 'utf8');
assert.equal(extractChangelogSection(changelogZh, '2.36.0').matchedExact, true, 'CHANGELOG.md 必须精确包含 v2.36.0 章节');
assert.equal(extractChangelogSection(changelogEn, '2.36.0').matchedExact, true, 'CHANGELOG.en.md 必须精确包含 v2.36.0 章节');

const readmeZh = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
const readmeEn = fs.readFileSync(path.join(ROOT, 'README.en.md'), 'utf8');
const archZh = fs.readFileSync(path.join(ROOT, 'docs', 'architecture.md'), 'utf8');
const archEn = fs.readFileSync(path.join(ROOT, 'docs', 'architecture.en.md'), 'utf8');
assert.ok(readmeZh.includes('Antigravity v2.36.0'), 'README.md 应标明 v2.36.0');
assert.ok(readmeEn.includes('Antigravity v2.36.0'), 'README.en.md 应标明 v2.36.0');
assert.ok(archZh.includes('v2.36.0'), 'docs/architecture.md 应包含 v2.36.0 打包说明');
assert.ok(archEn.includes('v2.36.0'), 'docs/architecture.en.md 应包含 v2.36.0 打包说明');
console.log('[通过] 1. 全项目版本元数据、README、架构文档与 CHANGELOG 均已同步至 v2.36.0');

// 2. app.asar.ready 轻量解包头与版本验证
const readyPath = path.join(ROOT, 'app.asar.ready');
const readyStat = fs.statSync(readyPath);
assert.equal(readAsarPackageVersion(readyPath), '2.36.0', 'app.asar.ready 内 package.json 必须为 2.36.0');
assert.ok(readyStat.size < 10 * 1024 * 1024, `app.asar.ready 必须保持官方轻量规格 (<10 MiB)，实测 ${readyStat.size}`);
const readyHeader = readAsarHeader(readyPath);
assert.equal(
  Boolean(readyHeader.files?.node_modules?.files?.['chrome-devtools-mcp']?.files?.['package.json']?.unpacked),
  true,
  'app.asar.ready 必须携带 --unpack-dir "**/chrome-devtools-mcp" 解包标记'
);
console.log(`[通过] 2. app.asar.ready (${readyStat.size} bytes) 版本 2.36.0 与官方 chrome-devtools-mcp 解包头完全一致`);

// 3. 词典零重复与 v2.36.0 高频静态词条验证
const dictSrc = fs.readFileSync(path.join(ROOT, 'src', 'dictionary.js'), 'utf8');
const dictBody = dictSrc.match(/const\s+dictionary\s*=\s*\{([\s\S]*?)\n\};/);
assert.ok(dictBody, '无法解析 src/dictionary.js dictionary 对象');
const rawKeys = [];
for (const line of dictBody[1].split('\n')) {
  const m = line.match(/^\s*"((?:\\.|[^"\\])*)"\s*:/);
  if (m) rawKeys.push(JSON.parse('"' + m[1] + '"'));
}
const seenKeys = new Set();
const dupKeys = [];
for (const k of rawKeys) {
  if (seenKeys.has(k)) dupKeys.push(k);
  seenKeys.add(k);
}
assert.equal(dupKeys.length, 0, `src/dictionary.js 存在重复键: ${dupKeys.join(', ')}`);
assert.equal(rawKeys.length, Object.keys(dictionary).length, '解析键数应等于运行时 dictionary 键数');
assert.ok(Object.keys(dictionary).length >= 5232, `词典总量应 >= 5232，当前 ${Object.keys(dictionary).length}`);
assert.ok(Object.keys(coreWords).length >= 122, 'coreWords 不应缩水');

const { translateString, translateNode, tryCombinedSentenceTranslation } = loadTranslatorSandbox();

const staticCases = [
  ['Billing model', '计费模式'],
  ['Available licenses', '可用许可证'],
  ['Organization prepaid wallet is empty', '组织预付费钱包余额已耗尽'],
  ['Enterprise Gateway', '企业网关'],
  [
    'You are logged in using Application Default Credentials (ADC). To log out, undo any changes to ~/.gemini/config/config.json (or unset AGY_ADC_AUTH if launched from terminal) and restart the application.',
    '您当前正在使用应用默认凭据 (ADC) 登录。如需退出登录，请撤销对 ~/.gemini/config/config.json 的更改（或若从终端启动请取消设置 AGY_ADC_AUTH），然后重启应用。',
  ],
  ['Environment variables', '环境变量'],
  ['Network secrets', '网络密钥'],
  ['Feeds', '动态流'],
  ['Get started with Remote Control', '开始使用远程控制'],
  ['Sent as a quiet FYI (delivered on next turn without waking agent)', '已作为静默参考发送（将在下一回合送达，不会唤醒智能体）'],
  ['Fork in New Git Worktree', '在新建 Git Worktree 中分叉'],
  ['Workspace > Restore to Snapshot', '工作区 > 恢复到快照'],
  ['Untrusted sidecar', '未受信任的 Sidecar'],
  ['Allow Next Non-Corp Prompt', '允许下一条非公司提示词'],
  ['Remote Debugging Required', '需要开启远程调试'],
  ['Skipped command', '已跳过命令'],
  ['Google Jetski Terms of Service', 'Google Jetski 服务条款'],
  ['Combined filter clauses share no compatible event type', '组合的筛选子句之间没有兼容的事件类型'],
];
for (const [en, expectedCn] of staticCases) {
  assert.equal(translateString(en), expectedCn, `静态词条翻译失配: ${en}`);
  assert.equal(translateString(expectedCn), expectedCn, `静态词条幂等性失败: ${expectedCn}`);
}
console.log(`[通过] 3. 词典零重复 (${rawKeys.length} 键) 及 v2.36.0 全场景静态词条全部精确命中且幂等`);

// 4. v2.36.0 $-安全动态回调规则及幂等性验证
const dynamicCases = [
  ['Working · 12s', '正在工作 · 12s'],
  ['Resume the conversation to start its workspace again, then start the server on port 3000 and retry.', '请恢复对话以重新启动其工作区，然后在端口 3000 上启动服务并重试。'],
  ['No server is listening on port 8080 inside the remote workspace. Start it, or ask the agent to, then retry.', '远程工作区内端口 8080 上没有正在监听的服务。请启动该服务（或让智能体为您启动），然后重试。'],
  ['The certificate was rejected ($1$&$$ERR).', '证书已被拒绝（$1$&$$ERR）。'],
  ['Help us improve Antigravity.', '帮助我们改进 Antigravity。'],
  ['Help us improve Jetski.', '帮助我们改进 Jetski。'],
  ['5 replies', '5 条回复'],
  ['12+ matches', '12+ 个匹配'],
  ['Thread: $1 Fix & Retry', '话题：$1 Fix & Retry'],
  ['Topic th_204', '主题 th_204'],
  ['Copied link to $&Docs', '已复制链接：$&Docs'],
  ['Copy link to Issue #99', '复制链接：Issue #99'],
  ['Details for Build $1', '详情：Build $1'],
  ['Permission: Allow once', '权限：Allow once'],
  ['Answered: “Use $&staging”', '已回答：“Use $&staging”'],
  ['Running “Nightly $1” now', '正在立即运行“Nightly $1”'],
  ['Run failed: $1 timeout', '运行失败：$1 timeout'],
  ['Automation error: $&502', '自动化错误：$&502'],
  ['Worker spawned from parent conversation.', '工作线程 派生自 父级对话。'],
  ['3 agents are working quietly in the background. Anything that needs your input will show up here.', '3 个智能体正在后台静默运行。任何需要您输入的内容都会显示在这里。'],
  ['· +4 more', '· 还有 +4 项'],
  ['Artifact · +2 more', '工件 · 还有 +2 项'],
  ['Link · +3 more', '链接 · 还有 +3 项'],
  ['Show in Sidebar (3/8)', '在侧边栏中显示 (3/8)'],
  ['4 tools · sign in for more', '4 个工具 · 登录后可使用更多'],
  ['3 tools disabled', '已禁用 3 个工具'],
  ['7 tools', '7 个工具'],
  ['Replace environment variable: API_$1', '替换环境变量：API_$1'],
  ['Add network secret: GH_$&TOKEN', '添加网络密钥：GH_$&TOKEN'],
  [
    'Environment variable "TOKEN" is already used by a Network Secret ("GH_$1") in this scope. Choose a different key or replace the existing credential.',
    '环境变量“TOKEN”在此作用域中已被网络密钥（“GH_$1”）使用。请改用其他键名，或替换现有凭据。',
  ],
  ['Failed to load instances: $1 down', '加载实例失败：$1 down'],
  ['Connect GitHub: Run $&auth', '连接 GitHub：Run $&auth'],
  ['Credentials expire in 3d. Refresh credentials to keep this automation running.', '凭据将在 3 天 后过期。请刷新凭据以保持此自动化任务运行'],
  ['Restarted "mcp-$1".', '已重启“mcp-$1”。'],
  ['Failed to start "mcp-$&".', '启动“mcp-$&”失败。'],
  [
    'Agents created by this automation run in a dedicated workspace with its own permissions. You can change the permissions in the project settings page.',
    '由此自动化任务创建的智能体将在具有独立权限的专用工作区中运行。您可以在项目设置页面中更改权限。',
  ],
  ['Started from “Plan $1”. Show in subagent conversation', '从“Plan $1”发起。在子智能体对话中显示'],
  ['Can\'t access "/Users/foo/$1". macOS privacy settings are blocking Antigravity from this location. Allow Antigravity in System Settings > Privacy & Security > Files and Folders (or Full Disk Access).', '无法访问“/Users/foo/$1”。macOS 隐私设置正在阻止 Antigravity 访问此位置。请在“系统设置 > 隐私与安全性 > 文件与文件夹（或完全磁盘访问权限）”中允许 Antigravity。'],
  ['2 MCP servers failed to start', '2 个 MCP 服务器启动失败'],
  ['Retry loading github configuration', '重试加载 github 配置'],
  ['Account this MCP server uses: dev@example.com', '此 MCP 服务器使用的账户：dev@example.com'],
  ['Auth code for GitHub', 'GitHub 的授权码'],
  ['Configure Slack, values missing', '配置 Slack（缺少必填值）'],
  ['Enable search tool for github', '为 github 启用 search 工具'],
  ['Disable delete_issue tool for github', '为 github 禁用 delete_issue 工具'],
  ['MCP server github requires authentication: sign in to "octocat" in the Accounts section of plugin "GitHub"', 'MCP 服务器 github 需要身份验证：请在插件“GitHub”的“账户”部分登录“octocat”'],
  ['MCP server linear requires authentication', 'MCP 服务器 linear 需要身份验证'],
  ['Install folder "/tmp/$1" is already in use', '安装目录“/tmp/$1”已被占用'],
  ['The Linear MCP server requires configuration parameters before it can be started.', 'Linear MCP 服务器在启动前需要先配置参数。'],
  ['Notion needs you to sign in before it can be used.', 'Notion 需要您先登录才能使用。'],
  ['Fix with Agent: mcp-$1', '使用智能体修复：mcp-$1'],
  ['On top of those defaults, Slack requests the access below.', '除上述默认权限外，Slack 还请求以下访问权限：'],
  ['No plugins found for "$1".', '未找到与“$1”相关的插件。'],
  ['No apps found for "foo".', '未找到与“foo”相关的应用。'],
  ['No MCP servers found for "$&"', '未找到与“$&”相关的 MCP 服务器'],
  ['Search for "$1" in the Marketplace', '在扩展市场中搜索“$1”'],
  ['No connectors match “$1”', '没有匹配“$1”的连接器'],
  ['Signed in: alice@corp.com', '已登录：alice@corp.com'],
  ['Skill installed: tdd-$1', '已安装技能：tdd-$1'],
  ['Plugin installed: mcp-$&', '已安装插件：mcp-$&'],
];
for (const [en, expectedCn] of dynamicCases) {
  const actual = translateString(en);
  assert.equal(actual, expectedCn, `动态规则输出不符合预期:\n  输入: ${en}\n  期望: ${expectedCn}\n  实际: ${actual}`);
  assert.equal(translateString(actual), expectedCn, `动态规则二次翻译非幂等: ${actual}`);
}
console.log(`[通过] 4. ${dynamicCases.length} 组 v2.36.0 $-安全动态回调规则及幂等性全部通过`);

// 5. 多节点 <a> 链接与 React 多 TextNode 句子拼合验证
// 5a. Onboarding 带多子节点 <a> 的条款声明
const jetskiLinkPre = createText('Google ');
const jetskiLinkMid = createText('Jetski');
const jetskiLinkPost = createText(' Terms of Service');
const jetskiAnchor = createElement('a', { href: '#' }, [jetskiLinkPre, jetskiLinkMid, jetskiLinkPost]);
const privacyAnchor = createElement('a', { href: '#' }, [createText('Google Privacy Policy')]);
const termsPre = createText('Allow Google to collect and use your Interactions data, subject to the ');
const termsMid = createText(' and ');
const termsPost = createText('. You can control this from your settings at any point.');
const termsParagraph = createElement('p', {}, [termsPre, jetskiAnchor, termsMid, privacyAnchor, termsPost]);
assert.equal(tryCombinedSentenceTranslation(termsParagraph), true, '多 TextNode <a> 组合句应成功拼合');
assert.equal(
  termsParagraph.textContent,
  '允许 Google 根据《Google Jetski 服务条款》和《Google 隐私权政策》收集并使用您的交互数据。您可随时在设置中调整此选项。'
);
// 二次 translateNode 幂等
translateNode(termsParagraph);
assert.equal(
  termsParagraph.textContent,
  '允许 Google 根据《Google Jetski 服务条款》和《Google 隐私权政策》收集并使用您的交互数据。您可随时在设置中调整此选项。'
);

// 5b. React 2/3/4/6 TextNode 片段测试（保留动态中间节点引用）
const dynProject = createText('my-gcp-$1');
const projRow = createElement('div', {}, [createText('Project ID:'), dynProject]);
translateNode(projRow);
assert.equal(projRow.textContent, '项目 ID：my-gcp-$1');
assert.equal(dynProject.nodeValue, 'my-gcp-$1', '动态项目 ID 节点引用应保持未修改');

const locRow = createElement('div', {}, [createText('Location:'), createText('Global')]);
translateNode(locRow);
assert.equal(locRow.textContent, '位置：全局');

const settingQuery = createText('proxy$1');
const noSettingEl = createElement('div', {}, [createText('No settings match “'), settingQuery, createText('”')]);
translateNode(noSettingEl);
assert.equal(noSettingEl.textContent, '没有匹配“proxy$1”的设置');
assert.equal(settingQuery.nodeValue, 'proxy$1');

const memberCount = createText('4');
const hideNonAdminBtn = createElement('button', {}, [createText('Hide non-admin ('), memberCount, createText(')')]);
translateNode(hideNonAdminBtn);
assert.equal(hideNonAdminBtn.textContent, '隐藏非管理员 (4)');

const hiddenCount = createText('7');
const showHiddenBtn = createElement('button', {}, [createText('Show all ('), hiddenCount, createText(' hidden)')]);
translateNode(showHiddenBtn);
assert.equal(showHiddenBtn.textContent, '显示全部 (7 项已隐藏)');

const msgQuery = createText('hello$');
const noMsgEl = createElement('div', {}, [createText('No messages matching “'), msgQuery, createText('”'), createText(' in loaded messages.')]);
translateNode(noMsgEl);
assert.equal(noMsgEl.textContent, '没有匹配“hello$”的消息（仅限已加载消息）。');

const loadedCount = createText('50');
const searchingEl = createElement('div', {}, [
  createText('Searching '),
  loadedCount,
  createText(' loaded '),
  createText('50'),
  createText(' messages'),
  createText(' — older history available'),
]);
translateNode(searchingEl);
assert.equal(searchingEl.textContent, '正在搜索已加载的 50 条消息 — 还有更早的历史记录');

const appNameAds = createText('Antigravity');
const adsNotice = createElement('span', {}, [
  createText('Customize your experience across the agent, plugins, and product from the settings and marketplace. We won’t show you ads or let advertisers influence what '),
  appNameAds,
  createText(' says.'),
]);
translateNode(adsNotice);
assert.equal(
  adsNotice.textContent,
  '您可以在设置和插件市场中自由定制智能体、插件与产品体验。我们不会向您展示广告，也不会让广告商影响 Antigravity 的输出内容。'
);
console.log('[通过] 5. 多节点 <a> 链接与 2/3/4/6-TextNode React 片段拼合及幂等性验证通过');

// 6. extracted/dist 预加载脚本注入同步校验
const preloadContent = fs.readFileSync(path.join(ROOT, 'extracted', 'dist', 'preload.js'), 'utf8');
const wizardPreloadContent = fs.readFileSync(path.join(ROOT, 'extracted', 'dist', 'ideInstall', 'wizardPreload.js'), 'utf8');
assert.ok(preloadContent.includes('Fork in New Git Worktree'), 'extracted/dist/preload.js 应已同步 v2.36.0 词典');
assert.ok(wizardPreloadContent.includes('Fork in New Git Worktree'), 'extracted/dist/ideInstall/wizardPreload.js 应已同步 v2.36.0 词典');
console.log('[通过] 6. extracted/dist/preload.js 与 wizardPreload.js 已同步最新 v2.36.0 汉化引擎');

console.log('\n🎉 Ticket-61 全部 Antigravity v2.36.0 适配与增强测试通过！');
