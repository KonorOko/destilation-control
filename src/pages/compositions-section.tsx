import { EmptyState } from "@/components/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function CompositionsSection({ className }: { className?: string }) {
  return (
    <Card className={cn(className, "h-full w-full")}>
      <CardHeader>
        <CardTitle>T vs x, y</CardTitle>
        <CardDescription>Chart of compositions</CardDescription>
      </CardHeader>
      <CardContent className="flex h-full items-center justify-center border-t">
        <EmptyState />
      </CardContent>
    </Card>
  );
}
