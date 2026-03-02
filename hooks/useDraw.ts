"use client";

import { useState } from "react";
import { RaffleNumber } from "@/types/raffle";
import { drawNumber } from "@/services/raffleService";

export function useDraw() {
  const [result, setResult] = useState<RaffleNumber | null>(null);
  const [loading, setLoading] = useState(false);

  const draw = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await drawNumber();
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return { draw, result, loading };
}
