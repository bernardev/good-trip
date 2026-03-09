'use client';

import { useState } from 'react';
import { Mail, KeyRound, Ticket, Download, MessageCircle, Loader2, ArrowLeft, Phone } from 'lucide-react';

type Bilhete = {
  orderId: string;
  localizador: string;
  numeroBilhete: string;
  origemNome: string;
  destinoNome: string;
  dataFormatada: string;
  horarioSaida: string;
  empresa: string;
  assentos: string[];
  total: number;
  passageiro: { nome: string; email: string };
};

export default function MinhaPassagemPage() {
  const [etapa, setEtapa] = useState<'email' | 'codigo' | 'bilhetes'>('email');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [bilhetes, setBilhetes] = useState<Bilhete[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [sendingWhatsId, setSendingWhatsId] = useState<string | null>(null);

  async function handleEnviarCodigo(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setErro('');
    try {
      const res = await fetch('/api/minha-passagem/enviar-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || 'Erro ao enviar código');
        return;
      }
      setMensagem(data.message);
      setEtapa('codigo');
    } catch {
      setErro('Erro de conexão');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerificarCodigo(e: React.FormEvent) {
    e.preventDefault();
    if (!codigo.trim()) return;

    setLoading(true);
    setErro('');
    try {
      const res = await fetch('/api/minha-passagem/verificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), codigo: codigo.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || 'Código inválido');
        return;
      }
      setBilhetes(data.bilhetes || []);
      setEtapa('bilhetes');
    } catch {
      setErro('Erro de conexão');
    } finally {
      setLoading(false);
    }
  }

  async function handleBaixarPDF(orderId: string) {
    setDownloadingId(orderId);
    try {
      const res = await fetch('/api/viop/gerar-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bilhete-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Erro ao baixar bilhete');
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleEnviarWhatsApp(orderId: string) {
    setSendingWhatsId(orderId);
    try {
      const res = await fetch('/api/viop/enviar-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      if (res.ok) {
        alert('Bilhete enviado via WhatsApp!');
      } else {
        alert('Erro ao enviar via WhatsApp');
      }
    } catch {
      alert('Erro ao enviar via WhatsApp');
    } finally {
      setSendingWhatsId(null);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 py-10">
      <div className="mx-auto max-w-2xl px-4">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 mb-4">
            <Ticket className="w-4 h-4" />
            Minha Passagem
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Consultar Passagem</h1>
          <p className="text-slate-600 mt-2">Acesse suas passagens compradas na Good Trip</p>
        </div>

        {/* Etapa 1: Email */}
        {etapa === 'email' && (
          <div className="rounded-2xl bg-white p-8 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-slate-900">Informe seu email</h2>
                <p className="text-sm text-slate-500">O mesmo utilizado na compra da passagem</p>
              </div>
            </div>

            <form onSubmit={handleEnviarCodigo}>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />

              {erro && (
                <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erro}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</>
                ) : (
                  'Enviar código de acesso'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Etapa 2: Código OTP */}
        {etapa === 'codigo' && (
          <div className="rounded-2xl bg-white p-8 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-slate-900">Digite o código</h2>
                <p className="text-sm text-slate-500">Enviamos um código de 6 dígitos para <strong>{email}</strong></p>
              </div>
            </div>

            {mensagem && (
              <p className="mb-4 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">{mensagem}</p>
            )}

            <form onSubmit={handleVerificarCodigo}>
              <input
                type="text"
                placeholder="000000"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-4 text-center text-2xl font-mono tracking-[0.5em] focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />

              {erro && (
                <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erro}</p>
              )}

              <button
                type="submit"
                disabled={loading || codigo.length < 6}
                className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Verificando...</>
                ) : (
                  'Acessar passagens'
                )}
              </button>

              <button
                type="button"
                onClick={() => { setEtapa('email'); setErro(''); setCodigo(''); }}
                className="mt-3 w-full py-2 text-slate-600 hover:text-slate-900 text-sm font-medium flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Usar outro email
              </button>
            </form>
          </div>
        )}

        {/* Etapa 3: Lista de bilhetes */}
        {etapa === 'bilhetes' && (
          <div>
            {bilhetes.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 shadow-xl border border-slate-200 text-center">
                <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h2 className="text-lg font-bold text-slate-900 mb-2">Nenhuma passagem encontrada</h2>
                <p className="text-slate-500 text-sm mb-4">
                  Não encontramos passagens vinculadas a este email nos últimos 30 dias.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Para compras anteriores, entre em contato: <strong>(93) 99143-6570</strong>
                </div>
                <button
                  onClick={() => { setEtapa('email'); setErro(''); setCodigo(''); }}
                  className="mt-4 text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  Tentar outro email
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-500 text-center">
                  {bilhetes.length} passagem(ns) encontrada(s) para <strong>{email}</strong>
                </p>

                {bilhetes.map((b) => (
                  <div key={b.orderId} className="rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
                    {/* Cabeçalho do bilhete */}
                    <div className="bg-gradient-to-r from-blue-600 to-sky-600 px-6 py-4 text-white">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm opacity-80">Localizador</p>
                          <p className="text-xl font-bold tracking-wider">{b.localizador}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm opacity-80">{b.dataFormatada}</p>
                          <p className="text-lg font-bold">R$ {b.total.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Detalhes */}
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="text-right flex-1">
                          <p className="font-bold text-slate-900">{b.origemNome}</p>
                          <p className="text-sm text-slate-500">{b.horarioSaida}</p>
                        </div>
                        <div className="text-blue-600 font-bold text-lg px-3">→</div>
                        <div className="flex-1">
                          <p className="font-bold text-slate-900">{b.destinoNome}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                        <div>
                          <span className="text-slate-500">Passageiro</span>
                          <p className="font-medium text-slate-900">{b.passageiro?.nome || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Assento(s)</span>
                          <p className="font-medium text-slate-900">{b.assentos?.join(', ') || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Empresa</span>
                          <p className="font-medium text-slate-900">{b.empresa || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Bilhete</span>
                          <p className="font-medium text-slate-900">{b.numeroBilhete || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleBaixarPDF(b.orderId)}
                          disabled={downloadingId === b.orderId}
                          className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {downloadingId === b.orderId ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          Baixar PDF
                        </button>
                        <button
                          onClick={() => handleEnviarWhatsApp(b.orderId)}
                          disabled={sendingWhatsId === b.orderId}
                          className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {sendingWhatsId === b.orderId ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <MessageCircle className="w-4 h-4" />
                          )}
                          WhatsApp
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Aviso de 30 dias */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 text-center">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Para compras anteriores a 30 dias, entre em contato: <strong>(93) 99143-6570</strong>
                </div>

                <button
                  onClick={() => { setEtapa('email'); setErro(''); setCodigo(''); setBilhetes([]); }}
                  className="w-full py-2 text-slate-600 hover:text-slate-900 text-sm font-medium flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Consultar outro email
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
