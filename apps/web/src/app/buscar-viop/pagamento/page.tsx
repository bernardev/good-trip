// apps/web/src/app/buscar-viop/pagamento/page.tsx
'use client';

import { Suspense } from 'react';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CreditCard, QrCode, Mail, Bus, Clock, Lock, Shield, CheckCircle2, AlertCircle, Info, Phone, User } from 'lucide-react';
import { getObservacaoRota, getCorObservacao } from '@/lib/observacoes-rotas';

type Query = {
  servico?: string; 
  origem?: string; 
  destino?: string; 
  data?: string; 
  assentos?: string;
  passageiros?: string;
  preco?: string;
};

type PaymentMethod = 'credit_card' | 'pix';

type ApiOnibusRes = {
  ok: boolean;
  serviceMeta?: {
    preco?: number;
    empresa?: string;
    classe?: string;
    saida?: string;
    chegada?: string;
  };
  seats?: {
    origem?: { cidade?: string; id?: number };
    destino?: { cidade?: string; id?: number };
  };
};

// 🔥 Tipo para passageiro
type Passageiro = {
  assento: string;
  nomeCompleto: string;
  docTipo: string;
  docNumero: string;
  nacionalidade: string;
  telefone: string;
  email: string;
};

// 🔥 TAXAS DE JUROS
const TAXAS_JUROS: Record<number, number> = {
  1: 3.54,
  2: 6.46,
  3: 8.23,
  4: 10.00,
  5: 11.77,
  6: 13.54,
  7: 15.20,
  8: 16.97,
  9: 18.74,
  10: 20.51,
  11: 22.28,
  12: 24.05,
};

function PagamentoContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');

  const [origemNome, setOrigemNome] = useState<string>('');
  const [destinoNome, setDestinoNome] = useState<string>('');
  const [precoReal, setPrecoReal] = useState<number | null>(null);
  const [saidaHorario, setSaidaHorario] = useState<string>('');
  const [loadingViagem, setLoadingViagem] = useState(true);

  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [installments, setInstallments] = useState('1');

  const q = useMemo<Query>(() => ({
    servico: sp.get('servico') ?? undefined,
    origem: sp.get('origem') ?? undefined,
    destino: sp.get('destino') ?? undefined,
    data: sp.get('data') ?? undefined,
    assentos: sp.get('assentos') ?? undefined,
    passageiros: sp.get('passageiros') ?? undefined,
    preco: sp.get('preco') ?? undefined,
  }), [sp]);

  // 🔥 Parse passageiros - TIPADO
  const passageiros = useMemo<Passageiro[]>(() => {
    try {
      const parsed = q.passageiros ? JSON.parse(decodeURIComponent(q.passageiros)) : [];
      // Validar estrutura
      if (Array.isArray(parsed)) {
        return parsed.filter((p): p is Passageiro => 
          typeof p === 'object' && 
          p !== null &&
          'assento' in p &&
          'nomeCompleto' in p
        );
      }
      return [];
    } catch {
      return [];
    }
  }, [q.passageiros]);

  const primeiroPassageiro: Passageiro = useMemo(() => {
    return passageiros[0] || {
      assento: '',
      nomeCompleto: 'Teste Usuário',
      docTipo: 'CPF',
      docNumero: '12345678909',
      nacionalidade: 'Brasil',
      email: '[email protected]',
      telefone: ''
    };
  }, [passageiros]);

  useEffect(() => {
    async function fetchViagemData() {
      if (!q.servico || !q.origem || !q.destino || !q.data) {
        setLoadingViagem(false);
        return;
      }

      try {
        const url = new URL('/api/viop/onibus', window.location.origin);
        url.searchParams.set('servico', q.servico);
        url.searchParams.set('origemId', q.origem);
        url.searchParams.set('destinoId', q.destino);
        url.searchParams.set('data', q.data);

        const res = await fetch(url, { cache: 'no-store' });
        
        if (res.ok) {
          const json: ApiOnibusRes = await res.json();
          
          setOrigemNome(json?.seats?.origem?.cidade || q.origem || '');
          setDestinoNome(json?.seats?.destino?.cidade || q.destino || '');
          setSaidaHorario(json?.serviceMeta?.saida || '');
          
          const precoFromUrl = q.preco ? Number(q.preco) : null;
          const precoFromApi = json?.serviceMeta?.preco;
          setPrecoReal(precoFromUrl || precoFromApi || null);
        } else {
          setOrigemNome(q.origem || '');
          setDestinoNome(q.destino || '');
          setPrecoReal(q.preco ? Number(q.preco) : null);
        }
      } catch (error) {
        console.error('Erro ao buscar dados da viagem:', error);
        setOrigemNome(q.origem || '');
        setDestinoNome(q.destino || '');
        setPrecoReal(q.preco ? Number(q.preco) : null);
      } finally {
        setLoadingViagem(false);
      }
    }

    fetchViagemData();
  }, [q.servico, q.origem, q.destino, q.data, q.preco]);

  const title = useMemo(() => {
    const o = origemNome || q.origem || 'Origem';
    const d = destinoNome || q.destino || 'Destino';
    return `Passagem ${o} → ${d}`;
  }, [origemNome, destinoNome, q.origem, q.destino]);

  const subtotal = useMemo<number>(() => {
    if (precoReal && precoReal > 0) {
      const numAssentos = q.assentos ? q.assentos.split(',').filter(Boolean).length : 1;
      return precoReal * numAssentos;
    }
    return 89.70;
  }, [precoReal, q.assentos]);

  const taxaServico = useMemo<number>(() => {
    return subtotal * 0.05;
  }, [subtotal]);

  const totalSemJuros = useMemo<number>(() => {
    return subtotal + taxaServico;
  }, [subtotal, taxaServico]);

  const totalComJuros = useMemo<number>(() => {
    const numParcelas = parseInt(installments);
    const taxaJuros = TAXAS_JUROS[numParcelas] || 0;
    return totalSemJuros * (1 + taxaJuros / 100);
  }, [totalSemJuros, installments]);

  const valorJuros = useMemo<number>(() => {
    return totalComJuros - totalSemJuros;
  }, [totalComJuros, totalSemJuros]);

  const dataFormatada = useMemo(() => {
    if (!q.data) return '—';
    const [y, m, d] = q.data.split('-').map(Number);
    if (!y || !m || !d) return q.data;
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  }, [q.data]);

  // 🔥 Buscar observação da rota
  const observacao = getObservacaoRota(
    origemNome,
    destinoNome,
    saidaHorario
  );

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\s/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    setCardExpiry(value);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    setCardCvv(value);
  };

  const getCardBrand = useCallback((number: string): string => {
    const cleaned = number.replace(/\s/g, '');
    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    if (/^6(?:011|5)/.test(cleaned)) return 'discover';
    if (/^3(?:0[0-5]|[68])/.test(cleaned)) return 'diners';
    if (/^35/.test(cleaned)) return 'jcb';
    if (/^(606282|3841)/.test(cleaned)) return 'hipercard';
    if (/^637/.test(cleaned)) return 'elo';
    return '';
  }, []);

  const cardBrand = useMemo(() => getCardBrand(cardNumber), [cardNumber, getCardBrand]);

  const installmentOptions = useMemo(() => {
    const options = [];
    const maxInstallments = 12;
    
    for (let i = 1; i <= maxInstallments; i++) {
      const taxaJuros = TAXAS_JUROS[i] || 0;
      const totalParcelas = totalSemJuros * (1 + taxaJuros / 100);
      const valorParcela = totalParcelas / i;
      
      options.push({
        value: i.toString(),
        label: i === 1 
          ? `1x de R$ ${totalParcelas.toFixed(2)} (taxa ${taxaJuros.toFixed(2)}%)`
          : `${i}x de R$ ${valorParcela.toFixed(2)} (total: R$ ${totalParcelas.toFixed(2)})`
      });
    }
    return options;
  }, [totalSemJuros]);

  const processPayment = useCallback(async () => {
    setErr(null);
    setLoading(true);

    try {
      if (paymentMethod === 'credit_card') {
        if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
          throw new Error('Preencha todos os dados do cartão');
        }

        const cleanCardNumber = cardNumber.replace(/\s/g, '');
        if (cleanCardNumber.length < 13) {
          throw new Error('Número do cartão inválido');
        }

        const response = await fetch('/api/payments/pagarme/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_method: 'credit_card',
            card_number: cleanCardNumber,
            card_name: cardName,
            card_expiry: cardExpiry,
            card_cvv: cardCvv,
            installments: parseInt(installments),
            amount: Math.round(totalComJuros * 100),
            customer: {
              name: primeiroPassageiro.nomeCompleto,
              email: primeiroPassageiro.email?.trim() || '[email protected]',
              document: primeiroPassageiro.docNumero || '12345678909',
              document_type: 'CPF'
            },
            booking: {
              servico: q.servico,
              origem: q.origem,
              destino: q.destino,
              data: q.data,
              assentos: q.assentos?.split(',').map(s => s.trim()),
              passageiros: passageiros
            },
            metadata: {
              title,
              passenger_name: primeiroPassageiro.nomeCompleto
            }
          })
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || 'Erro ao processar pagamento');
        }

        router.push(`/buscar-viop/confirmacao?order_id=${result.order_id}&status=paid`);

      } else if (paymentMethod === 'pix') {
        const response = await fetch('/api/payments/pagarme/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_method: 'pix',
            amount: Math.round(totalSemJuros * 100),
            customer: {
              name: primeiroPassageiro.nomeCompleto,
              email: primeiroPassageiro.email?.trim() || '[email protected]',
              document: primeiroPassageiro.docNumero || '12345678909',
              document_type: 'CPF'
            },
            booking: {
              servico: q.servico,
              origem: q.origem,
              destino: q.destino,
              data: q.data,
              assentos: q.assentos?.split(',').map(s => s.trim()),
              passageiros: passageiros
            },
            metadata: {
              title,
              passenger_name: primeiroPassageiro.nomeCompleto
            }
          })
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || 'Erro ao gerar PIX');
        }

        router.push(`/buscar-viop/pix?order_id=${result.order_id}&qr_code=${encodeURIComponent(result.qr_code)}`);
      }

    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao processar pagamento';
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }, [
    paymentMethod, cardNumber, cardName, cardExpiry, cardCvv, 
    installments, totalComJuros, totalSemJuros, q, title, router, passageiros, primeiroPassageiro
  ]);

  if (loadingViagem) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Carregando informações da viagem...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 py-10">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700 mb-4">
            <Shield className="w-4 h-4" />
            Pagamento 100% seguro com certificação PCI-DSS
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Finalize seu Pagamento</h1>
          <p className="text-slate-600 mt-2">Escolha a forma de pagamento e confirme sua viagem</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-lg border border-slate-200">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Escolha como pagar
              </h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => setPaymentMethod('pix')}
                  className={`relative rounded-xl border-2 p-4 transition-all duration-300 ${
                    paymentMethod === 'pix'
                      ? 'border-blue-600 bg-blue-50 shadow-md scale-105'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <QrCode className={`w-8 h-8 ${paymentMethod === 'pix' ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="font-semibold text-sm">PIX</span>
                    <span className="text-xs text-slate-500">Sem juros</span>
                  </div>
                  {paymentMethod === 'pix' && (
                    <div className="absolute -top-2 -right-2 bg-blue-600 rounded-full p-1">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>

                <button
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`relative rounded-xl border-2 p-4 transition-all duration-300 ${
                    paymentMethod === 'credit_card'
                      ? 'border-blue-600 bg-blue-50 shadow-md scale-105'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <CreditCard className={`w-8 h-8 ${paymentMethod === 'credit_card' ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="font-semibold text-sm">Cartão de Crédito</span>
                    <span className="text-xs text-slate-500">Em até 12x</span>
                  </div>
                  {paymentMethod === 'credit_card' && (
                    <div className="absolute -top-2 -right-2 bg-blue-600 rounded-full p-1">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              </div>

              {paymentMethod === 'pix' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 p-6">
                    <div className="flex items-start gap-4">
                      <div className="rounded-full bg-green-500 p-3">
                        <QrCode className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-green-900 mb-2">Pagamento via PIX</h3>
                        <ul className="text-sm text-green-800 space-y-1">
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Aprovação instantânea
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Sem taxas adicionais
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            QR Code válido por 30 minutos
                          </li>
                        </ul>
                        <p className="mt-4 text-sm text-green-700">
                          Ao clicar em Finalizar, você receberá um QR Code para escanear no app do seu banco.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'credit_card' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white shadow-xl">
                    <div className="flex justify-between items-start mb-8">
                      <div className="text-xs font-medium opacity-75">CARTÃO DE CRÉDITO</div>
                      {cardBrand && (
                        <div className="text-sm font-bold uppercase">{cardBrand}</div>
                      )}
                    </div>
                    <div className="mb-6">
                      <div className="text-2xl font-mono tracking-wider">
                        {cardNumber || '•••• •••• •••• ••••'}
                      </div>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-xs opacity-75 mb-1">TITULAR</div>
                        <div className="font-medium">{cardName || 'NOME NO CARTÃO'}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-75 mb-1">VALIDADE</div>
                        <div className="font-medium">{cardExpiry || 'MM/AA'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Número do cartão
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="0000 0000 0000 0000"
                        className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-20 transition-all"
                        maxLength={19}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Nome no cartão
                      </label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                        placeholder="NOME COMPLETO"
                        className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-20 transition-all uppercase"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Validade
                        </label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={handleExpiryChange}
                          placeholder="MM/AA"
                          className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-20 transition-all"
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          CVV
                        </label>
                        <input
                          type="text"
                          value={cardCvv}
                          onChange={handleCvvChange}
                          placeholder="123"
                          className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-20 transition-all"
                          maxLength={4}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Número de parcelas
                      </label>
                      <select
                        value={installments}
                        onChange={(e) => setInstallments(e.target.value)}
                        className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-20 transition-all cursor-pointer"
                      >
                        {installmentOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {err && (
              <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900">Erro no pagamento</h4>
                    <p className="text-sm text-red-700 mt-1">{err}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={processPayment}
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 font-bold text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processando pagamento...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  {paymentMethod === 'credit_card' ? 'Pagar com Cartão' : 'Gerar QR Code PIX'}
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Conexão segura
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-300" />
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Dados criptografados
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-lg border border-slate-200 sticky top-6">
              <h3 className="font-bold text-lg mb-4">Resumo da Compra</h3>
              
              <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-blue-600 p-2">
                    <Bus className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{title}</p>
                    <div className="mt-2 space-y-1 text-sm text-slate-600">
                      <p>📅 {dataFormatada}</p>
                      <p>💺 Assentos: {q.assentos ?? '—'}</p>
                      <p>🎫 Serviço: {q.servico ?? '—'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 🔥 Observação da rota */}
              {observacao && (
                <div className={`rounded-xl border-2 p-3 mb-4 flex items-start gap-2 ${getCorObservacao(observacao.tipo)}`}>
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="text-xs leading-tight">
                    <div className="font-bold">Atenção!</div>
                    <div>{observacao.icone} {observacao.texto}</div>
                  </div>
                </div>
              )}

              {/* 🔥 Card com TODOS os dados dos passageiros - TIPADO */}
              <div className="rounded-xl border border-slate-200 p-4 mb-4">
                <h4 className="font-semibold mb-3 text-sm text-slate-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  Passageiro{passageiros.length > 1 ? 's' : ''}
                </h4>
                <div className="space-y-3">
                  {passageiros.map((pass: Passageiro, idx: number) => (
                    <div key={idx} className={`${idx > 0 ? 'pt-3 border-t border-slate-100' : ''}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">
                          Assento {pass.assento}
                        </span>
                      </div>
                      <p className="font-medium text-slate-900 text-sm">{pass.nomeCompleto}</p>
                      <div className="text-xs text-slate-600 space-y-0.5 mt-1">
                        <p>{pass.docTipo}: {pass.docNumero}</p>
                        {pass.email && (
                          <p className="flex items-center gap-1">
                            <Mail className="w-3 h-3" /> 
                            {pass.email}
                          </p>
                        )}
                        {pass.telefone && (
                          <p className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> 
                            {pass.telefone}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-600">Taxa de serviço (5%)</span>
                  <span className="font-medium text-blue-600">R$ {taxaServico.toFixed(2)}</span>
                </div>
                
                {paymentMethod === 'credit_card' && valorJuros > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600">Juros ({TAXAS_JUROS[parseInt(installments)]}%)</span>
                    <span className="font-medium text-orange-600">R$ {valorJuros.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-4 border-t-2 border-slate-300">
                  <span className="text-lg font-bold">Total a Pagar</span>
                  <span className="text-2xl font-bold text-blue-600">
                    R$ {paymentMethod === 'pix' ? totalSemJuros.toFixed(2) : totalComJuros.toFixed(2)}
                  </span>
                </div>
              </div>

              {paymentMethod === 'credit_card' && installments !== '1' && (
                <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                  💳 {installments}x de R$ {(totalComJuros / parseInt(installments)).toFixed(2)}
                </div>
              )}
            </div>

            <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-full bg-green-500 p-2">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <h4 className="font-bold text-green-900">Ambiente Seguro</h4>
              </div>
              <ul className="text-xs text-green-800 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                  Certificação PCI-DSS Level 1
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                  Criptografia de ponta a ponta
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                  Seus dados nunca são armazenados
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-900">Sessão expira em</p>
                <p className="text-xs text-amber-700">10:00 minutos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function LoadingFallback() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 font-semibold">Carregando pagamento...</p>
      </div>
    </main>
  );
}

export default function PagamentoPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PagamentoContent />
    </Suspense>
  );
}