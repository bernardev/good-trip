// lib/mp.ts
import { MercadoPagoConfig } from 'mercadopago';

export const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN ?? '',
});

export function assertMP(): void {
  if (!process.env.MP_ACCESS_TOKEN) {
    throw new Error('MP_ACCESS_TOKEN ausente no ambiente.');
  }
  if (!process.env.MP_ACCESS_TOKEN.startsWith('TEST-') && process.env.NODE_ENV !== 'production') {
    // Em dev, recomendo fortemente token TEST
    // (não lança erro pra não travar, só avisa)
    // eslint-disable-next-line no-console
    console.warn('[MP] Usando token não-TEST em ambiente de desenvolvimento.');
  }
}
