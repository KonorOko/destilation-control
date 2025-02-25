import { invoke } from "@tauri-apps/api/core";
import { error, info, warn, trace, debug } from "@tauri-apps/plugin-log";

type CommandType =
  | "connect_modbus"
  | "disconnect_modbus"
  | "read_coils"
  | "read_holding_registers"
  | "write_single_coil"
  | "write_single_register"
  | "is_connected"
  | "available_ports"
  | "save_settings"
  | "get_settings"
  | "export_data"
  | "dialog_path";

export const invokeTauri = async <T>(
  command: CommandType,
  payload?: Record<string, unknown>,
) => {
  return await invoke<T>(command, payload);
};

export const logger = {
  error,
  info,
  warn,
  trace,
  debug,
};
