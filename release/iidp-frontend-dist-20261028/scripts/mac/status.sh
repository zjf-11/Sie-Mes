#!/usr/bin/env bash
# 查看 nginx 运行状态与端口
set -uo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PID_FILE="$DIR/logs/nginx.pid"

if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE" 2>/dev/null)" 2>/dev/null; then
    echo "nginx 运行中 (pid $(cat "$PID_FILE"))"
else
    echo "nginx 未运行"
fi

echo "--- 端口 30666 ---"
lsof -nP -iTCP:30666 -sTCP:LISTEN 2>/dev/null || echo "（无监听）"

echo "--- 前端入口 ---"
curl -s -o /dev/null -w "GET /iidp/          -> %{http_code}\n" http://127.0.0.1:30666/iidp/ 2>/dev/null || echo "无法连接"
curl -s -o /dev/null -w "GET /config/apps.json -> %{http_code}\n" http://127.0.0.1:30666/config/apps.json 2>/dev/null || true
curl -s -o /dev/null -w "GET /api/root/api/master -> %{http_code}\n" http://127.0.0.1:30666/api/root/api/master 2>/dev/null || true

echo "--- 授权服务 8080 ---"
lsof -nP -iTCP:8080 -sTCP:LISTEN 2>/dev/null || echo "（无监听）"
