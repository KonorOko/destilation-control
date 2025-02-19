import { SettingsType } from "./types";

export const SETTINGS_FILE = "settings.json";

export const DEFAULT_SETTINGS: SettingsType = {
  temperatureAddress: {
    t1: 100,
    t2: 101,
  },
  usbPort: "",
  baudRate: 9600,
  unitId: 10,
};
