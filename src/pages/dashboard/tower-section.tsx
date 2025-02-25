import { ExportDialog } from "@/components/export-dialog";
import { SettingsDialog } from "@/components/settings-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useConnect } from "@/hooks/useConnect";
import { useData } from "@/hooks/useData";
import { useSettings } from "@/hooks/useSettings";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { DestilationPlate } from "./destilation-plate";

export function TowerSection() {
  const { addPlate, removePlate, MAX_PLATES, settings } = useSettings();
  const [disableButton, setDisableButton] = useState(false);
  const loading = useConnect((state) => state.loading);
  const connected = useConnect((state) => state.connected);
  const connect = useConnect((state) => state.connect);
  const disconnect = useConnect((state) => state.disconnect);
  const lastData = useData((state) => state.columnData.at(-1));
  const plates = settings.numberPlates;

  useEffect(() => {
    if (plates === 1 || plates === MAX_PLATES) return;
    setDisableButton(true);
    const timer = setTimeout(() => {
      setDisableButton(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [settings]);

  const handleConnect = async () => {
    connected ? await disconnect() : await connect(settings);
  };

  return (
    <section className="row-span-2 flex flex-col items-center rounded-lg border">
      <header className="flex h-10 w-full items-center justify-between rounded-t-lg bg-slate-100 px-1">
        <div>
          <SettingsDialog>
            <Button size="icon" variant={"outline"}>
              <Settings className="h-6 w-6" />
            </Button>
          </SettingsDialog>
          <Button size="icon" variant={"outline"} className="invisible">
            <Settings className="h-6 w-6" />
          </Button>
        </div>
        {connected ? (
          <Badge
            variant="outline"
            className="cursor-default select-none bg-green-500 text-white"
          >
            Online
          </Badge>
        ) : (
          <Badge variant="outline" className="cursor-default select-none">
            Offline
          </Badge>
        )}
        <div className="flex items-center justify-center">
          <Button
            size="icon"
            variant={"outline"}
            onClick={removePlate}
            disabled={disableButton || plates === 1}
          >
            <Minus className="h-6 w-6" />
          </Button>
          <Button
            size="icon"
            variant={"outline"}
            onClick={addPlate}
            disabled={disableButton || plates === MAX_PLATES}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </header>
      <motion.div className="flex flex-1 flex-col items-center justify-center gap-1">
        <AnimatePresence initial={false}>
          {[...Array(plates)].map((_, index) => (
            <motion.div
              key={plates - index}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.3, transition: { duration: 0.2 } }}
              transition={{
                opacity: { duration: 0.2 },
                layout: { type: "spring", stiffness: 300, damping: 30 },
                duration: 0.3,
              }}
              className="relative"
            >
              {index === 0 && (
                <NumberFlow
                  value={lastData?.temperatures.at(-1) || 0}
                  suffix="°C"
                  format={{
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  }}
                  className="absolute right-0 top-0 -mr-14 w-10 cursor-default text-right text-xs text-gray-500"
                />
              )}
              {index === plates - 1 && (
                <NumberFlow
                  value={lastData?.temperatures[0] || 0}
                  suffix="°C"
                  format={{
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  }}
                  className="absolute bottom-0 right-0 -mr-14 w-10 cursor-default text-right text-xs text-gray-500"
                />
              )}
              <DestilationPlate />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      <footer className="flex h-10 w-full items-center justify-between rounded-b-lg bg-slate-100 px-1">
        <div>
          <Button
            variant={"outline"}
            onClick={handleConnect}
            disabled={loading}
          >
            {connected ? "Disconnect" : "Connect"}
          </Button>
        </div>
        <div className="flex items-center justify-center">
          <ExportDialog>
            <Button variant={"outline"} className="rounded-r-none">
              {connected ? "Save file" : "Select file"}
            </Button>
          </ExportDialog>
        </div>
      </footer>
    </section>
  );
}
