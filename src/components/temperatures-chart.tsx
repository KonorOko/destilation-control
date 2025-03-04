import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { MAX_DATA_LENGTH } from "@/constants";
import { useData } from "@/hooks/useData";
import { ChartSpline } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

const chartDataEmpty: Record<string, string | undefined>[] = [
  {
    time: undefined,
  },
];

export function TemperaturesChart() {
  const [chartData, setChartData] = useState(chartDataEmpty);
  const columnData = useData((state) => state.columnData);
  const columnDataFormatted = useMemo(() => {
    if (!columnData || columnData.length === 0) return [];
    const initialDate = columnData[0]?.timestamp;
    if (!initialDate) return [];
    return columnData.slice(-MAX_DATA_LENGTH).map((entry) => {
      const transcurredTime = entry.timestamp - initialDate;
      const minutes = Math.floor(transcurredTime / 60);
      const seconds = Math.floor(transcurredTime % 60);
      return {
        time: `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
        ...entry.temperatures.reduce<Record<string, number>>(
          (acc, temp, index) => {
            acc[`plate${index + 1}`] = temp;
            return acc;
          },
          {},
        ),
      };
    });
  }, [columnData]);

  const plateKeys = useMemo(() => {
    if (columnDataFormatted.length === 0) return [];
    return Object.keys(columnDataFormatted[0]).filter((key) => key !== "time");
  }, [columnDataFormatted]);
  const chartConfig = Object.fromEntries(
    plateKeys.map((key) => [
      key,
      {
        label: `Plate ${key.slice(-1)}`,
      },
    ]),
  );

  const tickFormatter = useMemo(
    () => (value: string) => {
      if (value.endsWith("00") || value.endsWith("30")) {
        return value;
      }
      return "";
    },
    [],
  );

  useEffect(() => {
    setChartData(columnDataFormatted);
  }, [columnDataFormatted]);

  if (chartData.length === 0 || chartData == undefined) {
    return <EmptyState />;
  }

  return (
    <ChartContainer config={chartConfig} className="aspect-video h-full w-full">
      <LineChart
        accessibilityLayer
        data={chartData}
        margin={{
          left: 20,
          right: 20,
        }}
      >
        <CartesianGrid vertical={false} />
        <YAxis domain={[15, 40]} hide />
        <XAxis
          dataKey="time"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval={0}
          tickFormatter={tickFormatter}
        />
        <ChartTooltip
          cursor={false}
          isAnimationActive={false}
          labelFormatter={(label) => `Time: ${label} `}
          content={<ChartTooltipContent />}
        />
        {plateKeys.map((key, index) => (
          <Line
            dataKey={key}
            type="monotone"
            stroke={`hsl(220, 100%, ${40 + index * 10}%)`}
            strokeWidth={2}
            isAnimationActive={false}
            dot={false}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center space-y-1">
      <ChartSpline className="font size-20 stroke-[0.5] text-slate-400" />
      <div className="flex flex-col items-center justify-center">
        <p className="text-sm font-medium text-slate-700">No data found</p>
        <p className="text-xs text-slate-500">Try to connect usb port</p>
      </div>
    </div>
  );
}
