import { Button } from "@/components/ui/button";
import { useTower } from "@/hooks/useTower";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { DestilationPlate } from "./destilation-plate";

export function DashboardPage() {
  const { plates, addPlate, removePlate, MAX_PLATES } = useTower();
  const [disableButton, setDisableButton] = useState(false);
  useEffect(() => {
    if (plates === 1 || plates === MAX_PLATES) {
      return;
    }
    setDisableButton(true);
    setTimeout(() => {
      setDisableButton(false);
    }, 300);
  }, [plates]);
  return (
    <div className="grid w-full grid-cols-3 gap-2">
      <section className="row-span-2 flex flex-col items-center rounded-lg border">
        <header className="flex h-10 w-full items-center justify-between rounded-t-lg bg-slate-100">
          <Button size="icon" variant={"outline"}>
            <Settings className="h-6 w-6" />
          </Button>
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
        <motion.div className="flex flex-1 flex-col items-center justify-center">
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
              >
                <DestilationPlate />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>
      <section className="col-span-2 grid grid-cols-2 gap-2">
        <section className="rounded-lg border bg-slate-100 shadow-inner"></section>
        <section className="rounded-lg border bg-slate-100 shadow-inner"></section>
      </section>
      <section className="col-span-2 rounded-lg border"></section>
    </div>
  );
}
