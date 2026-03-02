"use client";

import { useState, useEffect, useCallback } from "react";
import { RaffleStatus } from "@/types/raffle";
import { getRaffleStatus } from "@/services/raffleService";

export function useRaffleStatus() {
  const [status, setStatus] = useState<RaffleStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await getRaffleStatus();
      setStatus(data);
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

  return { status, loading, refresh };
}
