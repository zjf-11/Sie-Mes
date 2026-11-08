#!/usr/bin/env bash
# 重新加载 nginx 配置（不中断连接）
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

if [ ! -f "$PID_FILE" ] || ! kill -0 "$(cat "$PID_FILE" 2>/dev/null)" 2>/dev/null; then
    echo "nginx 未在运行，请先执行 ./start.sh"
    exit 1
fi

"$NGINX" -p "$DIR" -c "$CONF" -t && "$NGINX" -p "$DIR" -c "$CONF" -s reload && echo "配置已重新加载。"
