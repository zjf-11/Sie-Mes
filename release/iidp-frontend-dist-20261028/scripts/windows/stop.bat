@echo off
chcp 65001 >nul
setlocal

rem Stop the frontend (nginx). Safe to run when nginx is not running.

set "RC=0"
set "ROOT="
for %%I in ("%~dp0..\..") do set "ROOT=%%~fI"

if "%ROOT:~0,2%"=="\\" (
    echo ERROR: the package is on a UNC path:
    echo   "%ROOT%"
    echo Map it to a drive letter first, then run the script from that drive:
    echo   net use Z: "\\server\share"
    set "RC=1"
    goto :finish
)

set "PUSHED="
pushd "%ROOT%" 2>nul && set "PUSHED=1"
if not defined PUSHED (
    echo ERROR: cannot enter directory "%ROOT%"
    set "RC=1"
    goto :finish
)

set "CONF=nginx\conf\nginx.conf"
set "NGINX_EXE="
if exist "nginx\nginx.exe" (
    set "NGINX_EXE=nginx\nginx.exe"
) else (
    for %%N in (nginx.exe) do set "NGINX_EXE=%%~$PATH:N"
)

rem A pid file alone does not prove nginx is running: verify the pid.
set "PID="
if exist "logs\nginx.pid" set /p PID=<"logs\nginx.pid"
set "RUNNING="
if defined PID (
    tasklist /FI "IMAGENAME eq nginx.exe" /FI "PID eq %PID%" /NH 2>nul | findstr /I /C:"nginx.exe" >nul
    if not errorlevel 1 set "RUNNING=1"
)

if not defined RUNNING (
    if exist "logs\nginx.pid" del /q "logs\nginx.pid" >nul 2>&1
    echo nginx is not running.
    goto :finish
)

echo Stopping nginx ^(pid %PID%^) ...
rem -s quit must use the same prefix as the start command, otherwise nginx
rem looks for logs\nginx.pid under its install directory and fails.
if defined NGINX_EXE (
    "%NGINX_EXE%" -p "." -c "%CONF%" -s quit >nul 2>&1
    ping -n 3 127.0.0.1 >nul
)

rem A missing nginx.exe is not fatal: kill the process by the pid we validated.
tasklist /FI "IMAGENAME eq nginx.exe" /FI "PID eq %PID%" /NH 2>nul | findstr /I /C:"nginx.exe" >nul
if not errorlevel 1 (
    echo Graceful stop timed out, terminating pid %PID% ...
    taskkill /PID %PID% /T /F >nul 2>&1
    ping -n 2 127.0.0.1 >nul
)

tasklist /FI "IMAGENAME eq nginx.exe" /FI "PID eq %PID%" /NH 2>nul | findstr /I /C:"nginx.exe" >nul
if not errorlevel 1 (
    echo ERROR: nginx is still running ^(pid %PID%^).
    echo Stop it manually: taskkill /PID %PID% /T /F
    set "RC=1"
    goto :finish
)

del /q "logs\nginx.pid" >nul 2>&1
echo nginx stopped.
goto :finish

:finish
if defined PUSHED popd
echo "%CMDCMDLINE%" | findstr /I /C:"/c" >nul
if not errorlevel 1 pause
exit /b %RC%
