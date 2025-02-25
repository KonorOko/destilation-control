use super::calculations::ColumnData;
use rust_xlsxwriter::*;
use std::sync::Arc;
use tauri::{AppHandle, State};
use tauri_plugin_dialog::DialogExt;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn export_data(
    column_data_state: State<'_, Arc<Mutex<ColumnData>>>,
    path: String,
) -> Result<(), String> {
    println!("Export data to excel...");
    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();

    let column_data = {
        let data_column = column_data_state.lock().await;
        data_column.history.clone()
    };

    println!("Writing headers...");
    worksheet
        .write(0, 0, "Timestamp")
        .map_err(|e: XlsxError| format!("Xlsx error: {}", e))?;

    let Some(first) = column_data.first() else {
        return Err("No current data".into());
    };

    let num_values = first.temperatures.len();
    for i in 0..num_values {
        worksheet
            .write(0, (i + 1) as u16, format!("Temperature {}", i + 1))
            .map_err(|e: XlsxError| format!("Xlsx error: {}", e))?;
    }

    for i in 0..num_values {
        worksheet
            .write(
                0,
                (num_values + i + 1) as u16,
                format!("Composition {}", i + 1),
            )
            .map_err(|e: XlsxError| format!("Xlsx error: {}", e))?;
    }

    println!("Writing data");
    for (row, value) in column_data.iter().enumerate() {
        let row = (row + 1) as u32;
        worksheet
            .write(row, 0, value.timestamp)
            .map_err(|e: XlsxError| format!("Xlsx error: {}", e))?;

        for (i, &temp) in value.temperatures.iter().enumerate() {
            worksheet
                .write(row, (i + 1) as u16, temp)
                .map_err(|e: XlsxError| format!("Xlsx error: {}", e))?;
        }
        for (i, &comp) in value.compositions.iter().enumerate() {
            worksheet
                .write(row, (num_values + i + 1) as u16, comp)
                .map_err(|e: XlsxError| format!("Xlsx error: {}", e))?;
        }
    }

    println!("Saving excel...");
    workbook
        .save(path)
        .map_err(|e: XlsxError| format!("Xlsx error: {}", e))?;
    println!("Excel saved");

    Ok(())
}

#[tauri::command]
pub async fn dialog_path(app: AppHandle) -> String {
    let file_path = app.dialog().file().blocking_pick_folder();
    if let Some(file_path) = file_path {
        return file_path.to_string();
    }
    return "".into();
}
