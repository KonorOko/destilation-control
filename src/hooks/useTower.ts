import { useState } from "react";

export function useTower() {
  const MAX_PLATES = 6;
  const [plates, setPlates] = useState(1);
  const addPlate = () => setPlates((prev) => Math.min(prev + 1, MAX_PLATES));
  const removePlate = () => setPlates((prev) => Math.max(prev - 1, 1));

  return {
    plates,
    addPlate,
    removePlate,
    MAX_PLATES,
  };
}
