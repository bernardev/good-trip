// app/api/payments/pagarme/process/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const PAGARME_SECRET_KEY = process.env.PAGARME_SECRET_KEY || '';
const PAGARME_API_URL = 'https://api.pagar.me/core/v5';
const isSimulationMode = !PAGARME_SECRET_KEY || PAGARME_SECRET_KEY.length < 10;

const getAuthHeader = () => {
  const auth = Buffer.from(`${PAGARME_SECRET_KEY}:`).toString('base64');
  return `Basic ${auth}`;
};

interface ReservaData {
  servico?: string;
  origem?: string;
  destino?: string;
  data?: string;
  assentos: string[];
  passageiros: Array<{
    assento: string;
    nome: string;
    sobrenome: string;
    documento?: string;
    email: string;
  }>;
  preco: number;
  metadata?: Record<string, unknown>;
}

// 🔥 Salvar dados da reserva no filesystem
async function salvarDadosReserva(orderId: string, data: ReservaData) {
  try {
    const dir = join(process.cwd(), '.cache', 'reservas');
    await mkdir(dir, { recursive: true });
    const filepath = join(dir, `${orderId}.json`);
    await writeFile(filepath, JSON.stringify(data, null, 2));
    console.log('💾 Dados salvos:', orderId);
  } catch (error) {
    console.error('❌ Erro ao salvar:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
      installments 
    } = body;

    if (!payment_method || !amount || !customer) {
      return NextResponse.json({
        success: false,
        message: 'Dados obrigatórios faltando'
      }, { status: 400 });
    }

    // 🔥 Preparar dados da reserva com múltiplos passageiros
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
      passageiros: reservaData.passageiros.length
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
          return NextResponse.json({
            success: false,
            message: 'Cartão recusado pelo banco emissor',
            code: 'card_declined'
          });
        }

        const orderId = `sim_order_${Date.now()}`;
        
        // 🔥 SALVAR dados da reserva
        await salvarDadosReserva(orderId, reservaData);

        return NextResponse.json({
          success: true,
          order_id: orderId,
          charge_id: `sim_charge_${Date.now()}`,
          status: 'paid',
          message: '✅ Pagamento simulado com sucesso!',
          simulation: true
        });
      }

      if (payment_method === 'pix') {
        const orderId = `sim_pix_order_${Date.now()}`;
        
        // 🔥 SALVAR dados da reserva
        await salvarDadosReserva(orderId, reservaData);

        return NextResponse.json({
          success: true,
          order_id: orderId,
          charge_id: `sim_pix_charge_${Date.now()}`,
          qr_code: 'SIMULADO_QR_CODE_' + Math.random().toString(36).substring(7).toUpperCase(),
          qr_code_url: 'https://exemplo.com/qr-code-simulado.png',
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          message: '✅ PIX simulado gerado!',
          simulation: true
        });
      }
    }

    // ========== MODO REAL ==========

    const customerData = {
      name: customer.name,
      email: customer.email,
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

    const items = [{
      code: "PASSAGEM_ONIBUS",
      description: metadata?.title || 'Passagem de ônibus',
      amount: amount,
      quantity: 1
    }];

    if (payment_method === 'credit_card') {
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
              exp_month: parseInt(card_expiry.split('/')[0]),
              exp_year: parseInt('20' + card_expiry.split('/')[1]),
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
        const errorData = await response.json();
        console.error('❌ Erro da API Pagar.me:', errorData);
        
        return NextResponse.json({
          success: false,
          message: errorData.message || 'Erro ao processar pagamento',
          error: errorData
        }, { status: response.status });
      }

      const order = await response.json();
      const charge = order.charges[0];
      const status = charge.status;

      console.log('✅ Resposta da Pagar.me:', { order_id: order.id, status });

      // 🔥 SALVAR dados da reserva
      await salvarDadosReserva(order.id, reservaData);

      if (status === 'paid') {
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
        const errorData = await response.json();
        console.error('❌ Erro da API Pagar.me:', errorData);
        
        return NextResponse.json({
          success: false,
          message: errorData.message || 'Erro ao gerar PIX',
          error: errorData
        }, { status: response.status });
      }

      const order = await response.json();
      const charge = order.charges[0];
      const lastTransaction = charge.last_transaction;

      console.log('✅ PIX gerado:', order.id);

      const qrCode = lastTransaction?.qr_code || 
                     lastTransaction?.pix?.qr_code || 
                     lastTransaction?.qr_code_data ||
                     charge?.qr_code ||
                     'QR_CODE_NOT_FOUND';

      const qrCodeUrl = lastTransaction?.qr_code_url || 
                        lastTransaction?.pix?.qr_code_url ||
                        charge?.qr_code_url ||
                        '';

      // 🔥 SALVAR dados da reserva
      await salvarDadosReserva(order.id, reservaData);

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
    
    return NextResponse.json({
      success: false,
      message: 'Erro interno ao processar pagamento',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}