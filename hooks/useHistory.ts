"use client";

import { useState, useEffect, useCallback } from "react";
import { RaffleHistoryItem } from "@/types/raffle";
import { getHistory } from "@/services/raffleService";

export function useHistory() {
  const [history, setHistory] = useState<RaffleHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await getHistory();
      setHistory(data);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { history, loading, refresh };
}
