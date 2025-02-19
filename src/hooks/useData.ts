import { create } from "zustand";

type ColumnDataEntry = {
  timestamp: number;
  temperatures: number[];
  compositions: number[];
};

interface DataState {
  columnData: ColumnDataEntry[];
  connected: boolean;
  isLoading: boolean;
  setColumnData: (columnData: ColumnDataEntry[]) => void;
  setConnected: (connected: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  clearData: () => void;
}

export const useData = create<DataState>((set) => ({
  columnData: [{ timestamp: 0, temperatures: [], compositions: [] }],
  connected: false,
  isLoading: false,
  setColumnData: (columnData: ColumnDataEntry[]) => {
    set(() => ({ columnData }));
  },
  setConnected: (connected: boolean) => set(() => ({ connected })),
  setLoading: (isLoading: boolean) => set((state) => ({ ...state, isLoading })),
  clearData: () =>
    set(() => ({ temperatures: [], connected: false, isLoading: false })),
}));
