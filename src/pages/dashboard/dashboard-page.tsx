import { useData } from "@/hooks/useData";
import { listen } from "@tauri-apps/api/event";
import { TemperaturesSection } from "./temperatures-section";
import { TowerSection } from "./tower-section";

type ColumnDataEntry = {
  timestamp: number;
  temperatures: number[];
  compositions: number[];
};
type ColumnData = {
  history: ColumnDataEntry[];
};

export function DashboardPage() {
  const setColumnData = useData((state) => state.setColumnData);

  listen<ColumnData>("column_data", (event) => {
    setColumnData(event.payload.history);
  });

  return (
    <div className="grid w-full grid-cols-3 grid-rows-2 gap-2">
      <TowerSection />
      <section className="col-span-2 grid grid-cols-2 gap-2">
        <TemperaturesSection />
        <section className="rounded-lg border bg-slate-100 shadow-inner"></section>
      </section>
      <section className="col-span-2 rounded-lg border bg-slate-100 shadow-inner"></section>
    </div>
  );
}
