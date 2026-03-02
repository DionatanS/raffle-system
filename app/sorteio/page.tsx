"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRaffleStatus } from "@/hooks/useRaffleStatus";

export default function SorteioIndexPage() {
  const router = useRouter();
  const { status, loading } = useRaffleStatus();

  useEffect(() => {
    if (!loading && status && status.raffle_id > 0) {
      router.replace(`/sorteio/${status.raffle_id}`);
    }
  }, [status, loading, router]);

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Redirecionando...</p>
      </div>
    </main>
  );
}
