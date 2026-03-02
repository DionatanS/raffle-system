"use client";

import { use, useEffect, useState } from "react";
import { useNumbers } from "@/hooks/useNumbers";
import { useReserveNumber } from "@/hooks/useReserveNumber";
import { useRaffleStatus } from "@/hooks/useRaffleStatus";
import { Modal } from "@/components/Modal";
import { UserChoice } from "@/types/raffle";

type Props = {
  params: Promise<{ id: string }>;
};

export default function SorteioPage({ params }: Props) {
  const { id } = use(params);
  const raffleId = parseInt(id);
  const STORAGE_KEY = `sorteio_escolha_${raffleId}`;

  const { numbers, loading: loadingNumbers, refresh } = useNumbers();
  const { reserve, loading: reservando } = useReserveNumber();
  const { status, loading: loadingStatus } = useRaffleStatus();

  const [escolha, setEscolha] = useState<UserChoice | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (salvo) {
        return JSON.parse(salvo);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    return null;
  });
  const [modalAberto, setModalAberto] = useState(false);
  const [numeroSelecionado, setNumeroSelecionado] = useState<number | null>(null);
  const [erroReserva, setErroReserva] = useState<string | null>(null);

  useEffect(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sorteio_escolha_") && key !== STORAGE_KEY) {
        localStorage.removeItem(key);
      }
    }
  }, [STORAGE_KEY]);

  const handleClickNumero = (numero: number) => {
    if (escolha || status?.status !== "active") return;
    setNumeroSelecionado(numero);
    setErroReserva(null);
    setModalAberto(true);
  };

  const handleConfirmar = async (nome: string) => {
    if (!numeroSelecionado) return;
    try {
      await reserve(numeroSelecionado, nome);
      const novaEscolha: UserChoice = { numero: numeroSelecionado, nome };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(novaEscolha));
      setEscolha(novaEscolha);
      setModalAberto(false);
      setNumeroSelecionado(null);
      await refresh();
    } catch {
      setErroReserva("Este número já foi reservado. Escolha outro.");
      setModalAberto(false);
      setNumeroSelecionado(null);
      await refresh();
    }
  };

  const handleFecharModal = () => {
    if (reservando) return;
    setModalAberto(false);
    setNumeroSelecionado(null);
  };

  if (loadingStatus || loadingNumbers) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Carregando...</p>
        </div>
      </main>
    );
  }

  if (!status || status.raffle_id !== raffleId) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔗</div>
          <h1 className="text-xl font-bold text-white mb-2">Link inválido</h1>
          <p className="text-gray-400 text-sm">
            Este link não corresponde ao sorteio atual. Solicite o link
            atualizado ao RH.
          </p>
        </div>
      </main>
    );
  }

  if (status.status === "idle") {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h1 className="text-xl font-bold text-white mb-2">Sorteio não iniciado</h1>
          <p className="text-gray-400 text-sm">Aguarde o RH configurar o sorteio.</p>
        </div>
      </main>
    );
  }

  if (status.status === "finished") {
    const euGanhei = escolha?.numero === status.winner_number;
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-6xl mb-6">{euGanhei ? "🎉" : "🏆"}</div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {euGanhei ? "Parabéns, você ganhou!" : "Sorteio Encerrado!"}
          </h1>
          <p className="text-gray-400 text-sm mb-8">
            {euGanhei
              ? "Seu número foi o sorteado. Entre em contato com o RH."
              : "O ganhador do sorteio foi:"}
          </p>
          <div
            className={`rounded-2xl p-8 border ${
              euGanhei
                ? "bg-yellow-500/10 border-yellow-500/40"
                : "bg-gray-900 border-gray-800"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-yellow-400 mb-3">
              Número Sorteado
            </p>
            <p className="text-7xl font-black text-yellow-300 mb-4">
              #{status.winner_number}
            </p>
            <p className="text-2xl font-bold text-white">{status.winner_name}</p>
          </div>
          {escolha && !euGanhei && (
            <p className="mt-6 text-sm text-gray-500">
              Seu número era{" "}
              <span className="text-gray-300 font-semibold">#{escolha.numero}</span>.
              Melhor sorte na próxima!
            </p>
          )}
        </div>
      </main>
    );
  }

  const totalReservados = numbers.filter((n) => n.is_reserved === 1).length;
  const totalDisponiveis = numbers.length - totalReservados;

  return (
    <>
      <main className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🎟️</div>
            <h1 className="text-3xl font-bold tracking-tight">Escolha seu Número</h1>
            <p className="text-gray-400 mt-2 text-sm">
              Clique em um número disponível para reservá-lo
            </p>
          </div>

          {escolha && (
            <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-xl p-5 text-center">
              <p className="text-green-400 font-semibold text-sm uppercase tracking-widest mb-1">
                Sua Reserva Confirmada ✅
              </p>
              <p className="text-white text-lg">
                Número{" "}
                <span className="font-black text-green-300 text-2xl">
                  #{escolha.numero}
                </span>{" "}
                — {escolha.nome}
              </p>
            </div>
          )}

          {erroReserva && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
              <p className="text-red-400 text-sm">{erroReserva}</p>
            </div>
          )}

          <div className="flex gap-6 mb-6 text-sm justify-center flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-green-500 inline-block" />
              <span className="text-gray-300">Disponível ({totalDisponiveis})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-red-500 inline-block" />
              <span className="text-gray-300">Reservado ({totalReservados})</span>
            </div>
            {escolha && (
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-blue-500 inline-block" />
                <span className="text-gray-300">Seu número (#{escolha.numero})</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
            {numbers.map((item) => {
              const reservado = item.is_reserved === 1;
              const meuNumero = escolha?.numero === item.number;

              let className =
                "aspect-square flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-150 border ";

              if (meuNumero) {
                className +=
                  "bg-blue-600 border-blue-500 text-white ring-2 ring-blue-400 cursor-default";
              } else if (reservado) {
                className +=
                  "bg-red-700/60 border-red-800 text-red-300 cursor-not-allowed opacity-60";
              } else if (escolha) {
                className +=
                  "bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed";
              } else {
                className +=
                  "bg-green-600 border-green-700 text-white hover:bg-green-500 hover:scale-105 cursor-pointer";
              }

              return (
                <button
                  key={item.id}
                  disabled={reservado || !!escolha}
                  onClick={() => handleClickNumero(item.number)}
                  title={
                    meuNumero
                      ? `Seu número — ${item.name}`
                      : reservado
                      ? `Reservado por ${item.name}`
                      : `Número ${item.number}`
                  }
                  className={className}
                >
                  {item.number}
                </button>
              );
            })}
          </div>
        </div>
      </main>

      <Modal
        aberto={modalAberto}
        numero={numeroSelecionado}
        onFechar={handleFecharModal}
        onConfirmar={handleConfirmar}
        carregando={reservando}
      />
    </>
  );
}
