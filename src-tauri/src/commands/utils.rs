use super::calculations::{ColumnEntry, DataSource, MeasurementHistory};
use calamine::{open_workbook, DataType, Reader, Xlsx};
use rust_xlsxwriter::{Workbook, XlsxError};
use std::sync::Arc;
use tauri::{AppHandle, State};
use tauri_plugin_dialog::DialogExt;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn import_data(
    data_source_state: State<'_, Mutex<DataSource>>,
    path: String,
) -> Result<(), ()> {
    let mut imported_data: Vec<Arc<ColumnEntry>> = Vec::new();
    let mut workbook: Xlsx<_> = open_workbook(path).unwrap();
    let worksheet_name = workbook
        .sheet_names()
        .first()
        .cloned()
        .ok_or("Not valid sheets")
        .unwrap();
    let range = workbook
        .worksheet_range(&worksheet_name)
        .map_err(|_| "Can't read sheet")
        .unwrap();

    for row in range.rows().skip(1) {
        if row.is_empty() {
            continue;
        }
        if row.len() < 3 {
            continue;
        }

        let timestamp = if let Some(ts) = row.get(0).and_then(|cell| cell.as_f64()) {
            ts as u64
        } else {
            continue;
        };

        let values_lenght = (row.len() - 1) / 2;

        let temperatures: Vec<f64> = row
            .iter()
            .skip(1)
            .take(values_lenght)
            .filter_map(|cell| cell.as_f64())
            .collect();

        let compositions: Vec<f64> = row
            .iter()
            .skip(1 + values_lenght)
            .filter_map(|cell| cell.as_f64())
            .collect();

        println!("Timestamp {}", timestamp);
        println!("Temperatures {:?}", temperatures);
        println!("Compositions {:?}", compositions);
        imported_data.push(Arc::new(ColumnEntry {
            timestamp,
            temperatures,
            compositions,
        }));
    }
    {
        let mut ds = data_source_state.lock().await;
        *ds = DataSource::Playback {
            index: 0,
            data: imported_data,
        };
    }
    Ok(())
}

#[tauri::command]
pub async fn export_data(
    column_data_state: State<'_, Mutex<MeasurementHistory>>,
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
pub async fn folder_path(app: AppHandle) -> String {
    let file_path = app.dialog().file().blocking_pick_folder();
    if let Some(file_path) = file_path {
        return file_path.to_string();
    }
    return "".into();
}

#[tauri::command]
pub async fn file_path(app: AppHandle) -> String {
    let file_path = app
        .dialog()
        .file()
        .add_filter("My filert", &["xlsx"])
        .blocking_pick_file();
    if let Some(file_path) = file_path {
        return file_path.to_string();
    }
    return "".into();
}
