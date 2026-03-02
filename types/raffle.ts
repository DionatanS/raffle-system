export type RaffleNumber = {
  id: number;
  number: number;
  name: string | null;
  is_reserved: number;
};

export type UserChoice = {
  numero: number;
  nome: string;
};

export type RaffleStatus = {
  id: number;
  status: "idle" | "active" | "finished";
  winner_number: number | null;
  winner_name: string | null;
  raffle_id: number;
};

export type RaffleHistoryItem = {
  id: number;
  total_numbers: number;
  winner_number: number;
  winner_name: string;
  realizado_em: string;
};
