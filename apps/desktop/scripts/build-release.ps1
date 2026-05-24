# Build a distributable Windows app:
#   1. cef-host release bundle (exe + CEF dlls + locales) under
#      apps/desktop/cef-host/target/bundle/cef-host/
#   2. Tauri release build. The bundle dir is pulled in via
#      `tauri.windows.conf.json`'s bundle.resources field.
#   3. Zip the .exe installer (NSIS) for distribution.
#
# Usage: powershell -ExecutionPolicy Bypass -File scripts\build-release.ps1
#
# Env vars:
#   VITE_BACKEND_TARGET  "server" (default) | "local"

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$RepoRoot = Resolve-Path (Join-Path $Root "..\..")
$BackendTarget = if ($env:VITE_BACKEND_TARGET) { $env:VITE_BACKEND_TARGET } else { "server" }

# ---------------------------------------------------------------------------
# 1. cef-host release bundle.
# ---------------------------------------------------------------------------
Write-Host "==> Building cef-host release bundle..."
& (Join-Path $PSScriptRoot "build-cef-host.ps1") --release
if ($LASTEXITCODE -ne 0) { throw "build-cef-host.ps1 failed" }

# ---------------------------------------------------------------------------
# 2. Tauri release build (bundle.resources picks up cef-host/).
# ---------------------------------------------------------------------------
Write-Host "==> Building Tauri (frontend target: $BackendTarget)..."
Push-Location $Root
try {
    $env:VITE_BACKEND_TARGET = $BackendTarget
    & pnpm tauri build
    if ($LASTEXITCODE -ne 0) { throw "tauri build failed" }
} finally {
    Pop-Location
}

# ---------------------------------------------------------------------------
# 3. Locate the produced installer.
# ---------------------------------------------------------------------------
$BundleRoot = Join-Path $Root "src-tauri\target\release\bundle"
$Installer = Get-ChildItem -Path (Join-Path $BundleRoot "nsis") -Filter "*.exe" -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
if (-not $Installer) {
    $Installer = Get-ChildItem -Path (Join-Path $BundleRoot "msi") -Filter "*.msi" -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
}
if (-not $Installer) {
    throw "Could not find produced installer under $BundleRoot (nsis\*.exe or msi\*.msi)"
}

Write-Host "==> Tauri produced: $($Installer.FullName)"

# ---------------------------------------------------------------------------
# 4. Copy installer into dist-release/ for easy distribution.
# ---------------------------------------------------------------------------
$DistDir = Join-Path $Root "dist-release"
New-Item -ItemType Directory -Path $DistDir -Force | Out-Null
$DistInstaller = Join-Path $DistDir $Installer.Name
Copy-Item -Path $Installer.FullName -Destination $DistInstaller -Force

$Size = "{0:N1} MB" -f ((Get-Item $DistInstaller).Length / 1MB)

Write-Host ""
Write-Host "============================================================"
Write-Host "Built installer: $DistInstaller ($Size)"
Write-Host "Backend target:  $BackendTarget"
Write-Host ""
Write-Host "Share the installer with your friend. They run it; the app installs"
Write-Host "to %LOCALAPPDATA%\Programs\<app-name>\ with cef-host/ alongside the main exe."
Write-Host "============================================================"
