"use client";

import { useState, useEffect, useCallback } from "react";
import { RaffleNumber } from "@/types/raffle";
import { getNumbers } from "@/services/raffleService";

export function useNumbers() {
  const [numbers, setNumbers] = useState<RaffleNumber[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await getNumbers();
      setNumbers(data);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { numbers, loading, refresh };
}
