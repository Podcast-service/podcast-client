mod cef;

use cef::CefSidecarSlot;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ApiFetchRequest {
    method: String,
    url: String,
    headers: Option<HashMap<String, String>>,
    body: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ApiFetchResponse {
    status: u16,
    headers: HashMap<String, String>,
    body: String,
}

#[tauri::command]
async fn api_fetch(request: ApiFetchRequest) -> Result<ApiFetchResponse, String> {
    let url = reqwest::Url::parse(&request.url).map_err(|err| err.to_string())?;
    if url.scheme() != "https" || url.host_str() != Some("castapp.ru") {
        return Err("api_fetch supports only https://castapp.ru".to_string());
    }

    let method = request
        .method
        .parse::<reqwest::Method>()
        .map_err(|err| err.to_string())?;
    let client = reqwest::Client::new();
    let mut builder = client.request(method, url);

    if let Some(headers) = request.headers {
        for (name, value) in headers {
            let lower = name.to_ascii_lowercase();
            if matches!(lower.as_str(), "host" | "origin" | "referer" | "content-length") {
                continue;
            }
            builder = builder.header(name, value);
        }
    }

    if let Some(body) = request.body {
        builder = builder.body(body);
    }

    let response = builder.send().await.map_err(|err| err.to_string())?;
    let status = response.status().as_u16();
    let headers = response
        .headers()
        .iter()
        .filter_map(|(name, value)| {
            value
                .to_str()
                .ok()
                .map(|value| (name.to_string(), value.to_string()))
        })
        .collect();
    let body = response.text().await.map_err(|err| err.to_string())?;

    Ok(ApiFetchResponse {
        status,
        headers,
        body,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(CefSidecarSlot::default())
        .invoke_handler(tauri::generate_handler![
            cef::cef_open,
            cef::cef_navigate,
            cef::cef_eval,
            cef::cef_query,
            cef::cef_show,
            cef::cef_hide,
            cef::cef_dev_tools,
            cef::cef_close,
            cef::cef_shutdown,
            api_fetch,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
