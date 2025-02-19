import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Info } from "lucide-react";
import { TemperaturesChart } from "./temperatures-chart";

export function TemperaturesSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Temperature Readings</CardTitle>
        <CardDescription>
          Temperature variations per plate over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TemperaturesChart />
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              Important Notes <Info className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              Edge temperature are measured; others are interpolated.
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
