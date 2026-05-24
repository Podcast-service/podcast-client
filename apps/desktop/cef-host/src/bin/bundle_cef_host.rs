// Wraps the cef crate's `build_util::*::build_bundle` so we can produce a runnable
// CEF bundle without `cargo install`-ing a separate `bundle-cef-app` (which would
// pull down a duplicate copy of the CEF binaries with a build OUT_DIR that doesn't
// survive past install). Running this bin reuses cef-dll-sys's downloaded CEF dir
// directly, so cef-host and its bundle always link against the same headers.
//
// Usage: cargo run --bin bundle_cef_host -- [-o <dir>] [--release]
//
// Output layout:
//   Windows / Linux: <out>/cef-host[.exe] + libcef + locales/ ...
//   macOS:           <out>/cef-host.app (full .app with frameworks + helpers)

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

    #[cfg(target_os = "macos")]
    let default_out = PathBuf::from("target").join("bundle");
    #[cfg(not(target_os = "macos"))]
    let default_out = PathBuf::from("target").join("bundle").join("cef-host");

    let output = output.unwrap_or(default_out);

    if output.exists() {
        std::fs::remove_dir_all(&output)?;
    }
    std::fs::create_dir_all(&output)?;

    #[cfg(target_os = "windows")]
    {
        cef::build_util::win::build_bundle(&output, "cef-host", release)?;
        println!("Bundle created at: {}", output.display());
    }

    #[cfg(target_os = "linux")]
    {
        cef::build_util::linux::build_bundle(&output, "cef-host", release)?;
        println!("Bundle created at: {}", output.display());
    }

    #[cfg(target_os = "macos")]
    {
        let app_path = build_macos_bundle(&output, release)?;
        println!("Bundle created at: {}", app_path.display());
    }

    Ok(())
}

#[cfg(target_os = "macos")]
fn build_macos_bundle(output: &std::path::Path, release: bool) -> Result<PathBuf, Box<dyn Error>> {
    use cef::build_util::mac::{BundleInfo, bundle};
    use cef::build_util::metadata::get_cargo_metadata;
    use semver::Version;
    use std::process::Command;

    let executable = "cef-host";

    let metadata = get_cargo_metadata()?;
    let bundle_meta = metadata.parse_bundle_metadata(executable)?;
    let helper_name = bundle_meta.helper_name.clone();

    let cargo = env::var("CARGO").unwrap_or_else(|_| "cargo".into());
    let mut build = Command::new(&cargo);
    build
        .arg("build")
        .arg("--bin")
        .arg(executable)
        .arg("--bin")
        .arg(&helper_name);
    if release {
        build.arg("--release");
    }
    let status = build.status()?;
    if !status.success() {
        return Err(format!("cargo build failed (status {status})").into());
    }

    let profile_dir = if release { "release" } else { "debug" };
    let target_path = metadata.target_directory().join(profile_dir);

    let version = Version::parse(env!("CARGO_PKG_VERSION"))?;
    let bundle_info = BundleInfo::new(
        executable,
        &format!("com.podcast-client.{executable}"),
        executable,
        "English",
        version,
    );

    let app_path = bundle(
        output,
        &target_path,
        executable,
        &helper_name,
        bundle_meta.resources_path,
        bundle_info,
    )?;
    Ok(app_path)
}
