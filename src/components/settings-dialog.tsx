import { invokeTauri, logger } from "@/adapters/tauri";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettings } from "@/hooks/useSettings";
import { formSchema } from "@/schemas/settings";
import { SettingsType } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export function SettingsDialog({ children }: { children: React.ReactNode }) {
  const { settings, saveSettings } = useSettings();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      baudrate: settings.baudrate.toString() as unknown as number,
      unitId: settings.unitId,
      timeout: settings.timeout,
      temperatureBottom: settings.temperatureAddress.bottom,
      temperatureTop: settings.temperatureAddress.top,
      usbPort: settings.usbPort,
    },
  });

  const [open, setOpen] = useState(false);
  const [usbPorts, setUsbPorts] = useState<string[]>([]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("newSettings");
    const {
      usbPort,
      baudrate,
      temperatureBottom,
      temperatureTop,
      timeout,
      unitId,
    } = values;
    try {
      const newSettings: Partial<SettingsType> = {
        usbPort,
        baudrate,
        temperatureAddress: {
          bottom: temperatureBottom,
          top: temperatureTop,
        },
        timeout,
        unitId,
        count: 2,
      };
      await saveSettings(newSettings);
      setOpen(false);
    } catch (error) {
      toast.error("Error on save");
      logger.error("Error on save: " + error);
    }
  }

  useEffect(() => {
    const { baudrate, temperatureAddress, timeout, unitId, usbPort } = settings;
    form.setValue("baudrate", baudrate.toString() as unknown as number);
    form.setValue("temperatureBottom", temperatureAddress.bottom);
    form.setValue("temperatureTop", temperatureAddress.top);
    form.setValue("timeout", timeout);
    form.setValue("unitId", unitId);
    invokeTauri<string[]>("available_ports").then((ports) => {
      if (ports.length === 0) {
        setUsbPorts([]);
        form.setValue("usbPort", "");
      }
      setUsbPorts(ports);
      if (ports.includes(usbPort)) {
        form.setValue("usbPort", usbPort);
      }
    });
  }, [open]);

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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="usbPort"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-4">
                  <FormLabel>Puerto USB</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Selecciona un puerto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {usbPorts.length === 0 && (
                        <SelectItem value={" "} disabled>
                          No hay puertos...
                        </SelectItem>
                      )}
                      {usbPorts.map((port) => (
                        <SelectItem key={port} value={port}>
                          {port}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="baudrate"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-4">
                  <FormLabel>Baudrate</FormLabel>
                  <FormControl>
                    <Input className="w-[200px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="timeout"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-4">
                  <FormLabel>Timeout</FormLabel>
                  <FormControl>
                    <Input className="w-[200px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unitId"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-4">
                  <FormLabel>ID de unidad</FormLabel>
                  <FormControl>
                    <Input className="w-[200px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="temperatureBottom"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-4">
                  <FormLabel>Dirección del sensor inferior</FormLabel>
                  <FormControl>
                    <Input className="w-[200px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="temperatureTop"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-4">
                  <FormLabel>Dirección del sensor superior</FormLabel>
                  <FormControl>
                    <Input className="w-[200px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="mt-5">
              <Button variant="outline" type="button" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
