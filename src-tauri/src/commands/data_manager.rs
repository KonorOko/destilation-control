use serde::Serialize;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::State;
use tokio::sync::Mutex;

use crate::commands::calculations::{
    calculate_composition, interpolate_temperatures, read_temperatures,
};

use super::modbus_serial::CurrentConnection;
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
#[serde(rename_all = "camelCase")]
pub struct ColumnEntry {
    pub timestamp: u64,
    pub temperatures: Vec<f64>,
    pub compositions: Vec<f64>,
    pub percentage_complete: f64,
}

#[derive(Default, Clone, Serialize)]
pub struct MeasurementHistory {
    pub history: Vec<Arc<ColumnEntry>>,
}

pub async fn get_column_data(
    settings_state: &State<'_, Mutex<SettingsState>>,
    connection_state: &State<'_, Mutex<CurrentConnection>>,
    data_source_state: &State<'_, Mutex<DataSource>>,
) -> Result<Arc<ColumnEntry>, String> {
    let mut ds = data_source_state.lock().await;

    match &mut *ds {
        DataSource::Playback { index, data } => {
            if let Some(entry) = data.get(*index as usize) {
                *index += 1;
                Ok(entry.clone())
            } else {
                Err("No more playback data available".into())
            }
        }
        DataSource::Live => {
            // fetch temperatures
            let temperatures = read_temperatures(settings_state, connection_state.clone())
                .await
                .map_err(|e| format!("Failed to read temperatures: {:?}", e))?;

            // fetch settings
            let settings = {
                let settings_guard = settings_state.lock().await;
                settings_guard.settings.clone()
            }
            .ok_or("No settings found".to_string())?;

            // interpolate temperatures
            let number_plates = settings.number_plates;
            let interpolate_temps =
                interpolate_temperatures(number_plates, temperatures[0], temperatures[1]);

            // calculate compositions
            let mut compositions: Vec<f64> = Vec::with_capacity(number_plates);
            let x_0 = 0.5;
            let tol = 1e-6;
            let max_iter = 1000;

            for (i, &temp) in interpolate_temps.iter().enumerate() {
                let composition =
                    calculate_composition(x_0, temp, tol, max_iter).unwrap_or_else(|e| {
                        eprintln!("Error calculating composition at index {}: {}", i, e);
                        if i == 0 {
                            0.0
                        } else {
                            compositions[i - 1]
                        }
                    });

                compositions.push(composition);
            }

            println!("Settings: {:?}", settings);
            println!("Temperatures: {:?}", temperatures);
            println!("Interpolated temperatures: {:?}", interpolate_temps);
            println!("Compositions: {:?}", compositions);

            let new_entry = ColumnEntry {
                timestamp: SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
                temperatures: interpolate_temps,
                compositions,
                percentage_complete: 0.0,
            };

            Ok(Arc::new(new_entry))
        }
    }
}
