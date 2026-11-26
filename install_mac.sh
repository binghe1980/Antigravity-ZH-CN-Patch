#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
PATCH_ASAR="${1:-${SCRIPT_DIR}/app.asar.ready}"
EXPECTED_VERSION="2.35.2"
APP_BUNDLE="${ANTIGRAVITY_APP:-/Applications/Antigravity.app}"
RESOURCES_DIR="${APP_BUNDLE}/Contents/Resources"
TARGET_ASAR="${RESOURCES_DIR}/app.asar"
BACKUP_ASAR="${RESOURCES_DIR}/app.asar.bak"
STAGE_ASAR="${RESOURCES_DIR}/.app.asar.patch.$$"

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

if [ ! -d "${APP_BUNDLE}" ] || [ ! -f "${TARGET_ASAR}" ]; then
  log "错误：未找到 Antigravity 客户端 (${TARGET_ASAR})。如安装在其他位置，可通过环境变量 ANTIGRAVITY_APP 指定路径。"
  exit 1
fi

CURRENT_VER="$(defaults read "${APP_BUNDLE}/Contents/Info.plist" CFBundleShortVersionString 2>/dev/null || true)"
if [ "${CURRENT_VER}" != "${EXPECTED_VERSION}" ]; then
  log "错误：客户端版本不匹配！当前本机版本为 '${CURRENT_VER:-未知}'，本脚本仅适配 '${EXPECTED_VERSION}'，已安全中止以避免白屏。"
  exit 2
fi

if [ ! -f "${PATCH_ASAR}" ]; then
  log "错误：未找到补丁文件 ${PATCH_ASAR}。请确认目录中存在 app.asar.ready，或通过参数传入 app.asar 路径。"
  exit 1
fi

PATCH_SHA256="$(shasum -a 256 "${PATCH_ASAR}" | awk '{print $1}')"
log "已校验补丁文件：${PATCH_ASAR} (SHA-256: ${PATCH_SHA256})"
log "将在 2 秒后关闭 Antigravity 客户端并应用 v${EXPECTED_VERSION} 汉化补丁..."
sleep 2

log "正在结束运行中的 Antigravity 进程..."
pkill -9 -f "^${APP_BUNDLE}/" 2>/dev/null || true
killall -9 "Antigravity" 2>/dev/null || true

for _ in 1 2 3 4 5 6; do
  if ! pgrep -f "^${APP_BUNDLE}/" >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

if [ ! -f "${BACKUP_ASAR}" ]; then
  log "正在备份官方原版 app.asar 至 ${BACKUP_ASAR}..."
  cp -p "${TARGET_ASAR}" "${BACKUP_ASAR}"
else
  log "检测到已有原版备份 ${BACKUP_ASAR}，保留原备份不覆盖。"
fi

log "正在写入并校验汉化版 app.asar..."
cp -f "${PATCH_ASAR}" "${STAGE_ASAR}"
STAGE_SHA256="$(shasum -a 256 "${STAGE_ASAR}" | awk '{print $1}')"
if [ "${STAGE_SHA256}" != "${PATCH_SHA256}" ]; then
  rm -f "${STAGE_ASAR}"
  log "错误：暂存文件 SHA-256 校验不一致，已中止替换。"
  exit 1
fi

mv -f "${STAGE_ASAR}" "${TARGET_ASAR}"
log "汉化补丁已成功写入 ${TARGET_ASAR}。"

log "正在重新启动 ${APP_BUNDLE}..."
open -a "${APP_BUNDLE}"
log "完成！如需还原英文原版，退出客户端后将 app.asar.bak 重命名为 app.asar 即可。"
