#!/usr/bin/env bash
# 启动开发模式授权服务（免数据库、永久授权、全部放行），监听 8080
set -uo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BIN="$DIR/grant/grant-dev.mac"
PID_FILE="$DIR/logs/grant-dev.pid"
LOG_FILE="$DIR/logs/grant-dev.log"

mkdir -p "$DIR/logs"

if [ ! -f "$BIN" ]; then
    echo "错误：未找到 $BIN"
    exit 1
fi
chmod +x "$BIN" 2>/dev/null

# 已在本包启动过
if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE" 2>/dev/null)" 2>/dev/null; then
    echo "授权服务已在运行 (pid $(cat "$PID_FILE"))"
    exit 0
fi

# 端口被其他进程占用
if lsof -nP -iTCP:8080 -sTCP:LISTEN >/dev/null 2>&1; then
    echo "错误：8080 端口已被占用："
    lsof -nP -iTCP:8080 -sTCP:LISTEN | awk 'NR==2{print "  "$1" (pid "$2")"}'
    echo "请先停止占用进程，或修改脚本中的端口。"
    exit 1
fi

# 可执行文件名含 dev，程序会自动进入开发模式
nohup "$BIN" > "$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"
sleep 2

if kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    echo "授权服务(开发模式)已启动：http://localhost:8080"
    echo "日志：$LOG_FILE"
    echo "自检：curl http://127.0.0.1:8080/api/v1/app/expired"
else
    echo "启动失败，日志："
    tail -20 "$LOG_FILE"
    rm -f "$PID_FILE"
    exit 1
fi
