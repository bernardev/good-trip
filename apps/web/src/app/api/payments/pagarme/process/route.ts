// app/api/payments/pagarme/process/route.ts
import { NextRequest, NextResponse } from 'next/server';

// ⚠️ IMPORTANTE: Substitua pela sua chave secreta quando obtê-la
const PAGARME_SECRET_KEY = process.env.PAGARME_SECRET_KEY || '';
const PAGARME_API_URL = 'https://api.pagar.me/core/v5';

// Verificar se está em modo simulação
const isSimulationMode = !PAGARME_SECRET_KEY || PAGARME_SECRET_KEY.length < 10;

// Criar autenticação Basic (Base64)
const getAuthHeader = () => {
  const auth = Buffer.from(`${PAGARME_SECRET_KEY}:`).toString('base64');
  return `Basic ${auth}`;
};

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

    // Validações básicas
    if (!payment_method || !amount || !customer) {
      return NextResponse.json({
        success: false,
        message: 'Dados obrigatórios faltando'
      }, { status: 400 });
    }

    // ========== MODO SIMULAÇÃO ==========
    if (isSimulationMode) {
      console.log('🔧 MODO SIMULAÇÃO ATIVO');
      console.log('📋 Dados recebidos:', JSON.stringify({
        payment_method,
        amount,
        customer: customer.name,
        installments
      }, null, 2));

      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simular sucesso baseado no CVV (se for cartão)
      if (payment_method === 'credit_card') {
        // CVV começando com 6 = recusa
        if (card_cvv && card_cvv.startsWith('6')) {
          return NextResponse.json({
            success: false,
            message: 'Cartão recusado pelo banco emissor',
            code: 'card_declined'
          });
        }

        // Sucesso
        return NextResponse.json({
          success: true,
          order_id: `sim_order_${Date.now()}`,
          charge_id: `sim_charge_${Date.now()}`,
          status: 'paid',
          message: '✅ Pagamento simulado com sucesso! (Configure PAGARME_SECRET_KEY no .env.local para processar pagamentos reais)',
          simulation: true
        });
      }

      // PIX
      if (payment_method === 'pix') {
        return NextResponse.json({
          success: true,
          order_id: `sim_pix_order_${Date.now()}`,
          charge_id: `sim_pix_charge_${Date.now()}`,
          qr_code: 'SIMULADO_QR_CODE_' + Math.random().toString(36).substring(7).toUpperCase(),
          qr_code_url: 'https://exemplo.com/qr-code-simulado.png',
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          message: '✅ PIX simulado gerado! (Configure PAGARME_SECRET_KEY para gerar PIX real)',
          simulation: true
        });
      }
    }

    // ========== MODO REAL (COM CHAVE SECRETA) ==========

    // Preparar dados do cliente
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

    // Preparar itens
    const items = [{
      amount: amount,
      description: metadata?.title || 'Passagem de ônibus',
      quantity: 1
    }];

    if (payment_method === 'credit_card') {
      // ========== PAGAMENTO COM CARTÃO (REAL) ==========
      
      // IMPORTANTE: Em produção, você deve tokenizar o cartão no frontend
      // e enviar apenas o card_hash. Nunca envie dados abertos de cartão.
      
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

      // TODO: Aqui você deve salvar no banco de dados
      // await saveOrderToDatabase(order, booking);

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
      // ========== PAGAMENTO COM PIX (REAL) ==========
      
      const orderData = {
        items,
        customer: customerData,
        payments: [{
          payment_method: 'pix',
          pix: {
            expires_in: 1800 // 30 minutos
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

      // Log completo para debug
      console.log('✅ PIX gerado:', order.id);
      console.log('📋 Estrutura da transação:', JSON.stringify(lastTransaction, null, 2));

      // Tentar pegar o QR Code de diferentes lugares (API pode variar)
      const qrCode = lastTransaction?.qr_code || 
                     lastTransaction?.pix?.qr_code || 
                     lastTransaction?.qr_code_data ||
                     charge?.qr_code ||
                     'QR_CODE_NOT_FOUND';

      const qrCodeUrl = lastTransaction?.qr_code_url || 
                        lastTransaction?.pix?.qr_code_url ||
                        charge?.qr_code_url ||
                        '';

      console.log('🔍 QR Code extraído:', qrCode?.substring(0, 50) + '...');

      if (qrCode === 'QR_CODE_NOT_FOUND') {
        console.error('⚠️ QR Code não encontrado na resposta!');
        console.error('Resposta completa:', JSON.stringify(order, null, 2));
      }

      // TODO: Aqui você deve salvar no banco de dados
      // await saveOrderToDatabase(order, booking);

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