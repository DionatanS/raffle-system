"use client";

import { useEffect, useRef, useState } from "react";

type ModalProps = {
  aberto: boolean;
  numero: number | null;
  onFechar: () => void;
  onConfirmar: (nome: string) => Promise<void>;
  carregando: boolean;
};

export function Modal({ aberto, numero, onFechar, onConfirmar, carregando }: ModalProps) {
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (aberto) {
      setNome("");
      setErro(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [aberto]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar();
    };
    if (aberto) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [aberto, onFechar]);

  const handleConfirmar = async () => {
    if (!nome.trim()) {
      setErro("Por favor, informe seu nome.");
      return;
    }
    setErro(null);
    await onConfirmar(nome.trim());
  };

  if (!aberto || numero === null) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onFechar}
      />

      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-black text-white">{numero}</span>
          </div>
          <h2 className="text-xl font-bold text-white">Reservar Número {numero}</h2>
          <p className="text-gray-400 text-sm mt-1">
            Informe seu nome para confirmar a reserva
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Seu nome completo
            </label>
            <input
              ref={inputRef}
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConfirmar()}
              placeholder="Digite seu nome"
              disabled={carregando}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition disabled:opacity-50"
            />
          </div>

          {erro && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5">
              <p className="text-red-400 text-sm">{erro}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={onFechar}
              disabled={carregando}
              className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={carregando || !nome.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition"
            >
              {carregando ? "Salvando..." : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
