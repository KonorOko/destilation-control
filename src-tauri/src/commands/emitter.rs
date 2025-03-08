use super::data_manager::{get_column_data, DataSource, MeasurementHistory};
use super::modbus_serial::CurrentConnection;
use super::settings::SettingsState;
use crate::commands::data_manager::ColumnEntry;
use crate::TransmissionState;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};
use tokio::sync::Mutex;
use tokio::time::Duration;

#[tauri::command]
pub async fn send_column_data(
    app_handle: AppHandle,
    settings_state: State<'_, Mutex<SettingsState>>,
    connection_state: State<'_, Mutex<CurrentConnection>>,
    measurement_history_state: State<'_, Mutex<MeasurementHistory>>,
    data_source_state: State<'_, Mutex<DataSource>>,
    transmission_state: State<'_, Mutex<TransmissionState>>,
) -> Result<(), String> {
    println!("\nInitializing send_column_data...");
    {
        // initialize transmission state
        let mut transmission_state = transmission_state.lock().await;
        transmission_state.is_running = true;
    }
    loop {
        {
            let transmission_state = transmission_state.lock().await;
            println!("\nTransmission state: {:?}", transmission_state);
            if !transmission_state.is_running {
                return Ok(());
            }
        }

        let data_entry =
            get_column_data(&settings_state, &connection_state, &data_source_state).await?;

        {
            let mut history = measurement_history_state.lock().await;
            history.history.push(data_entry.clone());
        }

        println!("Emitting data: {:?}", data_entry);
        emit_column_data(&app_handle, data_entry).await?;
        tokio::time::sleep(Duration::from_secs(1)).await;
    }
}

#[tauri::command]
pub async fn cancel_column_data(
    transmission_state: State<'_, Mutex<TransmissionState>>,
    data_source_state: State<'_, Mutex<DataSource>>,
) -> Result<(), String> {
    println!("Canceling column data");
    let mut transmission_state = transmission_state.lock().await;
    transmission_state.is_running = false;
    let mut ds = data_source_state.lock().await;

    match &mut *ds {
        DataSource::Playback { index, data } => {
            *index = 0;
            *data = Vec::new();
        }
        DataSource::Live => {}
    }
    Ok(())
}

#[tauri::command]
pub async fn pause_column_data(
    transmission_state: State<'_, Mutex<TransmissionState>>,
) -> Result<(), String> {
    println!("Pausing column data");
    let mut transmission_state = transmission_state.lock().await;
    transmission_state.is_running = false;
    Ok(())
}

async fn emit_column_data(
    app_handle: &tauri::AppHandle,
    entry: Arc<ColumnEntry>,
) -> Result<(), String> {
    app_handle
        .emit("column_data", entry)
        .map_err(|e| format!("Failed to emit data: {}", e))
}
