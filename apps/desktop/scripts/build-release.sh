#!/usr/bin/env bash
# Build a distributable macOS .app:
#   1. cef-host release .app (built via the local bundle_cef_host bin —
#      no external cef-rs clone required).
#   2. Tauri release build (frontend talks to the server backend).
#   3. Copy cef-host.app into MyApp.app/Contents/Resources/.
#   4. Strip the quarantine xattr and zip the result.
#
# Output: dist-release/<AppName>.zip
#
# Usage: ./scripts/build-release.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_TARGET="${VITE_BACKEND_TARGET:-server}"

# ---------------------------------------------------------------------------
# 1. cef-host release .app
# ---------------------------------------------------------------------------
echo "==> Building cef-host release bundle..."
"$ROOT/scripts/build-cef-host.sh" --release

CEF_BUNDLE="$ROOT/cef-host/target/bundle/cef-host.app"
if [ ! -d "$CEF_BUNDLE" ]; then
    echo "Expected cef-host.app at $CEF_BUNDLE — build-cef-host.sh did not produce it."
    exit 1
fi

# ---------------------------------------------------------------------------
# 2. Tauri release build
# ---------------------------------------------------------------------------
echo "==> Building Tauri (frontend target: $BACKEND_TARGET)..."
cd "$ROOT"
VITE_BACKEND_TARGET="$BACKEND_TARGET" pnpm tauri build

# Find the produced .app — there may be variants per arch under bundle/macos
APP_BUNDLE=$(find "$ROOT/src-tauri/target/release/bundle/macos" -maxdepth 1 -name "*.app" -type d | head -1)
if [ -z "$APP_BUNDLE" ] || [ ! -d "$APP_BUNDLE" ]; then
    echo "Could not find built Tauri .app under src-tauri/target/release/bundle/macos/"
    exit 1
fi
APP_NAME="$(basename "$APP_BUNDLE")"
echo "==> Tauri produced: $APP_BUNDLE"

# ---------------------------------------------------------------------------
# 3. Embed cef-host.app inside the Tauri bundle
# ---------------------------------------------------------------------------
echo "==> Embedding cef-host.app into $APP_NAME/Contents/Resources/..."
TARGET_RES="$APP_BUNDLE/Contents/Resources/cef-host.app"
rm -rf "$TARGET_RES"
cp -R "$CEF_BUNDLE" "$TARGET_RES"

# ---------------------------------------------------------------------------
# 4. Strip Gatekeeper quarantine on our own files (so the local copy runs).
#    The friend's Mac will still mark the downloaded zip as quarantined — they
#    must right-click → Open on first launch (or run `xattr -dr` themselves).
# ---------------------------------------------------------------------------
echo "==> Stripping quarantine xattrs (local copy)..."
xattr -dr com.apple.quarantine "$APP_BUNDLE" 2>/dev/null || true

# ---------------------------------------------------------------------------
# 5. DMG for distribution.
#    Built from the patched .app via hdiutil (compressed read-only UDZO). We
#    don't reuse Tauri's own dmg output because it's produced before we embed
#    cef-host.app, so it ships without the sidecar.
# ---------------------------------------------------------------------------
DIST_DIR="$ROOT/dist-release"
mkdir -p "$DIST_DIR"
VOLNAME="${APP_NAME%.app}"
DMG_PATH="$DIST_DIR/${VOLNAME}.dmg"
DMG_STAGE="$(mktemp -d)"
trap 'rm -rf "$DMG_STAGE"' EXIT

cp -R "$APP_BUNDLE" "$DMG_STAGE/"
ln -s /Applications "$DMG_STAGE/Applications"

rm -f "$DMG_PATH"
echo "==> Building $DMG_PATH..."
hdiutil create \
    -volname "$VOLNAME" \
    -srcfolder "$DMG_STAGE" \
    -ov \
    -format UDZO \
    "$DMG_PATH" >/dev/null

SIZE=$(du -sh "$DMG_PATH" | awk '{print $1}')

cat <<EOF

============================================================
Built: $APP_BUNDLE
DMG:   $DMG_PATH ($SIZE)
Backend target: $BACKEND_TARGET

Give your friend the dmg. Tell them:
  1. Open the .dmg and drag "$APP_NAME" into the Applications shortcut.
  2. First launch will fail Gatekeeper. Either:
       • Right-click the app → Open → confirm in the dialog, OR
       • Run in Terminal:
           xattr -dr com.apple.quarantine "/Applications/$APP_NAME"
  3. The app talks to backend target: $BACKEND_TARGET
     (currently hardcoded — rebuild with VITE_BACKEND_TARGET=local for local docker).
============================================================
EOF
