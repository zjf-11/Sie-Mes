#!/usr/bin/env bash
# 停止前端（nginx）
set -uo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CONF="$DIR/nginx/conf/nginx.conf"
PID_FILE="$DIR/logs/nginx.pid"

if [ -x "$DIR/nginx/sbin/nginx" ]; then
    NGINX="$DIR/nginx/sbin/nginx"
elif command -v nginx >/dev/null 2>&1; then
    NGINX="$(command -v nginx)"
else
    echo "错误：未找到 nginx。"
    exit 1
fi

if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE" 2>/dev/null)" 2>/dev/null; then
    echo "正在停止 nginx (pid $(cat "$PID_FILE")) ..."
    "$NGINX" -p "$DIR" -c "$CONF" -s quit
    for _ in $(seq 1 30); do
        kill -0 "$(cat "$PID_FILE" 2>/dev/null || echo 0)" 2>/dev/null || break
        sleep 0.2
    done
    rm -f "$PID_FILE"
    echo "已停止。"
else
    echo "nginx 未在运行。"
    rm -f "$PID_FILE"
fi
