#!/usr/bin/env bash
# 启动前端（nginx）。已在运行则执行 reload。
# 用法：./start.sh
set -uo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CONF="$DIR/nginx/conf/nginx.conf"
PID_FILE="$DIR/logs/nginx.pid"

mkdir -p "$DIR/logs" "$DIR/temp/client_body" "$DIR/temp/proxy" "$DIR/temp/fastcgi" "$DIR/temp/uwsgi" "$DIR/temp/scgi"

# 优先使用包内 nginx（nginx/sbin/nginx），否则用 PATH 里的
if [ -x "$DIR/nginx/sbin/nginx" ]; then
    NGINX="$DIR/nginx/sbin/nginx"
elif command -v nginx >/dev/null 2>&1; then
    NGINX="$(command -v nginx)"
else
    echo "错误：未找到 nginx。"
    echo "  方式一：把 nginx 可执行文件放到 $DIR/nginx/sbin/nginx"
    echo "  方式二：macOS 执行 brew install nginx"
    exit 1
fi

echo "使用 nginx: $NGINX"

# 配置语法检查
if ! "$NGINX" -p "$DIR" -c "$CONF" -t; then
    echo "配置检查失败，未启动。"
    exit 1
fi

# 已在运行 -> reload
if [ -f "$PID_FILE" ]; then
    OLD_PID="$(cat "$PID_FILE" 2>/dev/null || true)"
    if [ -n "${OLD_PID:-}" ] && kill -0 "$OLD_PID" 2>/dev/null; then
        echo "nginx 已在运行 (pid $OLD_PID)，执行 reload ..."
        "$NGINX" -p "$DIR" -c "$CONF" -s reload
        exit $?
    fi
    rm -f "$PID_FILE"
fi

"$NGINX" -p "$DIR" -c "$CONF"
RC=$?
if [ $RC -eq 0 ]; then
    sleep 1
    echo "nginx 已启动：http://localhost:30666/iidp/"
    echo "日志：$DIR/logs/access.log  $DIR/logs/error.log"
else
    echo "启动失败，请查看 $DIR/logs/error.log"
fi
exit $RC
