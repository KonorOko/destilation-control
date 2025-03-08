import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useData } from "@/hooks/useData";
import { ColumnDataType } from "@/pages/dashboard-page";
import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Label, Line, LineChart, XAxis, YAxis } from "recharts";
import { EmptyState } from "./empty-state";

const chartDataEmpty: Record<string, string | undefined>[] = [
  {
    time: undefined,
  },
];

export function CompositionsChart() {
  const [chartData, setChartData] = useState(chartDataEmpty);
  const columnData = useData((state) => state.columnData);
  const connected = useData((state) => state.connected);

  const formatData = (_columnData: ColumnDataType[]) => {
    return [];
  };

  const columnDataFormatted = useMemo(
    () => formatData(columnData),
    [columnData],
  );

  const plateKeys = useMemo(() => {
    if (columnDataFormatted.length === 0) return [];
    return Object.keys(columnDataFormatted[0]).filter((key) => key !== "time");
  }, [columnDataFormatted]);

  const chartConfig = Object.fromEntries(
    plateKeys.map((key, index) => [
      key,
      {
        label: `Plate ${key.slice(-1)}`,
        color: `hsl(220, 100%, ${40 + index * 10}%)`,
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
          labelFormatter={(label) => `Time: ${label} min`}
          content={
            <ChartTooltipContent
              className="bg-background/80"
              formatter={(value, name) => (
                <>
                  <div
                    className="h-2.5 w-1 shrink-0 rounded-[2px] bg-[--color-bg]"
                    style={
                      {
                        "--color-bg": `var(--color-${name})`,
                      } as React.CSSProperties
                    }
                  />
                  <div className="flex min-w-[110px] items-center text-xs text-muted-foreground">
                    {chartConfig[name as keyof typeof chartConfig]?.label ||
                      name}
                    <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                      {(value as number).toFixed(2)}
                      <span className="font-normal text-muted-foreground">
                        °C
                      </span>
                    </div>
                  </div>
                </>
              )}
            />
          }
        />
        {plateKeys.map((key) => (
          <Line
            dataKey={key}
            stroke={`var(--color-${key})`}
            strokeWidth={2}
            isAnimationActive={false}
            dot={false}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}
