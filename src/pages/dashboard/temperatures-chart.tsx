import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useData } from "@/hooks/useData";
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
  const columnDataFormatted = useMemo(
    () =>
      columnData.map((entry) => {
        const initialDate = columnData[0]?.timestamp;
        if (!initialDate) {
          return { time: undefined };
        }
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
      }),
    [columnData],
  );

  const plateKeys = useMemo(
    () => Object.keys(columnDataFormatted[0]).filter((key) => key !== "time"),
    [columnDataFormatted],
  );
  const chartConfig = Object.fromEntries(
    plateKeys.map((key) => [
      key,
      {
        label: `Plate ${key.slice(-1)}`,
      },
    ]),
  );

  useEffect(() => {
    setChartData(columnDataFormatted);
  }, [columnDataFormatted]);

  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
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
