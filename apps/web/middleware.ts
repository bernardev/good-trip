import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { kv } from "@vercel/kv";

// 🔒 Rate limiting — 2 tentativas por IP a cada 10 minutos
const RATE_LIMIT_MAX = 2;
const RATE_LIMIT_WINDOW_S = 10 * 60; // 10 minutos em segundos

async function checkRateLimit(ip: string): Promise<boolean> {
  const key = `rate_limit:payment:${ip}`;

  try {
    const count = await kv.incr(key);

    // Na primeira tentativa, define o TTL de 10 minutos
    if (count === 1) {
      await kv.expire(key, RATE_LIMIT_WINDOW_S);
    }

    return count <= RATE_LIMIT_MAX;
  } catch (error) {
    // Se o KV falhar, deixa passar para não bloquear usuários legítimos
    console.error('Erro no rate limit KV:', error);
    return true;
  }
}

export async function middleware(req: NextRequest) {
  // Rate limiting para rota de pagamento
  if (req.nextUrl.pathname.startsWith('/api/payments/pagarme/process')) {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    const allowed = await checkRateLimit(ip);

    if (!allowed) {
      console.warn(`Rate limit atingido para IP: ${ip}`);
      return NextResponse.json(
        {
          success: false,
          message: 'Muitas tentativas. Aguarde 10 minutos e tente novamente.',
          code: 'rate_limit_exceeded',
        },
        { status: 429 }
      );
    }
  }

  // Proteção do admin (existente)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAuthed = !!token;

  if (req.nextUrl.pathname.startsWith("/admin") && !isAuthed) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/payments/pagarme/process"],
};