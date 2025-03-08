import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TemperaturesChart } from "../components/temperatures-chart";

export function TemperaturesSection({ className }: { className?: string }) {
  return (
    <Card className={cn(className, "h-full w-full")}>
      <CardHeader>
        <CardTitle>Temperatures</CardTitle>
        <CardDescription>Chart of temperatures per plate</CardDescription>
      </CardHeader>
      <CardContent className="border-t py-10">
        <TemperaturesChart />
      </CardContent>
    </Card>
  );
}
