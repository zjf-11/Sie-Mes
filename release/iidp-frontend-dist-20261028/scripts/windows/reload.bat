@echo off
chcp 65001 >nul
setlocal

rem Reload the nginx configuration without dropping connections.

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

if not defined NGINX_EXE (
    echo ERROR: nginx.exe not found.
    set "RC=1"
    goto :finish
)

set "PID="
if exist "logs\nginx.pid" set /p PID=<"logs\nginx.pid"
set "RUNNING="
if defined PID (
    tasklist /FI "IMAGENAME eq nginx.exe" /FI "PID eq %PID%" /NH 2>nul | findstr /I /C:"nginx.exe" >nul
    if not errorlevel 1 set "RUNNING=1"
)

if not defined RUNNING (
    if exist "logs\nginx.pid" del /q "logs\nginx.pid" >nul 2>&1
    echo nginx is not running. Run start.bat first.
    set "RC=1"
    goto :finish
)

rem Test first: a broken configuration must not take the running site down.
echo Checking configuration ...
"%NGINX_EXE%" -p "." -c "%CONF%" -t
if errorlevel 1 (
    echo ERROR: configuration test failed. The running configuration is unchanged.
    set "RC=1"
    goto :finish
)

"%NGINX_EXE%" -p "." -c "%CONF%" -s reload
if errorlevel 1 (
    echo ERROR: reload failed. See logs\error.log
    set "RC=1"
    goto :finish
)

echo Configuration reloaded ^(pid %PID%^)
goto :finish

:finish
if defined PUSHED popd
echo "%CMDCMDLINE%" | findstr /I /C:"/c" >nul
if not errorlevel 1 pause
exit /b %RC%
