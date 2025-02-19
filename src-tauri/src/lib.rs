mod commands;
use commands::modbus_serial::{
    available_ports, connect_modbus, disconnect_modbus, is_connected, read_coils,
    read_holding_registers, write_single_coil, write_single_register, CurrentConnection,
};
use commands::settings::{load_settings, save_settings, SettingsState};
use serde::Serialize;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::sync::Mutex;
use tokio::time::Duration;

#[derive(Default, Clone, Serialize)]
pub struct ColumnDataEntry {
    timestamp: u64,
    temperatures: Vec<f64>,
    compositions: Vec<f64>,
}

#[derive(Default, Clone, Serialize)]
pub struct ColumnData {
    history: Vec<ColumnDataEntry>,
}

impl ColumnData {
    pub fn add_entry(&mut self, temperatures: Vec<f64>, compositions: Vec<f64>) {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        self.history.push(ColumnDataEntry {
            timestamp,
            temperatures,
            compositions,
        });
    }
}

fn calculate_compositions(temperatures: Vec<f64>) -> Vec<f64> {
    return vec![1.0, 2.0, 3.0, 4.0, 5.0, 6.0];
}

async fn read_temperatures(
    app_handle: AppHandle,
    settings_state: State<'_, Arc<Mutex<SettingsState>>>,
    connection_state: State<'_, Arc<Mutex<CurrentConnection>>>,
) -> Result<Vec<f64>, String> {
    println!("Reading temperatures");
    let current_settings = settings_state.lock().await;
    let settings_exists = current_settings.settings_exists();
    drop(current_settings);

    if !settings_exists {
        let _ = load_settings(app_handle, settings_state.clone()).await;
    }
    let settings = settings_state.lock().await;
    if let Some(settings_some) = &settings.settings {
        let settings = settings_some;
        println!("Settings exists in some: {:?}", settings);
        let temperature_bottom = match read_holding_registers(
            connection_state.clone(),
            settings.temperature_address.bottom,
            settings.count,
            settings.timeout,
            settings.unit_id,
        )
        .await
        {
            Ok(response) => {
                println!("Temperature bottom: {:?}", response);
                response.value
            }
            Err(e) => {
                println!("Error reading bottom temperature: {:?}", e);
                0
            }
        };

        let temperature_top = match read_holding_registers(
            connection_state.clone(),
            settings.temperature_address.top,
            settings.count,
            settings.timeout,
            settings.unit_id,
        )
        .await
        {
            Ok(response) => {
                println!("Temperature top: {:?}", response);
                response.value
            }
            Err(e) => {
                println!("Error reading top temperature: {:?}", e);
                90 * 100
            }
        };

        let temperature_bottom_format = temperature_bottom as f64 / 100.0;
        let temperature_top_format = temperature_top as f64 / 100.0;

        return Ok(vec![temperature_bottom_format, temperature_top_format]);
    } else {
        Err("Invalid state".into())
    }
}

fn interpolate_temperatures(num_plates: usize, t1: f64, tn: f64) -> Vec<f64> {
    let mut interpolated_temps = Vec::with_capacity(num_plates);
    for i in 0..num_plates {
        let temp = t1 + (i as f64) / (num_plates as f64 - 1.0) * (tn - t1);
        interpolated_temps.push(temp);
    }
    interpolated_temps
}

async fn send_column_data(
    app_handle: AppHandle,
    settings_state: State<'_, Arc<Mutex<SettingsState>>>,
    connection_state: State<'_, Arc<Mutex<CurrentConnection>>>,
    column_data_state: State<'_, Arc<Mutex<ColumnData>>>,
) {
    let app_handle_state = app_handle.clone();
    let temperatures =
        match read_temperatures(app_handle_state, settings_state, connection_state).await {
            Ok(temps) => temps,
            Err(err) => {
                println!("Error reading temperatures: {}", err);
                vec![0.0 as f64, 80.0 as f64]
            }
        };

    println!("Temperatures: {:?}", temperatures);

    let interpolate_temps = interpolate_temperatures(6, temperatures[0], temperatures[1]);

    println!("Interpolated temperatures: {:?}", interpolate_temps);

    let compositions = calculate_compositions(interpolate_temps.clone());

    println!("Compositions: {:?}", compositions);

    let mut current_column_data = column_data_state.lock().await;

    current_column_data.add_entry(interpolate_temps, compositions);

    app_handle
        .emit("column_data", &current_column_data.clone())
        .unwrap()
}

/*
#[tauri::command]
async fn calculate_compositions() {}
*/

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let settings = Arc::new(Mutex::new(SettingsState::default()));
    let connection = Arc::new(Mutex::new(CurrentConnection::default()));
    let column_data_history = Arc::new(Mutex::new(ColumnData::default()));

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .manage(settings.clone())
        .manage(connection.clone())
        .manage(column_data_history.clone())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            connect_modbus,
            disconnect_modbus,
            read_coils,
            read_holding_registers,
            write_single_coil,
            write_single_register,
            is_connected,
            available_ports,
            load_settings,
            save_settings
        ])
        .setup(|app| {
            let app_handle = app.handle().clone();
            let settings_handle = app.handle().clone();
            let connection_handle = app.handle().clone();
            let column_data_hanlde = app.handle().clone();

            tokio::spawn(async move {
                let settings_state = settings_handle.state::<Arc<Mutex<SettingsState>>>().clone();
                let connection_state = connection_handle
                    .state::<Arc<Mutex<CurrentConnection>>>()
                    .clone();
                let column_data_state =
                    column_data_hanlde.state::<Arc<Mutex<ColumnData>>>().clone();
                loop {
                    {
                        let connection = connection_state.lock().await;
                        if connection.is_connected() {
                            println!("Connection is not active");
                            continue;
                        }
                    }
                    send_column_data(
                        app_handle.clone(),
                        settings_state.clone(),
                        connection_state.clone(),
                        column_data_state.clone(),
                    )
                    .await;
                    println!("");
                    tokio::time::sleep(Duration::from_secs(1)).await;
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
