// Wraps the cef crate's `build_util::*::build_bundle` so we can produce a runnable
// CEF bundle without `cargo install`-ing a separate `bundle-cef-app` (which would
// pull down a duplicate copy of the CEF binaries with a build OUT_DIR that doesn't
// survive past install). Running this bin reuses cef-dll-sys's downloaded CEF dir
// directly, so cef-host and its bundle always link against the same headers.
//
// Usage: cargo run --bin bundle_cef_host -- [-o <dir>] [--release]

use std::{env, error::Error, path::PathBuf, process};

fn main() {
    if let Err(err) = run() {
        eprintln!("bundle_cef_host: {err}");
        process::exit(1);
    }
}

fn run() -> Result<(), Box<dyn Error>> {
    let mut args = env::args().skip(1);
    let mut output: Option<PathBuf> = None;
    let mut release = false;
    while let Some(a) = args.next() {
        match a.as_str() {
            "--release" | "-r" => release = true,
            "-o" | "--output" => {
                output = args.next().map(PathBuf::from);
            }
            other => {
                return Err(format!("unknown arg: {other}").into());
            }
        }
    }
    let output =
        output.unwrap_or_else(|| PathBuf::from("target").join("bundle").join("cef-host"));

    // Wipe stale bundle contents so old CEF dll versions don't sit next to new ones.
    if output.exists() {
        std::fs::remove_dir_all(&output)?;
    }
    std::fs::create_dir_all(&output)?;

    #[cfg(target_os = "windows")]
    {
        cef::build_util::win::build_bundle(&output, "cef-host", release)?;
    }

    #[cfg(target_os = "linux")]
    {
        cef::build_util::linux::build_bundle(&output, "cef-host", release)?;
    }

    #[cfg(target_os = "macos")]
    {
        return Err(
            "macOS bundling is handled by scripts/build-cef-host.sh (uses cef-rs's bundle-cef-app \
             so the .app layout, helpers, and Info.plist match what cef-rs's tooling expects)."
                .into(),
        );
    }

    println!("Bundle created at: {}", output.display());
    Ok(())
}
