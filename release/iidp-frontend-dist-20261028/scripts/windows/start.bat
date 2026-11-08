@echo off
chcp 65001 >nul
setlocal

rem Start the frontend (nginx). Reload if it is already running.
rem Usage: double-click this file, or run start.bat from a command prompt.

set "RC=0"
set "ROOT="
for %%I in ("%~dp0..\..") do set "ROOT=%%~fI"

rem nginx cannot open absolute paths that contain non-ASCII characters (error
rem 1113), and 8.3 short names keep the Chinese characters, so a UNC path is
rem mapped to a drive letter instead of being used directly.
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

if not exist "logs" mkdir "logs"
if not exist "temp\client_body" mkdir "temp\client_body"
if not exist "temp\proxy" mkdir "temp\proxy"
if not exist "temp\fastcgi" mkdir "temp\fastcgi"
if not exist "temp\uwsgi" mkdir "temp\uwsgi"
if not exist "temp\scgi" mkdir "temp\scgi"

rem Prefer the nginx bundled with this package, then one from PATH.
rem Do not call this variable NGINX: nginx itself reads an environment variable
rem with that name and fails with "invalid socket number" on every start.
set "NGINX_EXE="
if exist "nginx\nginx.exe" (
    set "NGINX_EXE=nginx\nginx.exe"
) else (
    for %%N in (nginx.exe) do set "NGINX_EXE=%%~$PATH:N"
)

if not defined NGINX_EXE (
    echo ERROR: nginx.exe not found.
    echo   Option 1: put nginx under nginx\nginx.exe in this package.
    echo   Option 2: add the nginx directory to PATH.
    set "RC=1"
    goto :finish
)

echo Using nginx: %NGINX_EXE%
echo Checking configuration ...
rem Always pass a relative prefix ("."): the working directory is the package
rem root, so nginx gets only ASCII paths from the command line.
"%NGINX_EXE%" -p "." -c "%CONF%" -t
if errorlevel 1 (
    echo ERROR: configuration test failed, nothing was started.
    set "RC=1"
    goto :finish
)

rem A pid file alone does not prove nginx is running: the pid may be stale or
rem reused by an unrelated process, so verify it with tasklist.
set "PID="
if exist "logs\nginx.pid" set /p PID=<"logs\nginx.pid"
set "RUNNING="
if defined PID (
    tasklist /FI "IMAGENAME eq nginx.exe" /FI "PID eq %PID%" /NH 2>nul | findstr /I /C:"nginx.exe" >nul
    if not errorlevel 1 set "RUNNING=1"
)

if defined RUNNING (
    echo nginx is already running ^(pid %PID%^), reloading ...
    "%NGINX_EXE%" -p "." -c "%CONF%" -s reload >nul 2>&1
    if not errorlevel 1 (
        echo nginx is running: http://localhost:30666/iidp/
        goto :finish
    )
    echo Reload failed, restarting nginx ...
    taskkill /PID %PID% /T /F >nul 2>&1
    ping -n 2 127.0.0.1 >nul
    del /q "logs\nginx.pid" >nul 2>&1
) else (
    if defined PID del /q "logs\nginx.pid" >nul 2>&1
)

"%NGINX_EXE%" -p "." -c "%CONF%"
if errorlevel 1 goto :start_failed

ping -n 2 127.0.0.1 >nul

rem The launcher can return 0 even when the master has already died (for
rem example when another process owns the port), so verify the pid file.
set "NEWPID="
if exist "logs\nginx.pid" set /p NEWPID=<"logs\nginx.pid"
call :check_started
if not defined STARTED (
    ping -n 2 127.0.0.1 >nul
    set "NEWPID="
    if exist "logs\nginx.pid" set /p NEWPID=<"logs\nginx.pid"
    call :check_started
)
if not defined STARTED goto :start_failed

echo.
echo nginx is running: http://localhost:30666/iidp/
echo Logs: logs\access.log  logs\error.log
goto :finish

:start_failed
if exist "logs\nginx.pid" del /q "logs\nginx.pid" >nul 2>&1
echo.
echo ERROR: nginx failed to start. See logs\error.log
echo.
echo Processes listening on port 30666:
netstat -ano | findstr ":30666" | findstr "LISTENING"
if errorlevel 1 echo   nothing listening
set "RC=1"
goto :finish

:check_started
set "STARTED="
if not defined NEWPID exit /b 0
tasklist /FI "IMAGENAME eq nginx.exe" /FI "PID eq %NEWPID%" /NH 2>nul | findstr /I /C:"nginx.exe" >nul
if not errorlevel 1 set "STARTED=1"
exit /b 0

:finish
if defined PUSHED popd
rem Keep the window open only when this file was double-clicked. A command
rem prompt or a parent batch keeps its own window.
echo "%CMDCMDLINE%" | findstr /I /C:"/c" >nul
if not errorlevel 1 pause
exit /b %RC%
