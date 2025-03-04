import { create } from "zustand";
import { MAX_DATA_LENGTH } from "@/constants";

type ColumnDataEntry = {
  timestamp: number;
  temperatures: number[];
  compositions: number[];
};

type DataMode = "none" | "modbus" | "file";

interface DataState {
  columnData: ColumnDataEntry[];
  connected: DataMode;
  isLoading: boolean;
  filePath: string;
  fileProgress: number;
  setColumnData: (columnData: ColumnDataEntry) => void;
  setConnected: (connected: DataMode) => void;
  setLoading: (isLoading: boolean) => void;
  setFilePath: (filePath: string) => void;
  clearData: () => void;
}

export const useData = create<DataState>((set) => ({
  columnData: [],
  connected: "none",
  isLoading: false,
  filePath: "",
  fileProgress: 0,
  setColumnData: (columnData: ColumnDataEntry) => {
    set((state) => {
      let newColumnData = [...state.columnData, columnData];
      if (newColumnData.length > MAX_DATA_LENGTH + 1) {
        newColumnData = [
          newColumnData[0],
          ...newColumnData.slice(-MAX_DATA_LENGTH),
        ];
      }
      return { ...state, columnData: newColumnData };
    }, true);
  },
  setConnected: (connected: DataMode) => set(() => ({ connected })),
  setLoading: (isLoading: boolean) => set((state) => ({ ...state, isLoading })),
  setFilePath: (filePath: string) => set(() => ({ filePath })),
  setFileProgress: (fileProgress: number) => set(() => ({ fileProgress })),
  clearData: () =>
    set(() => ({ temperatures: [], connected: "none", isLoading: false })),
}));
