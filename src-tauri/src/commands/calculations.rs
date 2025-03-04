use serde::Serialize;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter, State};
use tokio::sync::Mutex;

use crate::TransmissionState;

use super::modbus_serial::{read_holding_registers, CurrentConnection};
use super::settings::SettingsState;

#[derive(Clone)]
pub enum DataSource {
    Live,
    Playback {
        index: u64,
        data: Vec<Arc<ColumnEntry>>,
    },
}

#[derive(Default, Clone, Serialize, Debug)]
pub struct ColumnEntry {
    pub timestamp: u64,
    pub temperatures: Vec<f64>,
    pub compositions: Vec<f64>,
}

#[derive(Default, Clone, Serialize)]
pub struct MeasurementHistory {
    pub history: Vec<Arc<ColumnEntry>>,
}

async fn read_temperatures(
    settings_state: State<'_, Mutex<SettingsState>>,
    connection_state: State<'_, Mutex<CurrentConnection>>,
) -> Result<Vec<f64>, String> {
    let settings = {
        let current_settings = settings_state.lock().await;
        current_settings.settings.clone()
    };
    let Some(settings) = settings else {
        return Err("Error to get settings".into());
    };

    let temperatures = read_holding_registers(
        connection_state,
        settings.temperature_address.bottom,
        settings.count,
        settings.timeout,
        settings.unit_id,
    )
    .await
    .map_err(|e| format!("Error in read temperatures {:?}", e))?;

    let temperature_bottom = temperatures[0].value;
    let temperature_top = temperatures[1].value;

    let temperature_bottom_format = temperature_bottom as f64 / 100.0;
    let temperature_top_format = temperature_top as f64 / 100.0;

    return Ok(vec![temperature_bottom_format, temperature_top_format]);
}

fn interpolate_temperatures(num_plates: usize, t1: f64, tn: f64) -> Vec<f64> {
    if num_plates <= 2 {
        return vec![t1, tn];
    }
    let mut interpolated_temps = Vec::with_capacity(num_plates);
    for i in 0..num_plates {
        let temp: f64 = t1 + (i as f64) / (num_plates as f64 - 1.0) * (tn - t1);
        interpolated_temps.push(temp);
    }
    interpolated_temps
}

pub async fn send_column_data(
    app_handle: AppHandle,
    settings_state: State<'_, Mutex<SettingsState>>,
    connection_state: State<'_, Mutex<CurrentConnection>>,
    measurement_history_state: State<'_, Mutex<MeasurementHistory>>,
    data_source_state: State<'_, Mutex<DataSource>>,
) -> Result<(), String> {
    println!("\nInitializing send_column_data...");

    let data_entry =
        get_column_data(&settings_state, &connection_state, &data_source_state).await?;

    {
        let mut history = measurement_history_state.lock().await;
        history.history.push(data_entry.clone());
    }

    println!("Emitting data: {:?}", data_entry);
    if let Err(e) = app_handle.emit("column_data", data_entry) {
        return Err(format!("Failed to emit data: {}", e));
    };
    Ok(())
}

#[tauri::command]
pub async fn active_column_data(
    transmission_state: State<'_, Mutex<TransmissionState>>,
) -> Result<(), String> {
    println!("Starting column data");
    let mut transmission_state = transmission_state.lock().await;
    transmission_state.is_running = true;

    Ok(())
}

#[tauri::command]
pub async fn cancel_column_data(
    transmission_state: State<'_, Mutex<TransmissionState>>,
) -> Result<(), String> {
    println!("Canceling column data");
    let mut transmission_state = transmission_state.lock().await;
    transmission_state.is_running = false;

    Ok(())
}

fn calculate_compositions(_temperatures: Vec<f64>) -> Vec<f64> {
    vec![0.0, 0.0, 0.0]
}

async fn get_column_data(
    settings_state: &State<'_, Mutex<SettingsState>>,
    connection_state: &State<'_, Mutex<CurrentConnection>>,
    data_source_state: &State<'_, Mutex<DataSource>>,
) -> Result<Arc<ColumnEntry>, String> {
    let mut ds = data_source_state.lock().await;

    match &mut *ds {
        DataSource::Playback { index, data } => {
            if (*index as usize) < data.len() {
                let entry = data[*index as usize].clone();
                *index += 1;
                Ok(entry)
            } else {
                Err("No more playback data available".into())
            }
        }
        DataSource::Live => {
            let temperatures = read_temperatures(settings_state.clone(), connection_state.clone())
                .await
                .map_err(|_| "Failed to read temperatures".to_string())?;

            let settings = {
                let current_settings = settings_state.lock().await;
                current_settings.settings.clone()
            }
            .ok_or("No settings found".to_string())?;

            println!("Settings: {:?}", settings);
            println!("Temperatures: {:?}", temperatures);

            let interpolate_temps =
                interpolate_temperatures(settings.number_plates, temperatures[0], temperatures[1]);

            println!("Interpolated temperatures: {:?}", interpolate_temps);

            let compositions = calculate_compositions(interpolate_temps.clone());

            println!("Compositions: {:?}", compositions);

            Ok(Arc::new(ColumnEntry {
                timestamp: SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
                temperatures: interpolate_temps,
                compositions,
            }))
        }
    }
}
