mod commands;
use commands::calculations::{send_column_data, ColumnData};
use commands::modbus_serial::{
    available_ports, connect_modbus, disconnect_modbus, is_connected, read_coils,
    read_holding_registers, write_single_coil, write_single_register, CurrentConnection,
};
use commands::settings::{get_settings, save_settings, SettingsState};
use commands::utils::{dialog_path, export_data};
use std::sync::Arc;
use tauri::Manager;
use tokio::sync::Mutex;
use tokio::time::Duration;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let settings = Arc::new(Mutex::new(SettingsState::default()));
    let connection = Arc::new(Mutex::new(CurrentConnection::default()));
    let column_data_history = Arc::new(Mutex::new(ColumnData::default()));

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .manage(settings.clone())
        .manage(connection.clone())
        .manage(column_data_history.clone())
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
            dialog_path
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
                        if !connection.is_connected() {
                            println!("No connection active");
                            tokio::time::sleep(Duration::from_secs(1)).await;
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
                    tokio::time::sleep(Duration::from_secs(1)).await;
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
