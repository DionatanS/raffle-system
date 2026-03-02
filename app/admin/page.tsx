"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDraw } from "@/hooks/useDraw";
import { useNumbers } from "@/hooks/useNumbers";
import { useRaffleStatus } from "@/hooks/useRaffleStatus";
import { useHistory } from "@/hooks/useHistory";
import { initRaffle, cancelRaffle, getRaffleStatus } from "@/services/raffleService";
import { notifyRaffleChanged } from "@/lib/supabase";

export default function AdminPage() {
  const router = useRouter();

  const { draw, result, loading: sorteando } = useDraw();
  const { numbers, refresh: refreshNumbers } = useNumbers();
  const { status, loading: loadingStatus, refresh: refreshStatus } = useRaffleStatus();
  const { history, refresh: refreshHistory } = useHistory();

  const [total, setTotal] = useState<number>(100);
  const [inicializando, setInicializando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [mensagem, setMensagem] = useState<{ texto: string; tipo: "ok" | "erro" } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false);
  const [origin, setOrigin] = useState("");
  const sorteioFeitoNaSessao = useRef(false);
  const resetadoNaEntrada = useRef(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (loadingStatus || resetadoNaEntrada.current) return;
    if (status?.status === "finished") {
      resetadoNaEntrada.current = true;
      cancelRaffle().then(() => {
        Promise.all([refreshNumbers(), refreshStatus(), refreshHistory()]);
      });
    } else {
      resetadoNaEntrada.current = true;
    }
  }, [loadingStatus, status?.status]);

  const linkAtual =
    status?.raffle_id && origin
      ? `${origin}/sorteio/${status.raffle_id}`
      : null;

  const reservados = numbers.filter((n) => n.is_reserved === 1);
  const totalReservados = reservados.length;
  const totalNumeros = numbers.length;
  const percentual = totalNumeros > 0 ? (totalReservados / totalNumeros) * 100 : 0;
  const podeSortear = percentual >= 90 && status?.status === "active";
  const statusAtual = status?.status ?? "idle";
  const exibirEncerrado = statusAtual === "finished" && sorteioFeitoNaSessao.current;

  const handleIniciar = async () => {
    if (total < 1) return;
    setInicializando(true);
    setMensagem(null);

    try {
      await initRaffle(total);
      await getRaffleStatus();
      setMensagem({ texto: `Sorteio criado com ${total} número${total > 1 ? "s" : ""}!`, tipo: "ok" });
      await Promise.all([refreshNumbers(), refreshStatus()]);
      notifyRaffleChanged(); // notifica participantes em tempo real
    } catch {
      setMensagem({ texto: "Erro ao criar o sorteio. Tente novamente.", tipo: "erro" });
    } finally {
      setInicializando(false);
    }
  };

  const handleCancelar = async () => {
    setCancelando(true);
    try {
      await cancelRaffle();
      setMensagem(null);
      setConfirmandoCancelamento(false);
      await Promise.all([refreshNumbers(), refreshStatus()]);
      notifyRaffleChanged(); // notifica participantes em tempo real
    } catch {
      setMensagem({ texto: "Erro ao cancelar o sorteio.", tipo: "erro" });
    } finally {
      setCancelando(false);
    }
  };

  const handleSortear = async () => {
    sorteioFeitoNaSessao.current = true;
    await draw();
    await Promise.all([refreshStatus(), refreshHistory()]);
    notifyRaffleChanged(); // notifica participantes em tempo real
  };

  const handleCopiar = async () => {
    if (!linkAtual) return;
    await navigator.clipboard.writeText(linkAtual);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleSair = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-5">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">⚙️ Painel do RH</h1>
            <p className="text-gray-400 mt-1 text-sm">Configure e gerencie os sorteios</p>
          </div>
          <button
            onClick={handleSair}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-4 py-2 rounded-lg transition"
          >
            Sair
          </button>
        </div>

        {(statusAtual === "active" || exibirEncerrado) && (
          <div
            className={`rounded-2xl border p-5 flex flex-col gap-4 ${
              statusAtual === "active"
                ? "bg-blue-500/10 border-blue-500/30"
                : "bg-yellow-500/10 border-yellow-500/30"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full animate-pulse shrink-0 ${statusAtual === "active" ? "bg-blue-400" : "bg-yellow-400"}`} />
                <div>
                  <p className={`font-semibold text-sm ${statusAtual === "active" ? "text-blue-300" : "text-yellow-300"}`}>
                    {statusAtual === "active" ? "Sorteio em andamento" : "Sorteio encerrado"}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {statusAtual === "active"
                      ? `${totalReservados} de ${totalNumeros} números reservados`
                      : `Ganhador: #${status?.winner_number} — ${status?.winner_name}`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {exibirEncerrado ? (
                  <button
                    onClick={handleCancelar}
                    disabled={cancelando}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
                  >
                    {cancelando ? "Aguarde..." : "Novo Sorteio"}
                  </button>
                ) : !confirmandoCancelamento ? (
                  <button
                    onClick={() => setConfirmandoCancelamento(true)}
                    className="bg-red-600/20 hover:bg-red-600/40 border border-red-600/30 text-red-300 text-sm font-semibold px-4 py-2 rounded-lg transition"
                  >
                    Cancelar Sorteio
                  </button>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm text-gray-300">Confirmar cancelamento?</p>
                    <button
                      onClick={handleCancelar}
                      disabled={cancelando}
                      className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
                    >
                      {cancelando ? "Cancelando..." : "Sim, cancelar"}
                    </button>
                    <button
                      onClick={() => setConfirmandoCancelamento(false)}
                      className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-2 rounded-lg transition"
                    >
                      Não
                    </button>
                  </div>
                )}
              </div>
            </div>

            {statusAtual === "active" && linkAtual && (
              <div className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-1">
                    Link para os participantes
                  </p>
                  <p className="text-blue-300 text-sm font-mono truncate">{linkAtual}</p>
                </div>
                <button
                  onClick={handleCopiar}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition whitespace-nowrap shrink-0"
                >
                  {copiado ? "Copiado! ✓" : "Copiar link"}
                </button>
              </div>
            )}
          </div>
        )}

        {statusAtual === "idle" && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-1">Criar Novo Sorteio</h2>
            <p className="text-gray-400 text-sm mb-5">
              Defina quantos números o sorteio terá e gere o link para os participantes.
            </p>
            <div className="flex gap-3 mb-4">
              <input
                type="number"
                min={1}
                max={9999}
                value={total}
                onChange={(e) => setTotal(Number(e.target.value))}
                className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                placeholder="Quantidade de números"
              />
              <button
                onClick={handleIniciar}
                disabled={inicializando || total < 1}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition whitespace-nowrap"
              >
                {inicializando ? "Criando..." : "Criar Sorteio"}
              </button>
            </div>
            {mensagem && (
              <p className={`text-sm ${mensagem.tipo === "ok" ? "text-green-400" : "text-red-400"}`}>
                {mensagem.texto}
              </p>
            )}
          </div>
        )}

        {statusAtual === "active" && (
          <>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-semibold">Participantes</h2>
                  <p className="text-gray-400 text-sm mt-0.5">Atualização em tempo real ⚡</p>
                </div>
                <div className="flex gap-3 text-sm">
                  <span className="bg-green-500/15 text-green-400 border border-green-500/20 px-3 py-1 rounded-full font-medium">
                    {totalNumeros - totalReservados} disponíveis
                  </span>
                  <span className="bg-red-500/15 text-red-400 border border-red-500/20 px-3 py-1 rounded-full font-medium">
                    {totalReservados} reservados
                  </span>
                </div>
              </div>
              {totalReservados === 0 ? (
                <div className="text-center py-10 text-gray-600">
                  <p className="text-3xl mb-2">⏳</p>
                  <p className="text-sm">Nenhum número reservado ainda.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {reservados.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 bg-red-600/20 border border-red-600/30 text-red-300 rounded-lg flex items-center justify-center text-sm font-bold shrink-0">
                          {item.number}
                        </span>
                        <span className="text-white font-medium">{item.name}</span>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-md">
                        Reservado
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-1">Realizar Sorteio</h2>
              <p className="text-gray-400 text-sm mb-5">
                Disponível quando 90% dos números estiverem reservados.
              </p>
              <div className="mb-5">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Preenchimento</span>
                  <span className={`font-semibold ${podeSortear ? "text-green-400" : "text-yellow-400"}`}>
                    {percentual.toFixed(1)}% — {totalReservados}/{totalNumeros}
                    {!podeSortear && " (mínimo 90%)"}
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${podeSortear ? "bg-green-500" : "bg-yellow-500"}`}
                    style={{ width: `${Math.min(percentual, 100)}%` }}
                  />
                </div>
              </div>
              <button
                onClick={handleSortear}
                disabled={sorteando || !podeSortear}
                title={!podeSortear ? `Faltam ${Math.max(Math.ceil(totalNumeros * 0.9) - totalReservados, 0)} número(s)` : undefined}
                className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-gray-950 font-bold py-3 rounded-xl text-base transition"
              >
                {sorteando ? "Sorteando..." : "🎲 Sortear Ganhador"}
              </button>
              {!podeSortear && (
                <p className="mt-3 text-center text-sm text-gray-500">
                  Faltam{" "}
                  <span className="text-yellow-400 font-semibold">
                    {Math.max(Math.ceil(totalNumeros * 0.9) - totalReservados, 0)}
                  </span>{" "}
                  número(s) para liberar o sorteio.
                </p>
              )}
            </div>
          </>
        )}

        {exibirEncerrado && status && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-yellow-400 mb-5 text-center">
              🏆 Ganhador do Sorteio
            </p>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-8 text-center">
              <p className="text-7xl font-black text-yellow-300 mb-4">
                #{status.winner_number}
              </p>
              <p className="text-2xl font-bold text-white">{status.winner_name}</p>
            </div>
            <button
              onClick={handleCancelar}
              disabled={cancelando}
              className="mt-5 w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-base transition"
            >
              {cancelando ? "Aguarde..." : "🔄 Iniciar Novo Sorteio"}
            </button>
          </div>
        )}

        {result && statusAtual === "active" && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 text-center">
            <p className="text-yellow-400 text-xs font-semibold uppercase tracking-widest mb-3">
              🏆 Ganhador do Sorteio
            </p>
            <p className="text-6xl font-black text-yellow-300 mb-3">#{result.number}</p>
            <p className="text-2xl text-white font-bold">{result.name}</p>
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-5">Histórico de Sorteios</h2>
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-sm">Nenhum sorteio realizado ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500 text-xs font-mono w-5 text-right shrink-0">
                      #{history.length - index}
                    </span>
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {item.winner_name}
                        <span className="ml-2 text-yellow-400 font-black">
                          #{item.winner_number}
                        </span>
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {item.total_numbers} números · {item.realizado_em}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 px-2.5 py-1 rounded-full font-medium shrink-0">
                    🏆 Ganhador
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
