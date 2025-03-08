import { Header } from "@/components/header";
import { useData } from "@/hooks/useData";
import { ColumnDef } from "@tanstack/react-table";
import { listen } from "@tauri-apps/api/event";
import { useEffect } from "react";
import { toast } from "sonner";
import { CompositionsSection } from "./compositions-section";
import { TemperaturesSection } from "./temperatures-section";
import { TowerSection } from "./tower-section";

type ColumnDataEntry = {
  timestamp: number;
  temperatures: number[];
  compositions: number[];
  percentageComplete: number;
};

export type ColumnDataType = {
  timestamp: number;
  temperatures: Array<number>;
  compositions: Array<number>;
  percentageComplete: number;
};

export function DashboardPage() {
  const setColumnData = useData((state) => state.setColumnData);
  const setConnected = useData((state) => state.setConnected);

  useEffect(() => {
    const unlisten = listen<ColumnDataEntry>("column_data", (event) => {
      const handleListen = async () => {
        if (event.payload.percentageComplete === 100) {
          setConnected("paused");
          toast.success("Playback complete!");
        }
        setColumnData(event.payload);
      };

      handleListen();
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  return (
    <div className="grid h-screen w-full grid-cols-6 grid-rows-11 gap-1 p-1">
      <Header className="col-span-6 row-span-1 rounded border" />
      <TowerSection className="col-span-2 row-span-10 row-start-2 rounded border" />
      <TemperaturesSection className="col-span-2 col-start-3 row-span-5 row-start-2 rounded shadow-none" />
      <CompositionsSection className="col-span-2 col-start-5 row-span-5 row-start-2 rounded shadow-none" />
      <div className="col-span-2 col-start-3 row-span-5 row-start-7 rounded border"></div>
      <div className="col-span-2 col-start-5 row-span-5 row-start-7 rounded border"></div>
    </div>
  );
}

export const columns: ColumnDef<ColumnDataType>[] = [
  {
    accessorKey: "timestamp",
    header: "Time",
  },
  {
    accessorKey: "temperatures",
    header: "Temperature",
  },
  {
    accessorKey: "compositions",
    header: "Composition",
  },
];
