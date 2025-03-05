mod commands;
use commands::calculations::{
    cancel_column_data, pause_column_data, send_column_data, DataSource, MeasurementHistory,
};
use commands::modbus_serial::{
    available_ports, connect_modbus, disconnect_modbus, is_connected, read_coils,
    read_holding_registers, write_single_coil, write_single_register, CurrentConnection,
};
use commands::settings::{get_settings, save_settings, SettingsState};
use commands::utils::{export_data, file_path, folder_path, import_data};
use tokio::sync::Mutex;

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
            send_column_data,
            cancel_column_data,
            pause_column_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
