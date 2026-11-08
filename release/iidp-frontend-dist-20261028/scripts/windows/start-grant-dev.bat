@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

rem 启动开发模式授权服务（免数据库、永久授权、全部放行），监听 8080

set "ROOT=%~dp0..\.."
pushd "%ROOT%" || exit /b 1

set "BIN=grant\grant-dev.exe"
set "LOG=logs\grant-dev.log"

if not exist "logs" mkdir "logs"

if not exist "%BIN%" (
    echo 错误：未找到 %BIN%
    popd
    pause
    exit /b 1
)

rem 已运行？
tasklist /FI "IMAGENAME eq grant-dev.exe" 2>nul | find /I "grant-dev.exe" >nul
if not errorlevel 1 (
    echo 授权服务已在运行。
    popd
    pause
    exit /b 0
)

rem 端口占用检查
netstat -ano | findstr ":8080" | findstr "LISTENING" >nul
if not errorlevel 1 (
    echo 错误：8080 端口已被占用，请先停止占用进程。
    netstat -ano ^| findstr ":8080" ^| findstr "LISTENING"
    popd
    pause
    exit /b 1
)

echo 正在启动授权服务(开发模式) ...
rem 可执行文件名含 dev，程序自动进入开发模式
start "iidp-grant-dev" /min cmd /c ""%BIN%" > "%LOG%" 2>&1"

timeout /t 3 >nul
tasklist /FI "IMAGENAME eq grant-dev.exe" 2>nul | find /I "grant-dev.exe" >nul
if errorlevel 1 (
    echo 启动失败，日志：%LOG%
    type "%LOG%" 2>nul
    popd
    pause
    exit /b 1
)

echo 授权服务(开发模式)已启动：http://localhost:8080
echo 日志：%LOG%
echo 自检：浏览器访问 http://127.0.0.1:8080/api/v1/app/expired
popd
pause
