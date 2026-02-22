// apps/web/src/app/api/payments/pagarme/process/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { notificarAdmin } from '@/lib/notificacoes-admin';

const PAGARME_SECRET_KEY = process.env.PAGARME_SECRET_KEY || '';
const PAGARME_API_URL = 'https://api.pagar.me/core/v5';
const isSimulationMode = !PAGARME_SECRET_KEY || PAGARME_SECRET_KEY.length < 10;

const getAuthHeader = (): string => {
  const auth = Buffer.from(`${PAGARME_SECRET_KEY}:`).toString('base64');
  return `Basic ${auth}`;
};

type Passageiro = {
  assento: string;
  nomeCompleto: string;
  docNumero: string;
  docTipo: string;
  nacionalidade: string;
  telefone: string;
  email?: string;
};

type ReservaData = {
  servico?: string;
  origem?: string;
  destino?: string;
  data?: string;
  assentos: string[];
  passageiros: Passageiro[];
  preco: number;
  chargeId?: string;
  metadata?: Record<string, unknown>;
};

type CustomerData = {
  name: string;
  email: string;
  type: 'individual';
  document: string;
  document_type: string;
  phones: {
    mobile_phone: {
      country_code: string;
      area_code: string;
      number: string;
    };
  };
};

type OrderItem = {
  code: string;
  description: string;
  amount: number;
  quantity: number;
};

type PagarmeCharge = {
  id: string;
  status: string;
  last_transaction?: {
    gateway_response?: {
      message?: string;
    };
    qr_code?: string;
    qr_code_url?: string;
    qr_code_data?: string;
    expires_at?: string;
    type?: string;
    pix?: {
      qr_code?: string;
      qr_code_url?: string;
    };
  };
  qr_code?: string;
  qr_code_url?: string;
};

type PagarmeOrder = {
  id: string;
  charges: PagarmeCharge[];
};

type RequestBody = {
  payment_method: 'credit_card' | 'pix';
  amount: number;
  customer: {
    name: string;
    email?: string;
    document: string;
    document_type?: string;
    phone?: {
      area_code?: string;
      number?: string;
    };
  };
  booking?: {
    servico?: string;
    origem?: string;
    destino?: string;
    data?: string;
    assentos?: string[];
    passageiros?: Passageiro[];
  };
  metadata?: Record<string, unknown>;
  card_number?: string;
  card_name?: string;
  card_expiry?: string;
  card_cvv?: string;
  installments?: number;
  recaptcha_token?: string;
  fingerprint?: string;
};

async function salvarDadosReserva(orderId: string, chargeId: string, data: ReservaData): Promise<void> {
  try {
    const dadosComChargeId: ReservaData = {
      ...data,
      chargeId
    };
    
    await kv.set(`reserva:${orderId}`, JSON.stringify(dadosComChargeId), { ex: 3600 });
    console.log('💾 Dados salvos no KV:', { orderId, chargeId });
  } catch (error) {
    console.error('❌ Erro ao salvar no KV:', error);
  }
}

// Validação reCAPTCHA v3
async function validarRecaptcha(token: string): Promise<{ valido: boolean; score: number }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    console.warn('⚠️ RECAPTCHA_SECRET_KEY não configurada, pulando validação');
    return { valido: true, score: 1 };
  }

  if (!token) {
    console.warn('Token reCAPTCHA ausente');
    return { valido: false, score: 0 };
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secretKey}&response=${token}`,
    });
  const data = await response.json() as { success: boolean; score: number; action: string; 'error-codes'?: string[] };
  console.log('reCAPTCHA resultado COMPLETO:', JSON.stringify(data));
  return { valido: data.success && data.score >= 0.5, score: data.score ?? 0 };
  } catch (error) {
    console.error('Erro ao validar reCAPTCHA:', error);
    return { valido: false, score: 0 };
  }
}

async function validarFingerprint(fingerprint: string): Promise<{ valido: boolean }> {
  if (!fingerprint) return { valido: true }; // se não veio, deixa passar

  const key = `rate_limit:fingerprint:${fingerprint}`;
  try {
    const count = await kv.incr(key);
    if (count === 1) await kv.expire(key, 20 * 60); // 20 minutos
    return { valido: count <= 2 };
  } catch (error) {
    console.error('❌ Erro na validação de fingerprint:', error);
    return { valido: true };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { 
      payment_method, 
      amount, 
      customer, 
      booking, 
      metadata,
      card_number,
      card_name,
      card_expiry,
      card_cvv,
      installments,
      recaptcha_token,
      fingerprint,
    } = body;

    if (!payment_method || !amount || !customer) {
      return NextResponse.json({
        success: false,
        message: 'Dados obrigatórios faltando'
      }, { status: 400 });
    }

    if (!isSimulationMode) {
    const recaptcha = await validarRecaptcha(recaptcha_token || '');
      if (!recaptcha.valido) {
        console.warn('🚨 reCAPTCHA reprovado — possível bot/fraude. Score:', recaptcha.score);
        notificarAdmin({
          tipo: 'ERRO_PAGAMENTO',
          passageiro: customer?.name,
          valor: amount / 100,
          erro: 'Bloqueado por reCAPTCHA',
          detalhes: `Score: ${recaptcha.score} — possível tentativa automatizada`,
        }).catch(console.error);
        return NextResponse.json({
          success: false,
          message: 'Verificação de segurança falhou. Recarregue a página e tente novamente.',
          code: 'recaptcha_failed',
        }, { status: 403 });
      }
      console.log(`✅ reCAPTCHA aprovado (score: ${recaptcha.score})`);
    }
    if (fingerprint) {
  const fp = await validarFingerprint(fingerprint);
  if (!fp.valido) {
    console.warn('Fingerprint bloqueado:', fingerprint);
    notificarAdmin({
      tipo: 'ERRO_PAGAMENTO',
      passageiro: customer?.name,
      valor: amount / 100,
      erro: 'Bloqueado por fingerprint',
      detalhes: `Dispositivo ${fingerprint} excedeu o limite de tentativas`,
    }).catch(console.error);
    return NextResponse.json({
      success: false,
      message: 'Muitas tentativas deste dispositivo. Aguarde 20 minutos.',
      code: 'fingerprint_blocked',
    }, { status: 429 });
  }
}

    const reservaData: ReservaData = {
      servico: booking?.servico,
      origem: booking?.origem,
      destino: booking?.destino,
      data: booking?.data,
      assentos: booking?.assentos || [],
      passageiros: booking?.passageiros || [],
      preco: amount / 100,
      metadata,
    };

    console.log('📦 Dados da reserva preparados:', {
      servico: reservaData.servico,
      assentos: reservaData.assentos,
      passageiros: reservaData.passageiros.length,
      precoTotal: reservaData.preco
    });

    // ========== MODO SIMULAÇÃO ==========
    if (isSimulationMode) {
      console.log('🔧 MODO SIMULAÇÃO ATIVO');
      console.log('📋 Dados recebidos:', JSON.stringify({
        payment_method,
        amount,
        customer: customer.name,
        installments,
        passageiros: reservaData.passageiros.length
      }, null, 2));

      await new Promise(resolve => setTimeout(resolve, 2000));

      if (payment_method === 'credit_card') {
        if (card_cvv && card_cvv.startsWith('6')) {
          // 🔥 Notificar erro
          notificarAdmin({
            tipo: 'ERRO_PAGAMENTO',
            passageiro: customer.name,
            valor: amount / 100,
            erro: 'Cartão recusado (simulação)',
            detalhes: 'CVV iniciado com 6'
          }).catch(console.error);

          return NextResponse.json({
            success: false,
            message: 'Cartão recusado pelo banco emissor',
            code: 'card_declined'
          });
        }

        const orderId = `sim_order_${Date.now()}`;
        const chargeId = `sim_charge_${Date.now()}`;
        
        await salvarDadosReserva(orderId, chargeId, reservaData);

        // 🔥 Notificar pagamento aprovado
        notificarAdmin({
          tipo: 'CARTAO_PROCESSADO',
          orderId,
          passageiro: customer.name,
          origem: booking?.origem,
          destino: booking?.destino,
          valor: amount / 100,
          cupom: metadata?.cupom as string | undefined
        }).catch(console.error);

        return NextResponse.json({
          success: true,
          order_id: orderId,
          charge_id: chargeId,
          status: 'paid',
          message: '✅ Pagamento simulado com sucesso!',
          simulation: true
        });
      }

      if (payment_method === 'pix') {
        const orderId = `sim_pix_order_${Date.now()}`;
        const chargeId = `sim_pix_charge_${Date.now()}`;
        
        await salvarDadosReserva(orderId, chargeId, reservaData);

        // 🔥 Notificar PIX gerado
        notificarAdmin({
          tipo: 'PIX_GERADO',
          orderId,
          passageiro: customer.name,
          origem: booking?.origem,
          destino: booking?.destino,
          valor: amount / 100
        }).catch(console.error);

        return NextResponse.json({
          success: true,
          order_id: orderId,
          charge_id: chargeId,
          qr_code: 'SIMULADO_QR_CODE_' + Math.random().toString(36).substring(7).toUpperCase(),
          qr_code_url: 'https://exemplo.com/qr-code-simulado.png',
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          message: '✅ PIX simulado gerado!',
          simulation: true
        });
      }
    }

    // ========== MODO REAL ==========

    const customerData: CustomerData = {
      name: customer.name,
      email: customer.email || 'naotemmail@goodtrip.com.br',
      type: 'individual',
      document: customer.document.replace(/\D/g, ''),
      document_type: customer.document_type || 'CPF',
      phones: {
        mobile_phone: {
          country_code: '55',
          area_code: customer.phone?.area_code || '11',
          number: customer.phone?.number || '999999999'
        }
      }
    };

    const items: OrderItem[] = [{
      code: "PASSAGEM_ONIBUS",
      description: (metadata?.title as string) || 'Passagem de ônibus',
      amount: amount,
      quantity: 1
    }];

    if (payment_method === 'credit_card') {
      if (!card_number || !card_name || !card_expiry || !card_cvv) {
        return NextResponse.json({
          success: false,
          message: 'Dados do cartão incompletos'
        }, { status: 400 });
      }

      const expiryParts = card_expiry.split('/');
      if (expiryParts.length !== 2) {
        return NextResponse.json({
          success: false,
          message: 'Data de validade inválida'
        }, { status: 400 });
      }

      const orderData = {
        items,
        customer: customerData,
        payments: [{
          payment_method: 'credit_card',
          credit_card: {
            installments: installments || 1,
            statement_descriptor: 'VIACAO VIOP',
            card: {
              number: card_number.replace(/\s/g, ''),
              holder_name: card_name,
              exp_month: parseInt(expiryParts[0]),
              exp_year: parseInt('20' + expiryParts[1]),
              cvv: card_cvv,
              billing_address: {
                line_1: 'Rua Exemplo, 123',
                zip_code: '01310100',
                city: 'São Paulo',
                state: 'SP',
                country: 'BR'
              }
            }
          }
        }],
        metadata: {
          ...metadata,
          booking_data: JSON.stringify(booking)
        }
      };

      console.log('📤 Enviando pedido REAL para Pagar.me...');

      const response = await fetch(`${PAGARME_API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData: unknown = await response.json();
        console.error('❌ Erro da API Pagar.me:', errorData);
        
        // 🔥 Notificar erro
        notificarAdmin({
          tipo: 'ERRO_PAGAMENTO',
          passageiro: customer.name,
          valor: amount / 100,
          erro: 'Erro Pagar.me',
          detalhes: (errorData as { message?: string }).message || 'Erro desconhecido'
        }).catch(console.error);
        
        return NextResponse.json({
          success: false,
          message: (errorData as { message?: string }).message || 'Erro ao processar pagamento',
          error: errorData
        }, { status: response.status });
      }

      const order: PagarmeOrder = await response.json();
      const charge = order.charges[0];
      const status = charge.status;

      console.log('✅ Resposta da Pagar.me:', { order_id: order.id, charge_id: charge.id, status });

      await salvarDadosReserva(order.id, charge.id, reservaData);

      if (status === 'paid') {
        // 🔥 Notificar pagamento aprovado
        notificarAdmin({
          tipo: 'CARTAO_PROCESSADO',
          orderId: order.id,
          passageiro: customer.name,
          origem: booking?.origem,
          destino: booking?.destino,
          valor: amount / 100,
          cupom: metadata?.cupom as string | undefined
        }).catch(console.error);

        return NextResponse.json({
          success: true,
          order_id: order.id,
          charge_id: charge.id,
          status: status,
          message: 'Pagamento aprovado com sucesso!'
        });
      } else if (status === 'pending') {
        return NextResponse.json({
          success: false,
          message: 'Pagamento pendente de confirmação',
          status: 'pending'
        });
      } else if (status === 'failed') {
        const errorMessage = charge.last_transaction?.gateway_response?.message || 'Pagamento recusado';
        
        // 🔥 Notificar falha
        notificarAdmin({
          tipo: 'ERRO_PAGAMENTO',
          orderId: order.id,
          passageiro: customer.name,
          valor: amount / 100,
          erro: 'Pagamento recusado',
          detalhes: errorMessage
        }).catch(console.error);
        
        return NextResponse.json({
          success: false,
          message: errorMessage
        });
      } else {
        return NextResponse.json({
          success: false,
          message: `Status desconhecido: ${status}`
        });
      }

    } else if (payment_method === 'pix') {
      const orderData = {
        items,
        customer: customerData,
        payments: [{
          payment_method: 'pix',
          pix: {
            expires_in: 1800
          }
        }],
        metadata: {
          ...metadata,
          booking_data: JSON.stringify(booking)
        }
      };

      console.log('📤 Gerando PIX REAL na Pagar.me...');

      const response = await fetch(`${PAGARME_API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData: unknown = await response.json();
        console.error('❌ Erro da API Pagar.me:', errorData);
        
        // 🔥 Notificar erro
        notificarAdmin({
          tipo: 'ERRO_PAGAMENTO',
          passageiro: customer.name,
          valor: amount / 100,
          erro: 'Erro ao gerar PIX',
          detalhes: (errorData as { message?: string }).message || 'Erro desconhecido'
        }).catch(console.error);
        
        return NextResponse.json({
          success: false,
          message: (errorData as { message?: string }).message || 'Erro ao gerar PIX',
          error: errorData
        }, { status: response.status });
      }

      const order: PagarmeOrder = await response.json();
      const charge = order.charges[0];
      const lastTransaction = charge.last_transaction;

      console.log('✅ PIX gerado:', { order_id: order.id, charge_id: charge.id });

      const qrCode = lastTransaction?.qr_code || 
                     lastTransaction?.pix?.qr_code || 
                     lastTransaction?.qr_code_data ||
                     charge?.qr_code ||
                     'QR_CODE_NOT_FOUND';

      const qrCodeUrl = lastTransaction?.qr_code_url || 
                        lastTransaction?.pix?.qr_code_url ||
                        charge?.qr_code_url ||
                        '';

      await salvarDadosReserva(order.id, charge.id, reservaData);

      // 🔥 Notificar PIX gerado
      notificarAdmin({
        tipo: 'PIX_GERADO',
        orderId: order.id,
        passageiro: customer.name,
        origem: booking?.origem,
        destino: booking?.destino,
        valor: amount / 100
      }).catch(console.error);

      return NextResponse.json({
        success: true,
        order_id: order.id,
        charge_id: charge.id,
        qr_code: qrCode,
        qr_code_url: qrCodeUrl,
        expires_at: lastTransaction?.expires_at || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        message: 'PIX gerado com sucesso!',
        _debug: {
          has_qr_code: qrCode !== 'QR_CODE_NOT_FOUND',
          transaction_type: lastTransaction?.type
        }
      });

    } else {
      return NextResponse.json({
        success: false,
        message: 'Método de pagamento inválido'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Erro ao processar pagamento:', error);
    
    // 🔥 Notificar erro crítico
    notificarAdmin({
      tipo: 'ERRO_PAGAMENTO',
      erro: 'Erro interno',
      detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
    }).catch(console.error);
    
    return NextResponse.json({
      success: false,
      message: 'Erro interno ao processar pagamento',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}