use serde::{Deserialize, Serialize};
use std::fs;
use std::sync::Arc;
use tauri::{AppHandle, Manager, State};
use tokio::sync::Mutex;

#[derive(Default, Clone, Debug)]
pub struct SettingsState {
    pub settings: Option<Settings>,
}

impl SettingsState {
    pub fn set_settings(&mut self, settings: Settings) {
        self.settings = Some(settings);
    }

    pub fn settings_exists(&self) -> bool {
        self.settings.is_some()
    }
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct Settings {
    pub usb_port: String,
    pub baudrate: u32,
    pub temperature_address: TemperatureAddress,
    pub count: u16,
    pub timeout: u64,
    pub unit_id: u8,
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct TemperatureAddress {
    pub top: u16,
    pub bottom: u16,
}

const SETTINGS_FILE: &str = "settings.json";

pub async fn ensure_settings_file(app_handle: AppHandle) -> String {
    let app_data_dir = app_handle.path().app_config_dir().unwrap();
    if !app_data_dir.exists() {
        println!("Creating app data directory...");
        match fs::create_dir(app_data_dir.clone()) {
            Ok(_) => println!("App data directory created"),
            Err(e) => println!("Error creating app data directory: {:?}", e),
        }
    }

    let settings_file = app_data_dir.join(SETTINGS_FILE);
    if !settings_file.exists() {
        println!("Creating settings file...");
        let settings = Settings::default();
        let settings_json = serde_json::to_string(&settings).unwrap();
        match fs::write(settings_file.clone(), settings_json) {
            Ok(_) => println!("Settings file created"),
            Err(e) => println!("Error creating settings file: {:?}", e),
        }
    }
    return settings_file.to_str().unwrap().to_string();
}

#[tauri::command]
pub async fn save_settings(app_handle: AppHandle, new_settings: Settings) {
    let app_data_dir = ensure_settings_file(app_handle).await;
    let settings_json = serde_json::to_string(&new_settings).unwrap();
    match fs::write(app_data_dir, settings_json) {
        Ok(_) => println!("Settings saved: {:?}", new_settings),
        Err(e) => println!("Error saving settings: {:?}", e),
    }
}

#[tauri::command]
pub async fn load_settings(
    app_handle: AppHandle,
    settings_state: State<'_, Arc<Mutex<SettingsState>>>,
) -> Result<Settings, Settings> {
    println!("Loading settings...");
    let app_data_dir = ensure_settings_file(app_handle).await;
    match fs::read_to_string(app_data_dir) {
        Ok(settings_json) => {
            let new_settings: Settings = serde_json::from_str(&settings_json).unwrap();
            let mut settings = settings_state.lock().await;
            settings.set_settings(new_settings.clone());
            println!("Settings succesfully loaded");
            return Ok(new_settings);
        }
        Err(e) => {
            println!("Error loading settings: {:?}", e);
            return Err(Settings::default());
        }
    };
}
