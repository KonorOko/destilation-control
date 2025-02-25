export type SettingsType = {
  usbPort: string;
  baudrate: number;
  temperatureAddress: {
    top: number;
    bottom: number;
  };
  count: number;
  timeout: number;
  unitId: number;
  numberPlates: number;
};

export type SettingsContextType = {
  settings: SettingsType;
  setSettings: React.Dispatch<React.SetStateAction<SettingsType>>;
};

export type RegisterResponseType = {
  index: number;
  value: number;
};
