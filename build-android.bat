@echo off
setlocal
cd /d "%~dp0"

set "JAVA_HOME=%CD%\_android-tools\jdk\jdk-21.0.12+8"
set "ANDROID_HOME=%CD%\_android-tools\sdk"
set "ANDROID_SDK_ROOT=%ANDROID_HOME%"
set "NODE_HOME=C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
set "PNPM=C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%NODE_HOME%;%PATH%"

if not exist "%JAVA_HOME%\bin\java.exe" (
  echo Android JDK was not found in _android-tools.
  exit /b 1
)

if not exist "%PNPM%" (
  echo pnpm was not found. Install Node.js and pnpm before rebuilding.
  exit /b 1
)

echo [1/3] Building mobile web assets...
call "%PNPM%" run build:android:web
if errorlevel 1 goto :failed

echo [2/3] Syncing Android project...
call "%PNPM%" exec cap sync android
if errorlevel 1 goto :failed

echo [3/3] Building APK...
call android\gradlew.bat -p android assembleDebug
if errorlevel 1 goto :failed

copy /y "android\app\build\outputs\apk\debug\app-debug.apk" "lao-learner-v1.8.0.apk" >nul
echo.
echo APK ready: %CD%\lao-learner-v1.8.0.apk
exit /b 0

:failed
echo.
echo Android build failed.
exit /b 1
