'use client';

import { useSearchParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';

export default function ConfirmacaoPage() {
  const sp = useSearchParams();
  const paymentId = sp.get('payment_id');
  const status = sp.get('status'); // approved | pending | failure (quando auto_return não é approved)
  const preferenceId = sp.get('preference_id');

  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-2xl px-4">
        <div className="rounded-2xl bg-white border p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
          <h1 className="text-2xl font-bold mb-1">Pagamento recebido!</h1>
          <p className="text-slate-600">
            Status: <strong>{status ?? '—'}</strong><br />
            Payment ID: <strong>{paymentId ?? '—'}</strong><br />
            Preference: <strong>{preferenceId ?? '—'}</strong>
          </p>
          <p className="mt-4 text-sm text-slate-500">
            (Aqui você chama a etapa final da VIOP para emitir a reserva usando os metadados guardados no webhook.)
          </p>
        </div>
      </div>
    </main>
  );
}
