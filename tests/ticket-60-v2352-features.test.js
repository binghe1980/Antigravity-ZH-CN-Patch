'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { readAsarPackageVersion } = require('../asar-version');
const { loadTranslatorSandbox, compareSemver } = require('./helpers/translator-loader');
const { extractChangelogSection } = require('../release-assets/generate-release-assets');

console.log('=== 开始 Ticket-60 Antigravity 2.35.2 官方版本适配与 Web UI 补漏专项测试 ===\n');

const ROOT = path.resolve(__dirname, '..');
let passed = 0;
let total = 0;

function check(desc, actual, expected) {
  total++;
  try {
    assert.deepStrictEqual(actual, expected);
    console.log(`PASS [${total}]: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`FAIL [${total}]: ${desc}`);
    console.error('   期望:', expected);
    console.error('   实际:', actual);
  }
}

// -----------------------------------------------------------------------------
// 1. v2.35.2 版本号、安装脚本、文档与产物元数据一致性校验
// -----------------------------------------------------------------------------
console.log('--- 1. v2.35.2 版本号与产物元数据校验 ---');
const localizeSource = fs.readFileSync(path.join(ROOT, 'localize.js'), 'utf-8');
const rootPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
const extractedPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'extracted', 'package.json'), 'utf-8'));
const installMacSource = fs.readFileSync(path.join(ROOT, 'install_mac.sh'), 'utf-8');
const indexSource = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf-8');
const readmeZh = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf-8');
const readmeEn = fs.readFileSync(path.join(ROOT, 'README.en.md'), 'utf-8');
const archZh = fs.readFileSync(path.join(ROOT, 'docs', 'architecture.md'), 'utf-8');
const archEn = fs.readFileSync(path.join(ROOT, 'docs', 'architecture.en.md'), 'utf-8');
const changelogZh = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf-8');
const changelogEn = fs.readFileSync(path.join(ROOT, 'CHANGELOG.en.md'), 'utf-8');
const readyAsarPath = path.join(ROOT, 'app.asar.ready');

const curVerMatch = localizeSource.match(/const CURRENT_VERSION = ['"]([^'"]+)['"];/);
const relVerMatch = localizeSource.match(/const RELEASE_VERSION = ['"]([^'"]+)['"];/);
const macVerMatch = installMacSource.match(/EXPECTED_VERSION="([^"]+)"/);

check('localize.js CURRENT_VERSION >= 2.35.2', Boolean(curVerMatch && compareSemver(curVerMatch[1], '2.35.2') >= 0), true);
check('localize.js RELEASE_VERSION >= 2.35.2', Boolean(relVerMatch && compareSemver(relVerMatch[1], '2.35.2') >= 0), true);
check('package.json version >= 2.35.2', compareSemver(rootPkg.version, '2.35.2') >= 0, true);
check('extracted/package.json version >= 2.35.2', compareSemver(extractedPkg.version, '2.35.2') >= 0, true);
check('app.asar.ready package.json version >= 2.35.2', compareSemver(readAsarPackageVersion(readyAsarPath), '2.35.2') >= 0, true);
check('install_mac.sh EXPECTED_VERSION 与 CURRENT_VERSION 一致', Boolean(macVerMatch && curVerMatch && macVerMatch[1] === curVerMatch[1]), true);
check('index.html 控制中心显示 v2.35.2+', /控制中心 v2\.(35\.[2-9]|3[6-9]\.|[4-9]\d\.)/.test(indexSource), true);
check('README.md 与 README.en.md 标注 v2.35.2+', /v2\.(35\.[2-9]|3[6-9]\.|[4-9]\d\.)/.test(readmeZh) && /v2\.(35\.[2-9]|3[6-9]\.|[4-9]\d\.)/.test(readmeEn), true);
check('docs/architecture(.en).md 同步 v2.35.2', archZh.includes('2.35.2') && archEn.includes('2.35.2'), true);
check('CHANGELOG.md 与 CHANGELOG.en.md 包含 v2.35.2 章节', changelogZh.includes('## v2.35.2 (2026-11-26)') && changelogEn.includes('## v2.35.2 (2026-11-26)'), true);
check('extractChangelogSection 精确提取 v2.35.2 章节', extractChangelogSection(changelogZh, '2.35.2').matchedExact, true);

// -----------------------------------------------------------------------------
// 2. Web UI v2.35.2 新增静态词条校验
// -----------------------------------------------------------------------------
console.log('\n--- 2. Web UI v2.35.2 新增静态词条校验 ---');
const { translateString } = loadTranslatorSandbox();

const staticChecks = [
  ['This chat is archived.', '此对话已归档。'],
  ['Go to Home', '返回首页'],
  ['Importing shared conversation...', '正在导入共享对话...'],
  ['Drag to move', '拖动以移动'],
  ['Click to Open Docs', '点击打开文档'],
  ['Close (Escape)', '关闭 (Esc)'],
  ['View plans', '查看套餐'],
  ['Full Logs', '完整日志'],
  ["Couldn't search files", '无法搜索文件'],
  ["Couldn't switch accounts:", '无法切换账户：'],
  ['Sign-in failed:', '登录失败：'],
  ['Paste the code shown after you sign in.', '粘贴登录后显示的授权码。'],
  ['Creating projects for your conversations', '正在为您的对话创建项目'],
  ['This link wants to open an app on your device.', '此链接请求在您的设备上打开一个应用。'],
  ['Open Source Code', '打开源代码'],
  ['Suggested plugin:', '推荐插件：'],
  ['Privacy Notice', '隐私声明'],
  ["Here's how you and your agents work together", '了解您与智能体的协作方式'],
  ['Could not load the app view:', '无法加载应用视图：'],
  ['Unable to resolve audio source URL', '无法解析音频源 URL'],
  ['Unable to load PDF:', '无法加载 PDF：'],
  ['Select text in the artifact to add a comment', '在工件中选中文本以添加评论'],
  [
    'Artifacts like Google Docs, PDFs, Office documents (Word, Excel, PowerPoint), etc. Everything else the agent creates is under Artifacts.',
    '例如 Google 文档、PDF、Office 文档（Word、Excel、PowerPoint）等文档类工件；智能体创建的其他所有文件均位于“工件”中。',
  ],
  ['Error while editing notebook', '编辑 Notebook 时出错'],
  ['Error while reading notebook', '读取 Notebook 时出错'],
  ['Failed to send command input', '发送命令输入失败'],
  ['Failed to approve browser interaction', '批准浏览器交互失败'],
  ['Failed to reject browser interaction', '拒绝浏览器交互失败'],
  ['Fetched network request for page.', '已获取页面网络请求。'],
  ['Fetched network requests for page.', '已获取页面网络请求。'],
  ['A snapshot was saved before running. To restore your previous output:', '运行前已保存快照。如需恢复之前的输出：'],
  ['Document Answers', '文档回答'],
  ['Image Answers', '图片回答'],
  ['Some non-image binary content was truncated.', '部分非图片二进制内容已被截断。'],
  ['Grant repository access', '授予仓库访问权限'],
  [
    "This page is blocked in the built-in browser by your organization's Context-Aware Access policy.",
    '根据您组织的上下文感知访问 (Context-Aware Access) 策略，此页面已在内置浏览器中被拦截。',
  ],
  ['No compatible devices found.', '未找到兼容设备。'],
  [
    'Sign in to an app once and your agent can use it on any device. Open an app to see the account it uses or to disconnect it.',
    '只需登录应用一次，您的智能体即可在任意设备上使用。打开应用可查看其使用的账户或断开连接。',
  ],
  ['Boolean AND, OR, and negation', '布尔与 (AND)、或 (OR) 及非运算'],
  ['Sidecar feature is not available.', 'Sidecar 功能不可用。'],
];

for (const [src, expected] of staticChecks) {
  check(`静态词条 "${src.slice(0, 48)}"`, translateString(src), expected);
}

// -----------------------------------------------------------------------------
// 3. Web UI v2.35.2 动态错误前缀规则与 $-安全校验
// -----------------------------------------------------------------------------
console.log('\n--- 3. Web UI v2.35.2 动态规则与幂等校验 ---');
const dynamicChecks = [
  ['Sign-in failed: OAuth token $& expired', '登录失败：OAuth token $& expired'],
  ["Couldn't switch accounts: session $1 invalid", '无法切换账户：session $1 invalid'],
  ['Could not load the app view: ECONNREFUSED 127.0.0.1', '无法加载应用视图：ECONNREFUSED 127.0.0.1'],
  ['Unable to load PDF: Invalid PDF structure', '无法加载 PDF：Invalid PDF structure'],
];

for (const [src, expected] of dynamicChecks) {
  const actual = translateString(src);
  check(`动态规则 "${src.slice(0, 52)}"`, actual, expected);
  check(`动态规则幂等 "${src.slice(0, 40)}"`, translateString(actual), expected);
}

// -----------------------------------------------------------------------------
// 4. 实装产物 preload.js 与 wizardPreload.js 校验
// -----------------------------------------------------------------------------
console.log('\n--- 4. 实装产物 preload.js 与 wizardPreload.js 校验 ---');
const distDir = path.join(ROOT, 'extracted', 'dist');
const preloadJs = fs.readFileSync(path.join(distDir, 'preload.js'), 'utf-8');
const wizardPreloadJs = fs.readFileSync(path.join(distDir, 'ideInstall', 'wizardPreload.js'), 'utf-8');
check(
  'extracted preload.js 与 wizardPreload.js 已实装 v2.35.2 新增词条与动态规则',
  preloadJs.includes('此对话已归档。') &&
    preloadJs.includes('无法加载应用视图：') &&
    preloadJs.includes('了解您与智能体的协作方式') &&
    wizardPreloadJs.includes('此对话已归档。') &&
    wizardPreloadJs.includes('无法加载 PDF：'),
  true
);

console.log(`\n========== 测试完成: ${passed}/${total} 全部通过 ==========`);
if (passed !== total) {
  process.exit(1);
}
