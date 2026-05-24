# Build the cef-host sidecar and bundle it for Windows.
# Produces:   <repo>/apps/desktop/cef-host/target/bundle/cef-host/cef-host.exe
# alongside the libcef.dll / locales / *.pak files needed at runtime.
#
# Uses the `bundle_cef_host` bin from cef-host itself (which calls into
# `cef::build_util::win::build_bundle`). This reuses cef-dll-sys's already
# downloaded CEF binaries — no separate `cargo install` and no version drift.

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$CefHostDir = Join-Path $Root "cef-host"
$BundleOut = Join-Path $CefHostDir "target\bundle\cef-host"

$Release = $false
foreach ($arg in $args) {
    if ($arg -eq "--release" -or $arg -eq "-r") { $Release = $true }
}

# Ignore a system-wide CEF_PATH that may point at a different CEF version
# (e.g. older 144.x binaries from `export-cef-dir`). Without CEF_PATH,
# `cef-dll-sys` downloads the exact CEF release that matches the `cef` crate
# version into its OUT_DIR, so the symbols always line up.
Remove-Item Env:CEF_PATH -ErrorAction SilentlyContinue

Push-Location $CefHostDir
try {
    $bundleArgs = @("run", "--bin", "bundle_cef_host", "--", "-o", $BundleOut)
    if ($Release) { $bundleArgs += "--release" }

    Write-Host "==> Running bundle_cef_host ($(if ($Release) { 'release' } else { 'debug' }))..."
    & cargo @bundleArgs
    if ($LASTEXITCODE -ne 0) { throw "bundle_cef_host failed" }
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "Built: $BundleOut\cef-host.exe"
