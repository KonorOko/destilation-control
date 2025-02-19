import { SettingsContextType, SettingsType } from "@/types";
import { createContext, useState } from "react";

export const SettingsContext = createContext<SettingsContextType>(
  {} as SettingsContextType,
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SettingsType>({
    temperatureAddress: {
      t1: 100,
      t2: 101,
    },
    usbPort: "",
    baudRate: 9600,
    unitId: 1,
  });
  return (
    <SettingsContext.Provider
      value={{
        settings,
        setSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}
