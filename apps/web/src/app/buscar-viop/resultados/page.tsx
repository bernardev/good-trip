// ============================================
// PÁGINA DE RESULTADOS
// apps/web/src/app/buscar-viop/resultados/page.tsx
// ============================================
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { JSX } from 'react';

// Tipos base
type ISODate = `${number}-${number}-${number}`; // 'YYYY-MM-DD'
type HHMM = `${number}:${number}`;              // 'HH:MM'

// Viagem unificada (mesmo contrato do backend)
type ViagemUnificada = {
  id: string;
  provider: "ouro-prata" | "distribusion";
  origem: string;
  destino: string;
  dataPartida: ISODate;
  horarioPartida: HHMM | "--:--";
  horarioChegada: HHMM | "--:--";
  duracao: string;
  preco: number;
  assentosDisponiveis: number;
  tipo: string;
  nomeEmpresa: string;
  dadosReserva?: Record<string, unknown>;
  urlDistribusion?: string;
};

// Respostas da API
type ApiOk = { ok: true; total: number; viagens: ViagemUnificada[] };
type ApiErr = { error: string };
type ApiResponse = ApiOk | ApiErr;

// Type guards
function isApiOk(x: unknown): x is ApiOk {
  return (
    typeof x === "object" &&
    x !== null &&
    (x as Record<string, unknown>).ok === true &&
    Array.isArray((x as { viagens?: unknown }).viagens)
  );
}

export default function ResultadosPage(): JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [viagens, setViagens] = useState<ViagemUnificada[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const origem = searchParams.get("origem");
  const destino = searchParams.get("destino");
  const data = searchParams.get("data");
  const passageiros = searchParams.get("passageiros") ?? "1";

  useEffect(() => {
    if (!origem || !destino || !data) {
      setError("Parâmetros de busca inválidos");
      setLoading(false);
      return;
    }
    void buscarViagens(origem, destino, data, passageiros);
  }, [origem, destino, data, passageiros]);

  async function buscarViagens(
    origemV: string,
    destinoV: string,
    dataV: string,
    passageirosV: string
  ): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const qs = new URLSearchParams({
        origem: origemV,
        destino: destinoV,
        data: dataV,
        passageiros: passageirosV,
      }).toString();

      const response = await fetch(`/api/buscar-unificado?${qs}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar viagens (${response.status})`);
      }

      const body: unknown = await response.json();
      if (isApiOk(body)) {
        setViagens(body.viagens);
      } else {
        const errMsg =
          (body as ApiErr)?.error ?? "Erro ao interpretar a resposta";
        setError(errMsg);
        setViagens([]);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Erro:", err);
      setError("Erro ao buscar viagens. Tente novamente.");
      setViagens([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSelecionarViagem(viagem: ViagemUnificada): void {
    if (viagem.provider === "distribusion") {
      if (viagem.urlDistribusion) {
        window.open(viagem.urlDistribusion, "_blank", "noopener,noreferrer");
      }
      return;
    }
    router.push(`/checkout?viagemId=${encodeURIComponent(viagem.id)}`);
  }

  function voltarBusca(): void {
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
            <p className="mt-4 text-slate-600">Buscando as melhores viagens...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-xl shadow p-8">
            <div className="text-center">
              <div className="text-red-600 text-5xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Ops!</h2>
              <p className="text-slate-600 mb-6">{error}</p>
              <button
                onClick={voltarBusca}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700"
              >
                Nova Busca
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header com resumo da busca */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 mb-2">
                Resultados da Busca
              </h1>
              <p className="text-slate-600">{viagens.length} viagem(ns) encontrada(s)</p>
              <p className="text-sm text-slate-500 mt-1">
                {origem ?? "--"} → {destino ?? "--"} •{" "}
                {data ? formatarData(data as ISODate) : "--/--/----"} • {passageiros} passageiro(s)
              </p>
            </div>
            <button
              onClick={voltarBusca}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Nova busca
            </button>
          </div>
        </div>

        {/* Lista de viagens */}
        {viagens.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <div className="text-slate-400 text-6xl mb-4">🚌</div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              Nenhuma viagem encontrada
            </h2>
            <p className="text-slate-600 mb-6">
              Tente alterar os parâmetros de busca ou escolha outras datas.
            </p>
            <button
              onClick={voltarBusca}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700"
            >
              Fazer Nova Busca
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {viagens.map((viagem) => (
              <CardViagem
                key={viagem.id}
                viagem={viagem}
                onSelecionar={handleSelecionarViagem}
              />
            ))}
          </div>
        )}

        {/* Legenda */}
        {viagens.length > 0 && (
          <div className="mt-6 bg-white rounded-xl shadow p-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500" />
                <span className="text-slate-600">Ouro e Prata</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500" />
                <span className="text-slate-600">Parceiros Distribusion</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE DE CARD DA VIAGEM
// ============================================
function CardViagem(props: {
  viagem: ViagemUnificada;
  onSelecionar: (v: ViagemUnificada) => void;
}): JSX.Element {
  const { viagem, onSelecionar } = props;
  const isDistribusion = viagem.provider === "distribusion";
  const badgeColor = isDistribusion
    ? "bg-blue-100 text-blue-800"
    : "bg-green-100 text-green-800";

  return (
    <div className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow p-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Info da viagem */}
        <div className="flex-1">
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeColor}`}>
              {viagem.nomeEmpresa}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              {viagem.tipo}
            </span>
            {viagem.assentosDisponiveis < 5 && viagem.assentosDisponiveis > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                Últimos {viagem.assentosDisponiveis} assentos!
              </span>
            )}
          </div>

          {/* Horários */}
          <div className="flex items-center gap-6 mb-3">
            <div>
              <div className="text-3xl font-bold text-slate-800">{viagem.horarioPartida}</div>
              <div className="text-sm text-slate-600">Partida</div>
            </div>

            <div className="flex-1 flex items-center">
              <div className="flex-1 h-0.5 bg-slate-300" />
              <div className="px-3 text-sm text-slate-600 whitespace-nowrap">{viagem.duracao}</div>
              <div className="flex-1 h-0.5 bg-slate-300" />
            </div>

            <div>
              <div className="text-3xl font-bold text-slate-800">{viagem.horarioChegada}</div>
              <div className="text-sm text-slate-600">Chegada</div>
            </div>
          </div>

          {/* Info adicional */}
          {!isDistribusion && viagem.assentosDisponiveis > 0 && (
            <div className="text-sm text-slate-600">
              📍 {viagem.assentosDisponiveis} assentos disponíveis
            </div>
          )}
        </div>

        {/* Preço e ação */}
        <div className="lg:border-l lg:pl-6 flex flex-col justify-center items-center min-w-[200px]">
          {viagem.preco > 0 ? (
            <>
              <div className="text-sm text-slate-600 mb-1">a partir de</div>
              <div className="text-3xl font-bold text-green-600 mb-4">
                R$ {viagem.preco.toFixed(2)}
              </div>
            </>
          ) : (
            <>
              <div className="text-sm text-slate-600 mb-1">vários horários</div>
              <div className="text-xl font-bold text-blue-600 mb-4">Ver opções</div>
            </>
          )}

          <button
            onClick={() => onSelecionar(viagem)}
            className={`w-full px-6 py-3 rounded-xl font-semibold transition-colors ${
              isDistribusion
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {isDistribusion ? "Ver Viagens →" : "Comprar Agora"}
          </button>

          {isDistribusion && (
            <p className="text-xs text-slate-500 mt-2 text-center">
              Você será redirecionado para ver todas as opções disponíveis
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// UTILITÁRIOS
// ============================================
function formatarData(dataISO: ISODate): string {
  const parts = dataISO.split("-");
  if (parts.length !== 3) return dataISO;
  const [ano, mes, dia] = parts;
  return `${dia}/${mes}/${ano}`;
}
