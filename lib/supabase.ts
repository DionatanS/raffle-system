import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Canal persistente para broadcast — subscrito uma vez no carregamento do módulo
let _notifyChannel: ReturnType<typeof supabase.channel> | null = null;

function getNotifyChannel() {
  if (!_notifyChannel) {
    _notifyChannel = supabase.channel("raffle-live");
    _notifyChannel.subscribe();
  }
  return _notifyChannel;
}

/**
 * Notifica todos os clientes conectados que algo mudou no sorteio.
 * Usado após qualquer mutação (reserve, init, cancel, draw).
 */
export function notifyRaffleChanged() {
  getNotifyChannel().send({
    type: "broadcast",
    event: "data-changed",
    payload: {},
  });
}
