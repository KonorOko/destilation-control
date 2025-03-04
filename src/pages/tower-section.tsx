import { DestilationTower } from "@/components/destilation-tower";
import { Button } from "@/components/ui/button";
import { useConnect } from "@/hooks/useConnect";
import { useData } from "@/hooks/useData";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";

export function TowerSection({ className }: { className?: string }) {
  const { addPlate, removePlate, MAX_PLATES, settings } = useSettings();
  const loading = useConnect((state) => state.loading);
  const connected = useConnect((state) => state.connected);
  const connect = useConnect((state) => state.connect);
  const disconnect = useConnect((state) => state.disconnect);
  const lastData = useData((state) => state.columnData.at(-1));
  const plates = settings.numberPlates;

  const handleConnect = async () => {
    connected ? await disconnect() : await connect(settings);
  };

  return (
    <section className={cn("relative", className)}>
      <header className="absolute right-0">
        <Button
          size={"icon"}
          variant={"outline"}
          onClick={removePlate}
          className="rounded-r-none rounded-t-none border-t-0"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          size={"icon"}
          onClick={addPlate}
          variant={"outline"}
          className="rounded-b-none rounded-tl-none border-x-0 border-t-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </header>
      <DestilationTower plates={plates} />
    </section>
  );
}
