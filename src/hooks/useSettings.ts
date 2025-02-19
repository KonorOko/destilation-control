import { writeTextFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import { SETTINGS_FILE, DEFAULT_SETTINGS } from "@/constants";
import { useContext } from "react";
import { SettingsContext } from "@/contexts/settings-context";
import { invokeTauri } from "@/adapters/tauri";
import { SettingsType } from "@/types";

export function useSettings() {
  const { settings, setSettings } = useContext(SettingsContext);

  const setUsbPort = (port: string) => {
    setSettings((settings) => ({ ...settings, usbPort: port }));
  };

  const setBaudrate = (baud: number) => {
    setSettings((settings) => ({ ...settings, baudrate: baud }));
  };

  const setTopAddress = (address: number) => {
    setSettings((settings) => ({
      ...settings,
      temperatureAddress: {
        ...settings.temperatureAddress,
        top: address,
      },
    }));
  };

  const setBottomAddress = (address: number) => {
    setSettings((settings) => ({
      ...settings,
      temperatureAddress: {
        ...settings.temperatureAddress,
        bottom: address,
      },
    }));
  };

  const setTheme = (theme: string) => {
    setSettings((settings) => ({ ...settings, theme }));
  };

  const loadSettings = async () => {
    try {
      // const settings = await invokeTauri<SettingsType>("load_settings");
      console.log(settings);
      setSettings(settings);
    } catch (error) {
      console.error("Error loading settings: ", error);
      setSettings(DEFAULT_SETTINGS);
    }
  };

  const getSettings = async () => {
    try {
      const settings = await invokeTauri<SettingsType>("load_settings");
      console.log("Settings getted: ", settings);
    } catch (error) {
      console.error("Error loading settings: ", error);
    }
  };

  const saveSettings = async () => {
    try {
      await writeTextFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), {
        baseDir: BaseDirectory.AppConfig,
      });
    } catch (error) {
      console.error("Error saving settings: ", error);
    }
  };

  return {
    settings,
    getSettings,
    setUsbPort,
    setBaudrate,
    setTheme,
    loadSettings,
    saveSettings,
    setTopAddress,
    setBottomAddress,
  };
}
