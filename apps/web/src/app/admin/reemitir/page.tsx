"use client";

import { useState } from "react";
import { Search, RefreshCw, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

type ReservaInfo = {
  orderId: string;
  assentoAtual: string;
  origem: string;
  destino: string;
  data: string;
  passageiro: string;
  valor: number;
  status: string;
};

export default function ReemitirPage() {
  const [orderId, setOrderId] = useState("");
  const [novoAssento, setNovoAssento] = useState("");
  const [loading, setLoading] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [reservaInfo, setReservaInfo] = useState<ReservaInfo | null>(null);
  const [resultado, setResultado] = useState<{
    tipo: "sucesso" | "erro";
    mensagem: string;
    detalhes?: {
      localizador: string;
      numeroBilhete: string;
      assentoNovo: string;
      assentoAntigo: string;
    };
  } | null>(null);

  async function buscarReserva() {
    if (!orderId.trim()) {
      alert("Digite o Order ID");
      return;
    }

    setBuscando(true);
    setResultado(null);
    setReservaInfo(null);

    try {
      const res = await fetch(`/api/viop/dados-reserva?orderId=${orderId}`);

      if (!res.ok) {
        throw new Error("Reserva não encontrada");
      }

      const data = await res.json();

      setReservaInfo({
        orderId: orderId,
        assentoAtual: data.assentos?.[0] || "N/A",
        origem: data.origemNome || "N/A",
        destino: data.destinoNome || "N/A",
        data: data.dataFormatada || "N/A",
        passageiro: data.passageiro?.nome || "N/A",
        valor: data.total || 0,
        status: data.status || "N/A",
      });
    } catch (error) {
      setResultado({
        tipo: "erro",
        mensagem: error instanceof Error ? error.message : "Erro ao buscar reserva",
      });
    } finally {
      setBuscando(false);
    }
  }

  async function handleReemitir() {
    if (!novoAssento.trim()) {
      alert("Digite o novo número do assento");
      return;
    }

    if (
      !confirm(
        `Confirma re-emissão?\n\nAssento atual: ${reservaInfo?.assentoAtual}\nNovo assento: ${novoAssento}`
      )
    ) {
      return;
    }

    setLoading(true);
    setResultado(null);

    try {
      const res = await fetch("/api/viop/reemitir-bilhete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderId,
          novoAssento: novoAssento,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResultado({
          tipo: "sucesso",
          mensagem: `✅ Bilhete re-emitido com sucesso!`,
          detalhes: {
            localizador: data.localizador,
            numeroBilhete: data.numeroBilhete,
            assentoNovo: data.poltrona,
            assentoAntigo: data._assentoAntigo,
          },
        });

        if (reservaInfo) {
          setReservaInfo({
            ...reservaInfo,
            assentoAtual: novoAssento,
          });
        }
      } else {
        throw new Error(data.error || "Erro ao re-emitir");
      }
    } catch (error) {
      setResultado({
        tipo: "erro",
        mensagem: error instanceof Error ? error.message : "Erro ao re-emitir bilhete",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      {/* CARD: Buscar Reserva */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-xl font-semibold">Re-emitir Bilhete</h1>
        <p className="text-white/70 text-sm mt-1">
          Altere o assento de um bilhete já pago sem cobrar novamente.
        </p>

        <div className="mt-5">
          <label className="text-sm text-white/80">Order ID</label>
          <div className="mt-1 flex gap-3">
            <input
              type="text"
              placeholder="ex: or_xxxxx"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="flex-1 rounded-xl bg-white/[.06] border border-white/10 p-3"
              disabled={buscando}
            />
            <button
              onClick={buscarReserva}
              disabled={buscando || !orderId.trim()}
              className="rounded-xl bg-primary px-5 h-12 font-semibold hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {buscando ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Buscar
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* CARD: Info da Reserva */}
      {reservaInfo && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Informações da Reserva</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <span className="text-sm text-white/70">Order ID</span>
              <p className="font-semibold mt-1">{reservaInfo.orderId}</p>
            </div>
            <div>
              <span className="text-sm text-white/70">Assento Atual</span>
              <p className="font-bold text-2xl text-primary mt-1">{reservaInfo.assentoAtual}</p>
            </div>
            <div>
              <span className="text-sm text-white/70">Origem → Destino</span>
              <p className="font-semibold mt-1">
                {reservaInfo.origem} → {reservaInfo.destino}
              </p>
            </div>
            <div>
              <span className="text-sm text-white/70">Data</span>
              <p className="font-semibold mt-1">{reservaInfo.data}</p>
            </div>
            <div>
              <span className="text-sm text-white/70">Passageiro</span>
              <p className="font-semibold mt-1">{reservaInfo.passageiro}</p>
            </div>
            <div>
              <span className="text-sm text-white/70">Valor</span>
              <p className="font-semibold mt-1">R$ {reservaInfo.valor.toFixed(2)}</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <h3 className="text-sm font-semibold mb-3">Novo Assento</h3>

            <div className="flex gap-3">
              <input
                type="text"
                placeholder="ex: 15"
                value={novoAssento}
                onChange={(e) => setNovoAssento(e.target.value)}
                className="flex-1 rounded-xl bg-white/[.06] border border-white/10 p-3"
                disabled={loading}
              />
              <button
                onClick={handleReemitir}
                disabled={loading || !novoAssento.trim()}
                className="rounded-xl bg-emerald-600 px-5 h-12 font-semibold hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Re-emitindo...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Re-emitir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CARD: Resultado */}
      {resultado && (
        <div
          className={`rounded-2xl border p-6 ${
            resultado.tipo === "sucesso"
              ? "border-emerald-500/30 bg-emerald-500/10"
              : "border-red-500/30 bg-red-500/10"
          }`}
        >
          <div className="flex items-start gap-3">
            {resultado.tipo === "sucesso" ? (
              <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h3
                className={`font-semibold mb-2 ${
                  resultado.tipo === "sucesso" ? "text-emerald-100" : "text-red-100"
                }`}
              >
                {resultado.tipo === "sucesso" ? "Sucesso!" : "Erro"}
              </h3>
              <p className={resultado.tipo === "sucesso" ? "text-emerald-200" : "text-red-200"}>
                {resultado.mensagem}
              </p>

              {resultado.detalhes && (
                <div className="mt-4 p-4 rounded-xl bg-white/[.06] border border-white/10">
                  <p className="text-sm text-white/70 mb-2">Detalhes:</p>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-white/70">Localizador:</span>{" "}
                      <span className="font-semibold">{resultado.detalhes.localizador}</span>
                    </p>
                    <p>
                      <span className="text-white/70">Nº Bilhete:</span>{" "}
                      <span className="font-semibold">{resultado.detalhes.numeroBilhete}</span>
                    </p>
                    <p>
                      <span className="text-white/70">Assento:</span>{" "}
                      <span className="font-semibold">
                        {resultado.detalhes.assentoAntigo} → {resultado.detalhes.assentoNovo}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CARD: Instruções */}
      <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-6">
        <h3 className="font-semibold text-blue-100 mb-2">ℹ️ Como usar:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-200">
          <li>Digite o Order ID da reserva paga</li>
          <li>Clique em Buscar para carregar os dados</li>
          <li>Digite o novo número do assento disponível</li>
          <li>Clique em Reemitir para processar</li>
        </ol>
        <p className="mt-3 text-sm text-blue-200">
          ⚠️ <strong>Atenção:</strong> O novo assento deve estar disponível. O pagamento NÃO será
          cobrado novamente.
        </p>
      </div>
    </section>
  );
}