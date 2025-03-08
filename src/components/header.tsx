import { invokeTauri, logger } from "@/adapters/tauri";
import { Button } from "@/components/ui/button";
import { useData } from "@/hooks/useData";
import { Pause, Play, Power, Save, Settings } from "lucide-react";
import { toast } from "sonner";
import { ExportDialog } from "./export-dialog";
import { ImportDialog } from "./import-dialog";
import { SettingsDialog } from "./settings-dialog";
import { Progress } from "./ui/progress";
import { StatusLed } from "./ui/status-led";

export function Header({ className }: { className?: string }) {
  const connected = useData((state) => state.connected);
  const setConnected = useData((state) => state.setConnected);
  const percentageComplete = useData((state) => state.fileProgress);
  const clearData = useData((state) => state.clearData);

  const handleFile = async () => {
    if (percentageComplete === 100) return;
    if (connected === "file") {
      await invokeTauri("pause_column_data")
        .then(() => setConnected("paused"))
        .catch((error) => {
          logger.error(`Error canceling column data: ${error}`);
          setConnected("none");
        });
      return;
    }
    setConnected("file");
    await invokeTauri("send_column_data").catch(() => setConnected("none"));
  };

  const handleConnection = async () => {
    if (connected === "modbus") {
      await invokeTauri("disconnect_modbus")
        .then(() => {
          setConnected("none");
          clearData();
        })
        .catch((error) => {
          logger.error(`Error disconnecting from MODBUS: ${error}`);
          setConnected("modbus");
        });
      return;
    }
    try {
      toast.promise(
        invokeTauri("connect_modbus").then(() => {
          setConnected("modbus");
          invokeTauri("send_column_data");
        }),
        {
          loading: "Connecting to MODBUS...",
          success: "Connected to MODBUS",
          error: "Error connecting to MODBUS",
        },
      );
    } catch (error) {
      logger.error(`Error connecting to MODBUS: ${error}`);
      setConnected("none");
    }
  };

  return (
    <header
      className={`flex flex-col items-center justify-center px-3 py-2 ${className}`}
    >
      <div className="flex w-full items-start justify-between rounded">
        <div className="flex items-center">
          <SettingsDialog>
            <Button
              variant={"outline"}
              size={"icon"}
              className="rounded-r-none"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </SettingsDialog>
          <Button
            variant={"outline"}
            className="rounded-none border-x-0"
            onClick={handleConnection}
          >
            <Power className="h-4 w-4" />
            Connect MODBUS
          </Button>
          <ExportDialog>
            <Button variant={"outline"} className="rounded-l-none">
              <Save className="h-4 w-4" />
              Save
            </Button>
          </ExportDialog>
          <StatusLed connected={connected === "modbus"} className="ml-4" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center">
            <span className="text-xs text-muted-foreground">
              {percentageComplete.toFixed(2)}%
            </span>
            <Progress value={percentageComplete} className="mx-2 h-2 w-40" />
            <Button
              variant="outline"
              size="icon"
              onClick={handleFile}
              className="rounded-r-none"
            >
              {connected === "file" ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <ImportDialog>
              <Button
                variant={"outline"}
                className="relative rounded-l-none border-l-0"
              >
                Excel File
                {(connected === "file" || connected === "paused") && (
                  <StatusLed
                    connected={connected === "file"}
                    className="absolute right-0 top-0 -mr-1 -mt-1"
                  />
                )}
              </Button>
            </ImportDialog>
          </div>
        </div>
      </div>
    </header>
  );
}
