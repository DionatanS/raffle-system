"use client";

import { useState, useEffect, useCallback } from "react";
import { RaffleStatus } from "@/types/raffle";
import { getRaffleStatus } from "@/services/raffleService";
import { supabase } from "@/lib/supabase";

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

  return { status, loading, refresh };
}
