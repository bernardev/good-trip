'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
import QRCode from 'qrcode';
import { QrCode, Copy, CheckCircle2, Clock, ArrowLeft, Smartphone, AlertTriangle } from 'lucide-react';

interface PaymentCheckResponse {
  status: string;
}

function PixContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const orderId = sp.get('order_id');
  const qrCode = sp.get('qr_code');
  // 🧪 TESTE: ?test_timer=30 para testar expiração rápida (remover antes do deploy)
  const testTimer = sp.get('test_timer');
  const initialTime = testTimer ? parseInt(testTimer, 10) : 600;

  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [checking, setChecking] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ⏱️ Contador de tempo
  useEffect(() => {
    if (timeLeft <= 0) {
      setExpired(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // 🛑 Parar polling quando expirar + notificar admin
  useEffect(() => {
    if (expired) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      // 📊 Tracking: PIX expirou sem pagamento
      fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evento: 'PIX_EXPIRADO',
          dados: { orderId },
        }),
      }).catch(() => {});
    }
  }, [expired, orderId]);

  // 🔄 Verifica pagamento (só enquanto não expirou)
  useEffect(() => {
    if (!orderId || expired) return;

    const checkPayment = async () => {
      if (checking) return;

      setChecking(true);
      try {
        const res = await fetch(`/api/payments/pagarme/check?order_id=${orderId}`);
        const data = await res.json() as PaymentCheckResponse;

        if (data.status === 'paid') {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          router.push(`/buscar-viop/confirmacao?order_id=${orderId}&status=paid`);
        }
      } catch (error: unknown) {
        console.error('Erro ao verificar pagamento:', error);
      } finally {
        setChecking(false);
      }
    };

    checkPayment();
    pollingRef.current = setInterval(checkPayment, 5000);
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [orderId, expired]);

  // 🖼️ GERA O QR CODE REAL
  useEffect(() => {
    if (!qrCode) return;

    QRCode.toDataURL(qrCode, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
      .then(setQrCodeImage)
      .catch((err: unknown) => console.error('Erro ao gerar QR Code:', err));
  }, [qrCode]);

  // 📋 Copiar para área de transferência
  const copyToClipboard = useCallback(() => {
    if (!qrCode) return;

    navigator.clipboard.writeText(qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [qrCode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!orderId || !qrCode) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Dados do PIX não encontrados</h1>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Voltar
          </button>
        </div>
      </main>
    );
  }

  // 🛑 Tela de PIX expirado
  if (expired) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-slate-50 py-10">
        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-2xl bg-white p-8 shadow-xl border border-red-200 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-3">
              PIX expirado
            </h1>
            <p className="text-slate-600 mb-2">
              O tempo para pagamento via PIX esgotou.
            </p>
            <p className="text-sm text-slate-500 mb-8">
              Se você já realizou o pagamento após o prazo, o estorno será processado automaticamente.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => router.back()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all"
              >
                Tentar novamente
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all"
              >
                Voltar ao início
              </button>
            </div>

            <div className="mt-6 text-center text-sm text-slate-500">
              <p>Pedido: {orderId}</p>
              <p className="mt-1">Em caso de dúvidas, entre em contato com nosso suporte</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 py-10">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700 mb-4">
              <QrCode className="w-4 h-4" />
              Pagamento via PIX
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Escaneie o QR Code</h1>
            <p className="text-slate-600 mt-2">Use o aplicativo do seu banco para pagar</p>
          </div>
        </div>

        <div className={`rounded-2xl p-4 mb-6 border-2 ${
          timeLeft <= 60
            ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-300'
            : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
        }`}>
          <div className="flex items-center justify-center gap-3">
            <Clock className={`w-5 h-5 ${timeLeft <= 60 ? 'text-red-600' : 'text-amber-600'}`} />
            <div>
              <p className={`text-sm font-semibold ${timeLeft <= 60 ? 'text-red-900' : 'text-amber-900'}`}>
                Tempo restante para pagamento
              </p>
              <p className={`text-2xl font-bold ${timeLeft <= 60 ? 'text-red-600' : 'text-amber-600'}`}>
                {formatTime(timeLeft)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-xl border border-slate-200 mb-6">
          <div className="bg-white p-8 rounded-xl border-4 border-slate-100 mb-6 flex items-center justify-center">
            {qrCodeImage ? (
              <img
                src={qrCodeImage}
                alt="QR Code PIX"
                className="w-64 h-64 rounded-lg"
              />
            ) : (
              <div className="w-64 h-64 bg-slate-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <QrCode className="w-32 h-32 text-slate-400 mx-auto mb-4 animate-pulse" />
                  <p className="text-sm text-slate-500">Gerando QR Code...</p>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Pix Copia e Cola
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={qrCode}
                readOnly
                className="flex-1 rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-mono bg-slate-50"
              />
              <button
                onClick={copyToClipboard}
                className={`rounded-xl px-6 py-3 font-semibold transition-all ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {copied ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
            {copied && (
              <p className="text-sm text-green-600 mt-2 animate-in fade-in">
                ✓ Código copiado! Cole no seu app de pagamento
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-lg border border-slate-200 mb-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-600" />
            Como pagar com PIX
          </h3>

          <ol className="space-y-4">
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                1
              </div>
              <div>
                <p className="font-semibold text-slate-900">Abra o app do seu banco</p>
                <p className="text-sm text-slate-600">Qualquer banco ou carteira digital que aceite PIX</p>
              </div>
            </li>

            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                2
              </div>
              <div>
                <p className="font-semibold text-slate-900">Escolha pagar com PIX</p>
                <p className="text-sm text-slate-600">Selecione a opção de QR Code ou Pix Copia e Cola</p>
              </div>
            </li>

            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                3
              </div>
              <div>
                <p className="font-semibold text-slate-900">Escaneie ou cole o código</p>
                <p className="text-sm text-slate-600">Use a câmera para o QR Code ou copie o código acima</p>
              </div>
            </li>

            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                4
              </div>
              <div>
                <p className="font-semibold text-slate-900">Confirme o pagamento</p>
                <p className="text-sm text-slate-600">Aguarde a confirmação automática (alguns segundos)</p>
              </div>
            </li>
          </ol>
        </div>

        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-blue-700">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="font-medium">Aguardando pagamento...</span>
          </div>
          <p className="text-sm text-blue-600 mt-2">
            Você será redirecionado automaticamente após a confirmação
          </p>
        </div>

        <div className="mt-6 text-center text-sm text-slate-500">
          <p>Pedido: {orderId}</p>
          <p className="mt-1">Em caso de dúvidas, entre em contato com nosso suporte</p>
        </div>
      </div>
    </main>
  );
}

function LoadingFallback() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 font-semibold">Carregando PIX...</p>
      </div>
    </main>
  );
}

export default function PixPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PixContent />
    </Suspense>
  );
}
