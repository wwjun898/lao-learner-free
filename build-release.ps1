$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$env:JAVA_HOME = Join-Path $PSScriptRoot '_android-tools/jdk/jdk-21.0.12+8'
$env:ANDROID_HOME = Join-Path $PSScriptRoot '_android-tools/sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$runtimeBin = 'C:/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin'
$pnpm = 'C:/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/pnpm.cmd'
$env:PATH = "$env:JAVA_HOME/bin;$runtimeBin;$env:PATH"
$buildTools = Join-Path $env:ANDROID_HOME 'build-tools/36.0.0'
$version = (Get-Content package.json -Raw | ConvertFrom-Json).version
$signingDir = Join-Path $PSScriptRoot '_release-signing'
$keyFile = Join-Path $signingDir 'lao-learner-release.jks'
$passwordFile = Join-Path $signingDir 'release-password.txt'

& $pnpm run build:android:web
if ($LASTEXITCODE -ne 0) { throw 'Mobile web build failed' }
& $pnpm exec cap sync android
if ($LASTEXITCODE -ne 0) { throw 'Android sync failed' }
& ./android/gradlew.bat -p android assembleRelease assembleDebug
if ($LASTEXITCODE -ne 0) { throw 'Android build failed' }

if (!(Test-Path -LiteralPath $signingDir)) { New-Item -ItemType Directory -Path $signingDir | Out-Null }
if (!(Test-Path -LiteralPath $passwordFile)) {
  if (Test-Path -LiteralPath $keyFile) { throw 'Existing signing key password is missing; restore it before continuing' }
  $randomBytes = New-Object byte[] 32
  $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
  try { $rng.GetBytes($randomBytes) } finally { $rng.Dispose() }
  [IO.File]::WriteAllText($passwordFile, [Convert]::ToBase64String($randomBytes))
}
try {
  $env:LAO_RELEASE_PASSWORD = [IO.File]::ReadAllText($passwordFile).Trim()
  if (!(Test-Path -LiteralPath $keyFile)) {
    & "$env:JAVA_HOME/bin/keytool.exe" -genkeypair -keystore $keyFile -storetype JKS -alias lao-learner -keyalg RSA -keysize 3072 -validity 10000 -dname 'CN=wuzongsheng, OU=Lao Learner, O=Lao Learner' -storepass:env LAO_RELEASE_PASSWORD -keypass:env LAO_RELEASE_PASSWORD -noprompt
    if ($LASTEXITCODE -ne 0) { throw 'Release signing key generation failed' }
  }
  $unsigned = Join-Path $PSScriptRoot 'android/app/build/outputs/apk/release/app-release-unsigned.apk'
  $aligned = Join-Path $PSScriptRoot 'android/app/build/outputs/apk/release/app-release-aligned.apk'
  $releaseApk = Join-Path $PSScriptRoot "lao-learner-v$version-release.apk"
  & "$buildTools/zipalign.exe" -f -p 4 $unsigned $aligned
  if ($LASTEXITCODE -ne 0) { throw 'APK alignment failed' }
  & "$buildTools/apksigner.bat" sign --ks $keyFile --ks-key-alias lao-learner --ks-pass env:LAO_RELEASE_PASSWORD --key-pass env:LAO_RELEASE_PASSWORD --out $releaseApk $aligned
  if ($LASTEXITCODE -ne 0) { throw 'APK signing failed' }
  & "$buildTools/apksigner.bat" verify --verbose $releaseApk
  if ($LASTEXITCODE -ne 0) { throw 'APK signature verification failed' }
  Copy-Item -LiteralPath 'android/app/build/outputs/apk/debug/app-debug.apk' -Destination "lao-learner-v$version-upgrade.apk"
  Write-Output "Release APK: $releaseApk"
  Write-Output "Compatibility APK: lao-learner-v$version-upgrade.apk"
  Write-Output 'Keep _release-signing private and backed up; future releases must reuse this key.'
} finally {
  $env:LAO_RELEASE_PASSWORD = $null
}
