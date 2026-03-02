import { RaffleHistoryItem, RaffleNumber, RaffleStatus } from "@/types/raffle";

export async function initRaffle(total: number): Promise<void> {
  const res = await fetch("/api/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ total }),
  });
  if (!res.ok) throw new Error("Failed to initialize raffle");
}

export async function getNumbers(): Promise<RaffleNumber[]> {
  const res = await fetch("/api/numbers");
  if (!res.ok) throw new Error("Failed to get numbers");
  return res.json();
}

export async function reserveNumber(
  number: number,
  name: string
): Promise<void> {
  const res = await fetch("/api/reserve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ number, name }),
  });
  if (!res.ok) throw new Error("Number already reserved");
}

export async function drawNumber(): Promise<RaffleNumber> {
  const res = await fetch("/api/draw", { method: "POST" });
  if (!res.ok) throw new Error("No reserved numbers");
  return res.json();
}

export async function getRaffleStatus(): Promise<RaffleStatus> {
  const res = await fetch("/api/status");
  if (!res.ok) throw new Error("Failed to get raffle status");
  return res.json();
}

export async function cancelRaffle(): Promise<void> {
  const res = await fetch("/api/cancel", { method: "POST" });
  if (!res.ok) throw new Error("Failed to cancel raffle");
}

export async function getHistory(): Promise<RaffleHistoryItem[]> {
  const res = await fetch("/api/history");
  if (!res.ok) throw new Error("Failed to get history");
  return res.json();
}
