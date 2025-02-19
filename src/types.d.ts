export type SettingsType = {
  temperatureAddress: {
    t1: number;
    t2: number;
  };
  usbPort: string;
  baudRate: number;
  unitId: number;
};

export type SettingsContextType = {
  settings: SettingsType;
  setSettings: React.Dispatch<React.SetStateAction<SettingsType>>;
};

export type RegisterResponseType = {
  index: number;
  value: number;
};
