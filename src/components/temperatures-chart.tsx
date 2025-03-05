import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { MAX_DATA_LENGTH } from "@/constants";
import { useData } from "@/hooks/useData";
import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Label, Line, LineChart, XAxis, YAxis } from "recharts";
import { EmptyState } from "./empty-state";

const chartDataEmpty: Record<string, string | undefined>[] = [
  {
    time: undefined,
  },
];

export function TemperaturesChart() {
  const [chartData, setChartData] = useState(chartDataEmpty);
  const columnData = useData((state) => state.columnData);
  const connected = useData((state) => state.connected);
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

  useEffect(() => {
    setChartData(columnDataFormatted);
  }, [columnDataFormatted]);

  if (connected === "none") {
    return <EmptyState />;
  }

  return (
    <ChartContainer config={chartConfig} className="w-full">
      <LineChart
        accessibilityLayer
        data={chartData}
        margin={{
          left: 20,
          right: 15,
          bottom: 40,
        }}
      >
        <CartesianGrid vertical={false} />
        <YAxis
          domain={[15, 80]}
          tickLine={false}
          tick={true}
          tickMargin={0}
          axisLine={false}
          width={1}
          hide
        />
        <XAxis
          dataKey="time"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          interval={"equidistantPreserveStart"}
          minTickGap={15}
          label={
            <Label
              value={"Time (min)"}
              position={"insideBottom"}
              offset={-19}
            />
          }
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
