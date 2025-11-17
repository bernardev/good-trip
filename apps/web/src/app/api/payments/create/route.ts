// apps/web/src/app/api/payments/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Preference } from 'mercadopago';
import { mpClient, assertMP } from '@/lib/mp';
import type { CreatePaymentBody, CreatePaymentResponse, PassengerInfo, ViopBookingMeta } from '@/types/payments';

/** ===== Tipos auxiliares fortemente tipados ===== */
type DocType = PassengerInfo['documentoTipo'];

type PreferenceItem = {
  id: string;
  title: string;
  quantity: number;
  currency_id: 'BRL';
  unit_price: number;
};

type PreferencePayer = {
  name: string;
  surname: string;
  email: string;
  identification: {
    type: DocType;
    number: string;
  };
};

type PreferenceBackUrls = {
  success: string;
  failure: string;
  pending: string;
};

type PreferenceBody = {
  items: PreferenceItem[];
  payer: PreferencePayer;
  back_urls: PreferenceBackUrls;
  notification_url: string;
  metadata: {
    provider: 'viop';
  } & ViopBookingMeta;
};

type MPPreferenceCreateResponse = {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
};

/** ===== Constantes / helpers ===== */
const TEST_CPF = '19119119100';
const TEST_EMAIL = 'test_buyer_123456@example.com';

function isTestToken(): boolean {
  return (process.env.MP_ACCESS_TOKEN ?? '').startsWith('TEST-');
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function isPositiveNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n > 0;
}

function isDocType(v: unknown): v is DocType {
  return v === 'CPF' || v === 'RG' || v === 'PASSAPORTE';
}

function isValidBooking(b: unknown): b is ViopBookingMeta {
  if (typeof b !== 'object' || b === null) return false;
  const bb = b as Record<string, unknown>;
  return (
    isNonEmptyString(bb.servico) &&
    isNonEmptyString(bb.origemId) &&
    isNonEmptyString(bb.destinoId) &&
    isNonEmptyString(bb.data) &&
    Array.isArray(bb.assentos) &&
    (bb.assentos as unknown[]).every(isNonEmptyString)
  );
}

/** Asserta que body é CreatePaymentBody em runtime (sem `any`). */
function assertCreatePaymentBody(body: unknown): asserts body is CreatePaymentBody {
  if (typeof body !== 'object' || body === null) {
    throw new Error('Body inválido (não-objeto).');
  }
  const b = body as Record<string, unknown>;
  if (!isPositiveNumber(b.amount)) throw new Error('Valor inválido (amount).');
  if (!isNonEmptyString(b.title)) throw new Error('Título inválido (title).');
  if (b.quantity !== undefined && !(typeof b.quantity === 'number' && Number.isFinite(b.quantity))) {
    throw new Error('Quantity inválido.');
  }

  const payer = b.payer as Record<string, unknown> | undefined;
  if (!payer) throw new Error('Payer ausente.');
  if (!isNonEmptyString(payer.nome)) throw new Error('Payer.nome inválido.');
  if (!isNonEmptyString(payer.sobrenome)) throw new Error('Payer.sobrenome inválido.');
  if (!isDocType(payer.documentoTipo)) throw new Error('Payer.documentoTipo inválido.');
  if (!isNonEmptyString(payer.documentoNumero)) throw new Error('Payer.documentoNumero inválido.');
  if (!isNonEmptyString(payer.email)) throw new Error('Payer.email inválido.');

  if (!isValidBooking(b.booking)) throw new Error('Booking inválido.');
  if (b.successUrl && !isNonEmptyString(b.successUrl)) throw new Error('successUrl inválida.');
  if (b.failureUrl && !isNonEmptyString(b.failureUrl)) throw new Error('failureUrl inválida.');
  if (b.pendingUrl && !isNonEmptyString(b.pendingUrl)) throw new Error('pendingUrl inválida.');
}

/** Narrow de erro do SDK MP sem `any` */
function extractMPErrMsg(err: unknown): string {
  // Alguns erros do SDK vêm como { message: string, cause: [{ description: string }] }
  if (typeof err === 'object' && err !== null) {
    const e = err as { message?: unknown; cause?: unknown };
    const base = isNonEmptyString(e.message) ? e.message : 'Erro desconhecido';
    if (Array.isArray(e.cause) && e.cause.length > 0) {
      const first = e.cause[0] as { description?: unknown };
      if (isNonEmptyString(first?.description)) {
        return `${base} — ${first.description}`;
      }
    }
    return base;
  }
  return 'Erro desconhecido';
}

/** Monta um PreferenceBody fortemente tipado */
function buildPreferenceBody(
  amount: number,
  quantity: number,
  title: string,
  payer: PassengerInfo,
  backUrls: PreferenceBackUrls,
  notificationUrl: string,
  booking: ViopBookingMeta
): PreferenceBody {
  const useTest = isTestToken();

  const payerName = isNonEmptyString(payer.nome) ? payer.nome.trim() : 'Teste';
  const payerSurname = isNonEmptyString(payer.sobrenome) ? payer.sobrenome.trim() : 'Usuário';
  const docType: DocType = isDocType(payer.documentoTipo) ? payer.documentoTipo : 'CPF';

  const cleanedDoc = isNonEmptyString(payer.documentoNumero) ? payer.documentoNumero.replace(/\D/g, '') : '';
  const docNumber = useTest
    ? (cleanedDoc.length === 11 ? cleanedDoc : TEST_CPF)
    : (cleanedDoc || TEST_CPF);

  const payerEmail = useTest
    ? (isNonEmptyString(payer.email) ? payer.email : TEST_EMAIL)
    : (isNonEmptyString(payer.email) ? payer.email : TEST_EMAIL);

  return {
    items: [
      {
        id: 'viop-ticket',
        title,
        quantity,
        currency_id: 'BRL',
        unit_price: amount,
      },
    ],
    payer: {
      name: payerName,
      surname: payerSurname,
      email: payerEmail,
      identification: {
        type: docType,
        number: docNumber,
      },
    },
    back_urls: backUrls,
    notification_url: notificationUrl,
    metadata: {
      provider: 'viop',
      ...booking,
    },
  };
}

/** ===== Handler ===== */
export async function POST(req: NextRequest) {
  try {
    assertMP();

    const raw = await req.json();
    assertCreatePaymentBody(raw); // runtime guard -> agora `raw` é CreatePaymentBody

    const body = raw; // tipado como CreatePaymentBody
    const amount = Number(body.amount);
    const quantity = Math.max(1, Number(body.quantity ?? 1));

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const backUrls: PreferenceBackUrls = {
      success: isNonEmptyString(body.successUrl) ? body.successUrl : `${baseUrl}/buscar-viop/confirmacao`,
      failure: isNonEmptyString(body.failureUrl) ? body.failureUrl : `${baseUrl}/buscar-viop/pagamento?status=failure`,
      pending: isNonEmptyString(body.pendingUrl) ? body.pendingUrl : `${baseUrl}/buscar-viop/pagamento?status=pending`,
    };

    const preference = new Preference(mpClient);

    const prefPayload = buildPreferenceBody(
      amount,
      quantity,
      body.title,
      body.payer,
      backUrls,
      `${baseUrl}/api/payments/webhook`,
      body.booking
    );

    const prefResp = await preference.create({ body: prefPayload }) as MPPreferenceCreateResponse;

    const okResponse: CreatePaymentResponse = {
      ok: true,
      preferenceId: prefResp.id ?? '',
      initPoint: prefResp.init_point ?? '',
      sandboxInitPoint: prefResp.sandbox_init_point ?? undefined,
    };

    if (!okResponse.preferenceId || !okResponse.initPoint) {
      // resposta inesperada do SDK
      return NextResponse.json<CreatePaymentResponse>(
        { ok: false, error: 'Resposta inválida do Mercado Pago.' },
        { status: 400 }
      );
    }

    return NextResponse.json<CreatePaymentResponse>(okResponse);
  } catch (err: unknown) {
    const error = extractMPErrMsg(err);
    // eslint-disable-next-line no-console
    console.error('[MP][CREATE] erro:', err);
    const res: CreatePaymentResponse = { ok: false, error };
    return NextResponse.json<CreatePaymentResponse>(res, { status: 400 });
  }
}
