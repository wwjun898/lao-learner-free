@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% equ 0 (
  echo Starting Lao Learner...
  call npm run dev -- --host 127.0.0.1 --open /lao-learner/
  goto :end
)

set "BUNDLED_NODE=C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
set "BUNDLED_PNPM=C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd"

if not exist "%BUNDLED_NODE%\node.exe" (
  echo Node.js was not found. Install Node.js LTS, then run this file again.
  pause
  exit /b 1
)

set "PATH=%BUNDLED_NODE%;%PATH%"
echo Starting Lao Learner...
call "%BUNDLED_PNPM%" run dev -- --host 127.0.0.1 --open /lao-learner/

:end
if errorlevel 1 pause
