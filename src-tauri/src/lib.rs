mod commands;
use commands::calculations::{
    active_column_data, cancel_column_data, send_column_data, DataSource, MeasurementHistory,
};
use commands::modbus_serial::{
    available_ports, connect_modbus, disconnect_modbus, is_connected, read_coils,
    read_holding_registers, write_single_coil, write_single_register, CurrentConnection,
};
use commands::settings::{get_settings, save_settings, SettingsState};
use commands::utils::{export_data, file_path, folder_path, import_data};
use tauri::Manager;
use tokio::sync::Mutex;
use tokio::time::Duration;

#[derive(Debug)]
pub struct TransmissionState {
    pub is_running: bool,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let settings = Mutex::new(SettingsState::default());
    let connection = Mutex::new(CurrentConnection::default());
    let measurement_history = Mutex::new(MeasurementHistory::default());
    let data_source = Mutex::new(DataSource::Live);
    let transmission_state = Mutex::new(TransmissionState { is_running: false });

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .manage(settings)
        .manage(connection)
        .manage(measurement_history)
        .manage(data_source)
        .manage(transmission_state)
        .invoke_handler(tauri::generate_handler![
            connect_modbus,
            disconnect_modbus,
            read_coils,
            read_holding_registers,
            write_single_coil,
            write_single_register,
            is_connected,
            available_ports,
            get_settings,
            save_settings,
            export_data,
            import_data,
            folder_path,
            file_path,
            active_column_data,
            cancel_column_data,
        ])
        .setup(|app| {
            let app_handle = app.handle().clone();
            let settings_handle = app.handle().clone();
            let connection_handle = app.handle().clone();
            let data_source_handle = app.handle().clone();
            let measurement_handle = app.handle().clone();
            let transmission_state = app.handle().clone();

            tokio::spawn(async move {
                let settings_state = settings_handle.state::<Mutex<SettingsState>>().clone();
                let connection_state = connection_handle
                    .state::<Mutex<CurrentConnection>>()
                    .clone();
                let data_source_state = data_source_handle.state::<Mutex<DataSource>>().clone();
                let measurement_state = measurement_handle
                    .state::<Mutex<MeasurementHistory>>()
                    .clone();
                let transmission_state = transmission_state
                    .state::<Mutex<TransmissionState>>()
                    .clone();

                loop {
                    {
                        let transmission_state = transmission_state.lock().await;
                        println!("Transmission state: {:?}", transmission_state);
                        if !transmission_state.is_running {
                            tokio::time::sleep(Duration::from_secs(1)).await;
                            continue;
                        }
                    }

                    let result = send_column_data(
                        app_handle.clone(),
                        settings_state.clone(),
                        connection_state.clone(),
                        measurement_state.clone(),
                        data_source_state.clone(),
                    )
                    .await;

                    if let Err(err) = result {
                        println!("Error sending column data: {}", err);
                    }

                    tokio::time::sleep(Duration::from_secs(1)).await;
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
