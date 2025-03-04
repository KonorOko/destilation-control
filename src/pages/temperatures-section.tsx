import { cn } from "@/lib/utils";
import { TemperaturesChart } from "../components/temperatures-chart";

export function TemperaturesSection({ className }: { className?: string }) {
  return (
    <section className={cn("w-3/5", className)}>
      <TemperaturesChart />
    </section>
  );
}
