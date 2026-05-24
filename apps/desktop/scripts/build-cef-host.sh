#!/usr/bin/env bash
# Build the cef-host sidecar and bundle it into a macOS .app
# (Chromium Embedded Framework + helper subprocesses).
#
# Uses the local `bundle_cef_host` bin (lives inside cef-host itself), which
# reuses cef-dll-sys's already-downloaded CEF binaries — no external cef-rs
# checkout, no `cargo install`, no version drift.
#
# Usage: ./scripts/build-cef-host.sh [--release|-r]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CEF_HOST_DIR="$ROOT/cef-host"
BUNDLE_OUT="$CEF_HOST_DIR/target/bundle"

RELEASE=0
for arg in "$@"; do
    case "$arg" in
        --release|-r) RELEASE=1 ;;
    esac
done

# Ignore a system-wide CEF_PATH that may point at a different CEF version.
# Without CEF_PATH, cef-dll-sys downloads the exact CEF release matching the
# `cef` crate version into its OUT_DIR, so symbols always line up.
unset CEF_PATH

cd "$CEF_HOST_DIR"

bundle_args=(run --bin bundle_cef_host -- -o "$BUNDLE_OUT")
if [ "$RELEASE" -eq 1 ]; then
    bundle_args+=(--release)
    profile_label="release"
else
    profile_label="debug"
fi

echo "==> Running bundle_cef_host ($profile_label)..."
cargo "${bundle_args[@]}"

echo
echo "Built: $BUNDLE_OUT/cef-host.app"
