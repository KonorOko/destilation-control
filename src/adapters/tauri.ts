import { invoke } from "@tauri-apps/api/core";

type CommandType =
  | "connect_modbus"
  | "disconnect_modbus"
  | "read_coils"
  | "read_holding_registers"
  | "write_single_coil"
  | "write_single_register"
  | "is_connected"
  | "available_ports"
  | "load_settings"
  | "save_settings";

export const invokeTauri = async <T>(
  command: CommandType,
  payload?: Record<string, unknown>,
) => {
  return await invoke<T>(command, payload);
};
