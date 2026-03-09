// apps/web/src/app/api/minha-passagem/enviar-codigo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || 'noreply@ehcode.dev';
const SMTP_PASS = process.env.SMTP_PASS || '';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 });
    }

    const emailNormalizado = email.toLowerCase().trim();

    // Verificar se existe bilhete para esse email
    const bilhetes = await kv.get<string[]>(`bilhetes-email:${emailNormalizado}`);

    if (!bilhetes || bilhetes.length === 0) {
      // Retornar sucesso mesmo sem bilhetes (segurança: não revelar se email existe)
      return NextResponse.json({ success: true, message: 'Se houver compras vinculadas, o código será enviado.' });
    }

    // Rate limit: máximo 3 códigos por email a cada 10 minutos
    const rateLimitKey = `otp-rate:${emailNormalizado}`;
    const tentativas = await kv.get<number>(rateLimitKey) || 0;
    if (tentativas >= 3) {
      return NextResponse.json({ error: 'Muitas tentativas. Aguarde 10 minutos.' }, { status: 429 });
    }
    await kv.set(rateLimitKey, tentativas + 1, { ex: 600 });

    // Gerar código OTP de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    // Salvar OTP no KV com TTL de 3 horas
    await kv.set(`otp:${emailNormalizado}`, codigo, { ex: 10800 });

    // Enviar email com o código
    if (SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
        tls: { rejectUnauthorized: false },
      });

      await transporter.sendMail({
        from: `"Good Trip" <${SMTP_USER}>`,
        to: emailNormalizado,
        subject: 'Código de acesso - Good Trip',
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
  <div style="max-width: 500px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 25px; text-align: center; border-radius: 12px 12px 0 0;">
      <h2 style="margin: 0;">Good Trip</h2>
    </div>
    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
      <p>Olá! Seu código de acesso para consultar suas passagens é:</p>
      <div style="background: #dbeafe; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <strong style="font-size: 32px; letter-spacing: 6px; color: #1e40af;">${codigo}</strong>
      </div>
      <p style="color: #6b7280; font-size: 14px;">Este código é válido por <strong>3 horas</strong>.</p>
      <p style="color: #6b7280; font-size: 14px;">Se você não solicitou este código, ignore este email.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">Good Trip - Passagens Rodoviárias</p>
    </div>
  </div>
</body>
</html>`,
      });
    }

    return NextResponse.json({ success: true, message: 'Código enviado para seu email.' });

  } catch (error) {
    console.error('[minha-passagem] Erro ao enviar código:', error);
    return NextResponse.json({ error: 'Erro ao enviar código' }, { status: 500 });
  }
}
