#!/usr/bin/env bash
# 停止开发模式授权服务
set -uo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PID_FILE="$DIR/logs/grant-dev.pid"

if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE" 2>/dev/null)" 2>/dev/null; then
    PID="$(cat "$PID_FILE")"
    echo "正在停止授权服务 (pid $PID) ..."
    kill "$PID" 2>/dev/null
    for _ in $(seq 1 20); do
        kill -0 "$PID" 2>/dev/null || break
        sleep 0.2
    done
    kill -9 "$PID" 2>/dev/null || true
    rm -f "$PID_FILE"
    echo "已停止。"
else
    echo "授权服务未在运行。"
    rm -f "$PID_FILE"
    # 兜底：清理遗留进程
    if pgrep -f "grant-dev.mac" >/dev/null 2>&1; then
        pkill -f "grant-dev.mac" && echo "已清理遗留进程。"
    fi
fi
