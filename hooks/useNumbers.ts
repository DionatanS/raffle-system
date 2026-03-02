"use client";

import { useState, useEffect, useCallback } from "react";
import { RaffleNumber } from "@/types/raffle";
import { getNumbers } from "@/services/raffleService";
import { supabase } from "@/lib/supabase";

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

    // Escuta eventos de broadcast "data-changed" no canal raffle-live
    const channel = supabase
      .channel("raffle-live")
      .on("broadcast", { event: "data-changed" }, () => {
        refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  return { numbers, loading, refresh };
}
