"use client";

import { useState } from "react";
import { reserveNumber } from "@/services/raffleService";

export function useReserveNumber() {
  const [loading, setLoading] = useState(false);

  const reserve = async (number: number, name: string): Promise<void> => {
    setLoading(true);
    try {
      await reserveNumber(number, name);
    } finally {
      setLoading(false);
    }
  };

  return { reserve, loading };
}
