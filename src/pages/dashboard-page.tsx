import { Header } from "@/components/header";
import { useData } from "@/hooks/useData";
import { ColumnDef } from "@tanstack/react-table";
import { listen } from "@tauri-apps/api/event";
import { useEffect } from "react";
import { TemperaturesSection } from "./temperatures-section";
import { TowerSection } from "./tower-section";

type ColumnDataEntry = {
  timestamp: number;
  temperatures: number[];
  compositions: number[];
};

export type ColumnDataType = {
  timestamp: number;
  temperatures: Array<number>;
  compositions: Array<number>;
};

export function DashboardPage() {
  const setColumnData = useData((state) => state.setColumnData);

  useEffect(() => {
    const unlisten = listen<ColumnDataEntry>("column_data", (event) => {
      console.log("EVENT:", event.payload);
      setColumnData(event.payload);
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  return (
    <div className="flex w-full flex-col gap-1">
      <Header className="rounded border" />
      <div className="grid h-full w-full grid-cols-6 grid-rows-6 gap-1">
        <TowerSection className="col-span-2 row-span-6 rounded border" />
        <TemperaturesSection className="col-span-4 col-start-3 row-span-3 rounded border" />
        <div className="col-span-2 col-start-3 row-span-3 row-start-4 rounded border"></div>
        <div className="col-span-2 col-start-5 row-span-3 row-start-4 rounded border"></div>
      </div>
    </div>
  );
}
/*
<div className="grid w-full grid-cols-3 grid-rows-1 gap-1">
      <TowerSection />
      <section className="col-span-2 flex flex-col gap-1">
        <section className="h-1/6 w-full rounded border"></section>
        <section className="h-5/6 w-full rounded border"></section>
        <TemperaturesSection />
        <CompositionsSection />
      </section>
      <section className="col-span-2">
        <DataTable data={data} columns={columns} />
      </section>
    </div>
*/
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
