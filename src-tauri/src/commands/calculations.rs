use serde::Serialize;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter, State};
use tokio::sync::Mutex;

use super::modbus_serial::{read_holding_registers, CurrentConnection};
use super::settings::SettingsState;

#[derive(Default, Clone, Serialize)]
pub struct ColumnDataEntry {
    pub timestamp: u64,
    pub temperatures: Vec<f64>,
    pub compositions: Vec<f64>,
}

#[derive(Default, Clone, Serialize)]
pub struct ColumnData {
    pub history: Vec<ColumnDataEntry>,
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

async fn read_temperatures(
    settings_state: State<'_, Arc<Mutex<SettingsState>>>,
    connection_state: State<'_, Arc<Mutex<CurrentConnection>>>,
) -> Result<Vec<f64>, String> {
    println!("Reading temperatures");
    let settings = {
        let current_settings = settings_state.lock().await;
        current_settings.settings.clone()
    };
    let Some(settings) = settings else {
        return Err("Error to get settings".into());
    };

    let temperatures = read_holding_registers(
        connection_state.clone(),
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
    settings_state: State<'_, Arc<Mutex<SettingsState>>>,
    connection_state: State<'_, Arc<Mutex<CurrentConnection>>>,
    column_data_state: State<'_, Arc<Mutex<ColumnData>>>,
) {
    println!("\nSending column data...");
    let temperatures = match read_temperatures(settings_state.clone(), connection_state).await {
        Ok(temps) => temps,
        Err(err) => {
            println!("Error reading temperatures: {}", err);
            vec![0.0 as f64, 0.0 as f64]
        }
    };

    let settings = {
        let current_settings = settings_state.lock().await;
        current_settings.settings.clone()
    };

    let Some(settings) = settings else {
        return {};
    };

    println!("Settings: {:?}", settings);

    println!("Temperatures: {:?}", temperatures);

    let interpolate_temps =
        interpolate_temperatures(settings.number_plates, temperatures[0], temperatures[1]);

    println!("Interpolated temperatures: {:?}", interpolate_temps);

    let compositions = calculate_compositions(interpolate_temps.clone());

    println!("Compositions: {:?}", compositions);

    let mut current_column_data = column_data_state.lock().await;

    current_column_data.add_entry(interpolate_temps, compositions);

    let mut format_data = current_column_data.clone();
    let lenght_history = format_data.history.len();
    if lenght_history > 240 {
        format_data.history = format_data.history.split_off(lenght_history - 240);
    }
    app_handle.emit("column_data", format_data).unwrap()
}

fn calculate_compositions(_temperatures: Vec<f64>) -> Vec<f64> {
    return vec![1.0, 2.0, 3.0, 4.0, 5.0, 6.0];
}
