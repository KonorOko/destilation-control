import { invokeTauri, logger } from "@/adapters/tauri";
import { Button } from "@/components/ui/button";
import { useData } from "@/hooks/useData";
import { Pause, Play, Power, Settings, Upload } from "lucide-react";
import { ImportDialog } from "./import-dialog";
import { SettingsDialog } from "./settings-dialog";
import { Progress } from "./ui/progress";
import { StatusLed } from "./ui/status-led";

export function Header({ className }: { className?: string }) {
  const connected = useData((state) => state.connected);
  const setConnected = useData((state) => state.setConnected);

  const handleFile = async () => {
    setConnected("file");
    if (connected === "file") {
      await invokeTauri("cancel_column_data")
        .catch((error) => logger.error(`Error canceling column data: ${error}`))
        .then(() => setConnected("none"));
      return;
    }
    await invokeTauri("active_column_data")
      .then(() => setConnected("file"))
      .catch(() => setConnected("none"));
  };

  return (
    <header className={`px-4 py-2 ${className}`}>
      <div className="flex w-full items-center justify-between rounded">
        <div className="flex items-center">
          <SettingsDialog>
            <Button
              variant={"outline"}
              size={"icon"}
              className="rounded-r-none border-r-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </SettingsDialog>
          <Button variant={"outline"} className="rounded-l-none">
            <Power className="h-4 w-4" />
            Connect MODBUS
          </Button>
          <StatusLed connected={connected === "modbus"} />
        </div>

        <div className="flex items-center">
          <span className="text-xs text-muted-foreground">{0}%</span>
          <Progress value={0} className="mx-2 h-2 w-40" />
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
            <Button variant={"outline"} className="rounded-l-none">
              <Upload className="h-4 w-4" />
              Upload File
            </Button>
          </ImportDialog>
        </div>
      </div>
    </header>
  );
}
