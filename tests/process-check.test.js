'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { isAppRunningStrict, stopAntigravityProcesses } = require('../process-check');
const { buildCleanAppLaunchEnv } = require('../localize');

test('Windows process detection matches image names and propagates tasklist failures', () => {
  assert.equal(isAppRunningStrict({ platform: 'win32', run: () => '"Antigravity.exe","12"\r\n' }), true);
  assert.equal(isAppRunningStrict({ platform: 'win32', run: () => '"LANGUAGE_SERVER.EXE","13"\r\n' }), true);
  assert.equal(isAppRunningStrict({ platform: 'win32', run: () => '"node.exe","12","Antigravity.exe"\r\n' }), false);
  assert.throws(() => isAppRunningStrict({ platform: 'win32', run: () => 'unavailable' }), /进程列表/);
  const denied = new Error('tasklist failed');
  assert.throws(() => isAppRunningStrict({ platform: 'win32', run: () => { throw denied; } }), error => error === denied);
});

test('pgrep no-match is idle but other errors cannot permit installation', () => {
  assert.equal(isAppRunningStrict({ platform: 'linux', run: () => '' }), true);
  assert.equal(isAppRunningStrict({ platform: 'linux', run: () => { throw Object.assign(new Error('no match'), { status: 1 }); } }), false);
  const denied = Object.assign(new Error('permission denied'), { status: 2 });
  assert.throws(() => isAppRunningStrict({ platform: 'darwin', run: () => { throw denied; } }), error => error === denied);
});

test('Windows stopAntigravityProcesses terminates full process trees with /T and ignores 128', () => {
  const calls = [];
  stopAntigravityProcesses({
    platform: 'win32',
    run: (cmd, args) => {
      calls.push([cmd, args]);
      if (args.includes('language_server.exe')) {
        throw Object.assign(new Error('not found'), { status: 128 });
      }
    }
  });
  assert.deepEqual(calls, [
    ['taskkill.exe', ['/F', '/T', '/IM', 'Antigravity.exe']],
    ['taskkill.exe', ['/F', '/T', '/IM', 'language_server.exe']]
  ]);
});

test('buildCleanAppLaunchEnv strips ELECTRON_RUN_AS_NODE and ELECTRON_NO_ASAR case-insensitively', () => {
  const cleaned = buildCleanAppLaunchEnv({
    PATH: 'C:\\Windows\\System32',
    ELECTRON_RUN_AS_NODE: '1',
    electron_run_as_node: '1',
    Electron_No_Asar: 'true',
    LOCALAPPDATA: 'C:\\Users\\demo\\AppData\\Local'
  });
  assert.equal(cleaned.PATH, 'C:\\Windows\\System32');
  assert.equal(cleaned.LOCALAPPDATA, 'C:\\Users\\demo\\AppData\\Local');
  assert.equal('ELECTRON_RUN_AS_NODE' in cleaned, false);
  assert.equal('electron_run_as_node' in cleaned, false);
  assert.equal('Electron_No_Asar' in cleaned, false);
});

test('Windows batch updater enforces CRLF, /T tree kill, process wait, Unblock-File, and clean launch env', () => {
  const batPath = path.resolve(__dirname, '..', '一键更新汉化.bat');
  const buf = fs.readFileSync(batPath);
  let bareLf = 0;
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] === 0x0a && (i === 0 || buf[i - 1] !== 0x0d)) bareLf++;
  }
  assert.equal(bareLf, 0, '一键更新汉化.bat must maintain strict CRLF');
  const text = buf.toString('utf8');
  assert.ok(text.includes('taskkill /F /T /IM Antigravity.exe'));
  assert.ok(text.includes('taskkill /F /T /IM language_server.exe'));
  assert.ok(text.includes('Wait-AntigravityProcessesStopped'));
  assert.ok(text.includes('Unblock-File'));
  assert.ok(text.includes('Clear-StaleCodeCache'));
  assert.ok(text.includes('set "ELECTRON_RUN_AS_NODE="'));
  assert.ok(text.includes('set "ELECTRON_NO_ASAR="'));
});

test('app.asar.ready unpacks chrome-devtools-mcp root metadata matching official ASAR spec', () => {
  const readyPath = path.resolve(__dirname, '..', 'app.asar.ready');
  const buf = fs.readFileSync(readyPath);
  const jsonSize = buf.readInt32LE(12);
  const tree = JSON.parse(buf.subarray(16, 16 + jsonSize).toString('utf8'));
  const mcpFiles = tree.files.node_modules.files['chrome-devtools-mcp'].files;
  assert.equal(Boolean(mcpFiles['package.json'].unpacked), true);
  assert.equal(Boolean(mcpFiles.LICENSE.unpacked), true);
});
