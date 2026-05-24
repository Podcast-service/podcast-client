#!/usr/bin/env node
// Cross-platform wrapper that builds the cef-host bundle for the current OS
// by invoking the matching shell script (build-cef-host.sh on macOS/Linux,
// build-cef-host.ps1 on Windows). Used by package.json so `pnpm tauri:dev`
// and `pnpm tauri:build` produce a runnable app in one step.
//
// Idempotent by default: if a bundle is already present at the expected
// sentinel path we skip the rebuild — the underlying script does a full
// wipe-and-recopy of the CEF framework (~400MB on macOS) every time, so
// re-running it on every `tauri dev` would make iteration painful.
//
// To force a rebuild (e.g. after editing cef-host source):
//   • pass --force, OR
//   • remove cef-host/target/bundle/

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { platform } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DESKTOP_ROOT = join(__dirname, "..");
const BUNDLE_ROOT = join(DESKTOP_ROOT, "cef-host", "target", "bundle");

const rawArgs = process.argv.slice(2);
const force = rawArgs.includes("--force");
const passArgs = rawArgs.filter((a) => a !== "--force");

const isWin = platform() === "win32";
const sentinel = isWin
  ? join(BUNDLE_ROOT, "cef-host", "cef-host.exe")
  : join(BUNDLE_ROOT, "cef-host.app", "Contents", "MacOS", "cef-host");

if (!force && existsSync(sentinel)) {
  console.log(`cef-host bundle present (${sentinel}), skipping rebuild.`);
  console.log(
    "  → pass --force or remove cef-host/target/bundle/ to rebuild.",
  );
  process.exit(0);
}

const script = isWin
  ? join(__dirname, "build-cef-host.ps1")
  : join(__dirname, "build-cef-host.sh");

const cmd = isWin ? "powershell" : "bash";
const cmdArgs = isWin
  ? ["-ExecutionPolicy", "Bypass", "-File", script, ...passArgs]
  : [script, ...passArgs];

const result = spawnSync(cmd, cmdArgs, { stdio: "inherit" });
process.exit(result.status ?? 1);
