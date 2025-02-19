use rodbus::client::*;
use rodbus::DecodeLevel;
use rodbus::SerialSettings;
use rodbus::*;
use serde::Serialize;
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

#[derive(Serialize, Debug)]
pub struct RegisterResponse {
    index: u16,
    pub value: u16,
}

#[derive(Default, Clone)]
pub struct CurrentConnection {
    connection: Option<Arc<Mutex<Channel>>>,
}

impl CurrentConnection {
    fn set_connection(&mut self, channel: Channel) {
        self.connection = Some(Arc::new(Mutex::new(channel)));
    }

    fn clear_connection(&mut self) {
        self.connection = None;
    }

    pub fn is_connected(&self) -> bool {
        return self.connection.is_some();
    }
}

#[tauri::command]
pub async fn connect_modbus(
    connection: State<'_, Arc<Mutex<CurrentConnection>>>,
    port: String,
    baud_rate: u32,
) -> Result<String, String> {
    let mut current_connection = connection.lock().await;

    if current_connection.is_connected() {
        return Err("Already connected".into());
    }

    let settings = SerialSettings {
        baud_rate,
        data_bits: rodbus::DataBits::Eight,
        stop_bits: rodbus::StopBits::One,
        parity: rodbus::Parity::None,
        flow_control: rodbus::FlowControl::None,
    };

    let mut channel = client::spawn_rtu_client_task(
        &port,
        settings,
        1,
        default_retry_strategy(),
        DecodeLevel::default(),
        None,
    );

    if let Err(err) = channel.enable().await {
        return Err(format!("Failed to enable connection {:?}", err));
    }

    let params = RequestParam::new(UnitId::new(10), std::time::Duration::from_secs(1));
    for attempt in 1..=3 {
        match channel
            .read_coils(params, AddressRange::try_from(1, 1).unwrap())
            .await
        {
            Ok(_) => {
                current_connection.set_connection(channel);
                return Ok("Connected successfully".into());
            }
            Err(err) => {
                println!("Attempt {}/3 failed: {:?}", attempt, err);
                if attempt < 3 {
                    tokio::time::sleep(std::time::Duration::from_secs(1)).await
                }
            }
        }
    }

    Err("Failed to connect after 3 attempts".into())
}

#[tauri::command]
pub async fn is_connected(
    connection: State<'_, Arc<Mutex<CurrentConnection>>>,
) -> Result<String, String> {
    let current_connection = connection.lock().await;
    if current_connection.is_connected() {
        Ok("Connected".into())
    } else {
        Err("No active connection".into())
    }
}

#[tauri::command]
pub async fn disconnect_modbus(
    connection: State<'_, Arc<Mutex<CurrentConnection>>>,
) -> Result<String, String> {
    let mut current_connection = connection.lock().await;

    if current_connection.is_connected() {
        current_connection.clear_connection();
        Ok("Disconnected succesfully".into())
    } else {
        Err("No connection to disconnect".into())
    }
}

#[tauri::command]
pub async fn read_holding_registers(
    connection_state: State<'_, Arc<Mutex<CurrentConnection>>>,
    address: u16,
    count: u16,
    timeout: u64,
    unit_id: u8,
) -> Result<RegisterResponse, String> {
    let current_connection = connection_state.lock().await;

    if let Some(channel) = &current_connection.connection {
        let params = RequestParam::new(
            UnitId::new(unit_id),
            std::time::Duration::from_secs(timeout),
        );

        let mut cnx = channel.lock().await;
        match cnx
            .read_holding_registers(params, AddressRange::try_from(address, count).unwrap())
            .await
        {
            Ok(response) => {
                if let Some(first) = response.get(0) {
                    Ok(RegisterResponse {
                        index: first.index,
                        value: first.value,
                    })
                } else {
                    Err("No registers found".into())
                }
            }
            Err(err) => Err(format!("Read error: {:?}", err)),
        }
    } else {
        Err("No active connection".into())
    }
}

#[tauri::command]
pub async fn write_single_register(
    connection: State<'_, Arc<Mutex<CurrentConnection>>>,
    value: u16,
    address: u16,
    timeout: u64,
    unit_id: u8,
) -> Result<String, String> {
    let current_connection = connection.lock().await;

    if let Some(channel) = &current_connection.connection {
        let params = RequestParam::new(
            UnitId::new(unit_id),
            std::time::Duration::from_secs(timeout),
        );
        let mut cnx = channel.lock().await;
        match cnx
            .write_single_register(params, Indexed::new(address, value))
            .await
        {
            Ok(response) => Ok(format!("{:?}", response)),
            Err(err) => Err(format!("Write error: {:?}", err)),
        }
    } else {
        Err("No active connection".into())
    }
}

#[tauri::command]
pub async fn write_single_coil(
    connection: State<'_, Arc<Mutex<CurrentConnection>>>,
    value: bool,
    address: u16,
    timeout: u64,
    unit_id: u8,
) -> Result<String, String> {
    let current_connection = connection.lock().await;

    if let Some(channel) = &current_connection.connection {
        let params = RequestParam::new(
            UnitId::new(unit_id),
            std::time::Duration::from_secs(timeout),
        );

        let mut cnx = channel.lock().await;
        match cnx
            .write_single_coil(params, Indexed::new(address, value))
            .await
        {
            Ok(response) => Ok(format!("{:?}", response)),
            Err(err) => Err(format!("Write error: {:?}", err)),
        }
    } else {
        Err("No active connection".into())
    }
}

#[tauri::command]
pub async fn read_coils(
    connection: State<'_, Arc<Mutex<CurrentConnection>>>,
    address: u16,
    count: u16,
    timeout: u64,
    unit_id: u8,
) -> Result<String, String> {
    let current_connection = connection.lock().await;

    if let Some(channel) = &current_connection.connection {
        let params = RequestParam::new(
            UnitId::new(unit_id),
            std::time::Duration::from_secs(timeout),
        );

        let mut cnx = channel.lock().await;
        match cnx
            .read_coils(params, AddressRange::try_from(address, count).unwrap())
            .await
        {
            Ok(response) => Ok(format!("{:?}", response)),
            Err(err) => Err(format!("Read error: {:?}", err)),
        }
    } else {
        Err("No active connection".into())
    }
}

#[tauri::command]
pub async fn available_ports() -> Result<Vec<String>, String> {
    match serialport::available_ports() {
        Ok(ports) => {
            let port_names: Vec<String> = ports
                .into_iter()
                .filter_map(|port| match port.port_type {
                    serialport::SerialPortType::UsbPort(_) => Some(port.port_name),
                    _ => None,
                })
                .collect();
            Ok(port_names)
        }
        Err(err) => Err(format!("Failed to list serial ports: {}", err)),
    }
}
