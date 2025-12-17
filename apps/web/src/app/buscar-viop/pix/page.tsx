'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import {
  Copy,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Smartphone
} from 'lucide-react';

function PixContent() {
  const sp = useSearchParams();
  const router = useRouter();

  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [checking, setChecking] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);

  const orderId = sp.get('order_id');
  const qrCode = sp.get('qr_code'); // PIX Copia e Cola (EMV)

  // ⏱️ Contador
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // 🔄 Verifica pagamento
  useEffect(() => {
    if (!orderId) return;

    const checkPayment = async () => {
      if (checking) return;
      setChecking(true);

      try {
        const res = await fetch(`/api/payments/pagarme/check?order_id=${orderId}`);
        const data = await res.json();

        if (data.status === 'paid') {
          router.push(`/buscar-viop/confirmacao?order_id=${orderId}&status=paid`);
        }
      } catch (err) {
        console.error('Erro ao verificar pagamento:', err);
      } finally {
        setChecking(false);
      }
    };

    checkPayment();
    const interval = setInterval(checkPayment, 5000);
    return () => clearInterval(interval);
  }, [orderId, router, checking]);

  // 🧠 GERA O QR CODE REAL AQUI
  useEffect(() => {
    if (!qrCode) return;

    QRCode.toDataURL(qrCode, {
      width: 256,
      margin: 2
    })
      .then(setQrCodeImage)
      .catch(err => console.error('Erro ao gerar QR Code:', err));
  }, [qrCode]);

  // 📋 Copiar Pix
  const copyToClipboard = useCallback(() => {
    if (!qrCode) return;
    navigator.clipboard.writeText(qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [qrCode]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (!orderId || !qrCode) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Dados do PIX não encontrados</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-xl px-4">

        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 mb-6 text-slate-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <h1 className="text-2xl font-bold text-center mb-2">Pagamento via PIX</h1>
        <p className="text-center text-slate-500 mb-6">
          Escaneie o QR Code ou copie o código
        </p>

        {/* TEMPO */}
        <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
          <Clock className="mx-auto mb-1 text-amber-600" />
          <p className="text-2xl font-bold text-amber-600">{formatTime(timeLeft)}</p>
        </div>

        {/* QR CODE */}
        <div className="bg-white p-6 rounded-xl shadow border text-center mb-6">
          {qrCodeImage ? (
            <img
              src={qrCodeImage}
              alt="QR Code PIX"
              className="mx-auto w-64 h-64"
            />
          ) : (
            <p className="text-slate-400">Gerando QR Code...</p>
          )}
        </div>

        {/* COPIA E COLA */}
        <div className="bg-white p-6 rounded-xl shadow border mb-6">
          <label className="block text-sm font-semibold mb-2">Pix Copia e Cola</label>
          <div className="flex gap-2">
            <input
              value={qrCode}
              readOnly
              className="flex-1 border rounded-lg px-3 py-2 text-xs font-mono"
            />
            <button
              onClick={copyToClipboard}
              className={`px-4 rounded-lg ${
                copied ? 'bg-green-500' : 'bg-blue-600'
              } text-white`}
            >
              {copied ? <CheckCircle2 /> : <Copy />}
            </button>
          </div>
        </div>

        {/* INSTRUÇÕES */}
        <div className="bg-white p-6 rounded-xl shadow border">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Smartphone className="w-5 h-5" /> Como pagar
          </h3>
          <ol className="space-y-2 text-sm text-slate-600">
            <li>1. Abra o app do seu banco</li>
            <li>2. Escolha pagar com PIX</li>
            <li>3. Escaneie o QR Code ou cole o código</li>
            <li>4. Confirme o pagamento</li>
          </ol>
        </div>
      </div>
    </main>
  );
}

function LoadingFallback() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <p>Carregando PIX...</p>
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
