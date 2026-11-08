@echo off
chcp 65001 >nul
setlocal

rem 停止开发模式授权服务

echo 正在停止授权服务 ...
taskkill /F /IM grant-dev.exe >nul 2>&1
if errorlevel 1 (
    echo 授权服务未在运行。
) else (
    echo 已停止。
)
pause
