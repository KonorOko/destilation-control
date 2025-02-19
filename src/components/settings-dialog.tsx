import { invokeTauri } from "@/adapters/tauri";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettings } from "@/hooks/useSettings";
import { useEffect, useState } from "react";

export function SettingsDialog({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const [usbPorts, setUsbPorts] = useState<string[]>([]);
  const [newSettings, setNewSettings] = useState({
    ...settings,
  });

  const handleUsbPort = (event: string) => {};

  const handleBaudrate = (event: React.ChangeEvent<HTMLInputElement>) => {};

  const handleFlowAddress = (event: React.ChangeEvent<HTMLInputElement>) => {};

  const handleValveAddress = (event: React.ChangeEvent<HTMLInputElement>) => {};

  useEffect(() => {
    invokeTauri<string[]>("available_ports").then((ports) => {
      if (ports.length !== 0) {
        setUsbPorts(ports);
      }
    });
  }, [open]);

  const handleSave = () => {};

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configuración</DialogTitle>
          <DialogDescription>
            Configura los parámetros de connexión modbus
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="usb-connection" className="text-right">
              Puerto USB
            </Label>
            <Select
              onValueChange={handleUsbPort}
              value={newSettings.usbPort || undefined}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecciona un puerto USB" />
              </SelectTrigger>
              <SelectContent>
                {usbPorts.map((port) => (
                  <SelectItem key={port} value={port}>
                    {port}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="baudrate" className="text-right">
              Baudrate
            </Label>
            <Input
              id="baudrate"
              type="number"
              className="col-span-3"
              onChange={handleBaudrate}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="valveAddress" className="text-right">
              Dirección de escritura de válvula
            </Label>
            <Input
              id="valveAddress"
              type="number"
              className="col-span-3"
              onChange={handleValveAddress}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="flowAddress" className="text-right">
              Dirección de lectura de flujo
            </Label>
            <Input
              id="flowAddress"
              type="number"
              className="col-span-3"
              onChange={handleFlowAddress}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
