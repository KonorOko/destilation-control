import { invokeTauri } from "@/adapters/tauri";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useData } from "@/hooks/useData";
import { useState } from "react";
import { toast } from "sonner";

export function ImportDialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const setFilePath = useData((state) => state.setFilePath);
  const filePath = useData((state) => state.filePath);
  const handleImport = () => {
    toast.promise(
      invokeTauri("import_data", {
        path: filePath,
      }),
      {
        loading: "Saving data...",
        error: "Error saving data",
        success: () => {
          return "Data saved";
        },
      },
    );
    setIsOpen(false);
  };

  const handleDialog = async () => {
    const path = await invokeTauri<string>("file_path");
    setFilePath(path);
  };
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Data</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="folder" className="text-right">
              File path
            </Label>
            <Button
              id="folder"
              className="col-span-3"
              value={filePath}
              onClick={handleDialog}
              variant={"outline"}
            >
              {" "}
              {filePath ? filePath : "Choose file"}
            </Button>
          </div>
        </div>
        <Button onClick={handleImport}>Load data</Button>
      </DialogContent>
    </Dialog>
  );
}
