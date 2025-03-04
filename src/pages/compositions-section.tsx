import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartSpline, Info } from "lucide-react";

export function CompositionsSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Composition Readings</CardTitle>
        <CardDescription>Composition per plate</CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState />
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              Important Notes <Info className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              Calculated considering ambiental pressure.
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex aspect-video h-full w-full flex-col items-center justify-center space-y-1">
      <ChartSpline className="font size-20 stroke-[0.5] text-slate-400" />
      <div className="flex flex-col items-center justify-center">
        <p className="text-sm font-medium text-slate-700">No data found</p>
        <p className="text-xs text-slate-500">Try to connect usb port</p>
      </div>
    </div>
  );
}
