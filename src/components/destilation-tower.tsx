import { useData } from "@/hooks/useData";
import { AnimatePresence, motion } from "framer-motion";
import { DestilationPlate } from "../components/destilation-plate";

export function DestilationTower({ plates }: { plates: number }) {
  const columnData = useData((state) => state.columnData);
  console.log(columnData);
  return (
    <motion.div className="flex h-full flex-col items-center justify-center gap-1">
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
            <span className="absolute right-0 top-1/2 -mr-14 h-fit w-10 -translate-y-1/2 cursor-default text-right text-xs text-gray-500">
              {columnData.at(-1)?.temperatures?.[index].toFixed(1) || 0}°C
            </span>
            <DestilationPlate />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
