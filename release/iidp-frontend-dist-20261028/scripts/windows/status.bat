@echo off
chcp 65001 >nul
setlocal

rem Show nginx status and the ports used by this package.

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

set "PID="
if exist "logs\nginx.pid" set /p PID=<"logs\nginx.pid"
set "RUNNING="
if defined PID (
    tasklist /FI "IMAGENAME eq nginx.exe" /FI "PID eq %PID%" /NH 2>nul | findstr /I /C:"nginx.exe" >nul
    if not errorlevel 1 set "RUNNING=1"
)

if defined RUNNING (
    echo nginx: running, pid %PID%
) else (
    echo nginx: not running
)

rem A missing dist\index.html shows up as 403/404, not as a start failure.
if exist "dist\index.html" (
    echo dist: dist\index.html found
) else (
    echo dist: WARNING - dist\index.html is missing ^(the site will return 403/404^)
)

echo.
call :port 30666 nginx
call :port 8061 backend
call :port 8080 grant
echo.
echo URL: http://localhost:30666/iidp/
goto :finish

:port
set "PORT=%~1"
set "LABEL=%~2"
netstat -ano | findstr ":%PORT%" | findstr "LISTENING" >nul
if errorlevel 1 (
    echo port %PORT% ^(%LABEL%^): nothing listening
) else (
    echo port %PORT% ^(%LABEL%^): listening
)
exit /b 0

:finish
if defined PUSHED popd
echo "%CMDCMDLINE%" | findstr /I /C:"/c" >nul
if not errorlevel 1 pause
exit /b %RC%
