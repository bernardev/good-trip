// apps/web/src/lib/evolution-whatsapp.ts

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://31.97.42.88:8082';
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'teste-eduardo';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'apikey321';

/**
 * Normaliza telefone brasileiro removendo 9 duplicado
 */
function normalizarTelefoneBrasileiro(telefone: string): string {
  const limpo = telefone.replace(/\D/g, '');
  
  if (limpo.startsWith('5593') && limpo.charAt(4) === '9' && limpo.charAt(5) === '9') {
    return limpo.substring(0, 4) + limpo.substring(5);
  }
  
  if (!limpo.startsWith('55')) {
    return `55${limpo}`;
  }
  
  return limpo;
}

/**
 * Envia LINK do bilhete via WhatsApp (NOVA FUNÇÃO)
 */
export async function enviarBilheteLinkWhatsApp(
  telefone: string,
  orderId: string,
  dadosViagem: {
    origem: string;
    destino: string;
    data: string;
    assentos: string[];
    localizadores: string[];
  }
): Promise<boolean> {
  try {
    console.log('📞 Telefone original:', telefone);
    
    const whatsappNumber = normalizarTelefoneBrasileiro(telefone);
    console.log('📱 WhatsApp number normalizado:', whatsappNumber);
    
    if (whatsappNumber.length < 12 || whatsappNumber.length > 13) {
      console.error('❌ Telefone inválido após normalização:', whatsappNumber);
      return false;
    }

    const url = `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`;
    
    // Montar link do bilhete
    const bilheteLink = `https://www.goodtrip.com.br/buscar-viop/confirmacao?order_id=${orderId}&status=paid`;
    
    // Montar mensagem
    const mensagem = `🎫 *Seu bilhete Good Trip*\n\n` +
                    `✈️ ${dadosViagem.origem} → ${dadosViagem.destino}\n` +
                    `📅 ${dadosViagem.data}\n` +
                    `💺 Assento${dadosViagem.assentos.length > 1 ? 's' : ''}: ${dadosViagem.assentos.join(', ')}\n` +
                    `🔢 Localizador${dadosViagem.localizadores.length > 1 ? 'es' : ''}: ${dadosViagem.localizadores.join(', ')}\n\n` +
                    `📄 Acesse seu bilhete completo:\n${bilheteLink}\n\n` +
                    `✅ Bilhete confirmado!\n` +
                    `🖨️ Você pode visualizar e imprimir pelo link acima\n\n` +
                    `Boa viagem! 🚌`;

    const payload = {
      number: whatsappNumber,
      text: mensagem,
      delay: 1000
    };

    console.log('📤 Enviando mensagem para:', url);
    console.log('📦 Payload:', payload);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify(payload)
    });

    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('❌ Erro ao enviar WhatsApp:', response.status, errorText);
      return false;
    }

    const result: unknown = await response.json();
    console.log('✅ Response body:', JSON.stringify(result, null, 2));
    console.log('✅ Link enviado via WhatsApp com sucesso!');
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar WhatsApp:', error);
    if (error instanceof Error) {
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
    }
    return false;
  }
}

/**
 * Envia PDF do bilhete via WhatsApp (MANTÉM A ANTIGA)
 */
export async function enviarBilhetePDFWhatsApp(
  telefone: string,
  pdfBuffer: Buffer,
  nomeArquivo: string,
  caption: string
): Promise<boolean> {
  try {
    console.log('📞 Telefone original:', telefone);
    
    const whatsappNumber = normalizarTelefoneBrasileiro(telefone);
    console.log('📱 WhatsApp number normalizado:', whatsappNumber);
    
    if (whatsappNumber.length < 12 || whatsappNumber.length > 13) {
      console.error('❌ Telefone inválido após normalização:', whatsappNumber);
      return false;
    }

    const pdfBase64 = pdfBuffer.toString('base64');
    const tamanhoKB = (pdfBuffer.length / 1024).toFixed(2);

    console.log('📄 PDF info:', {
      tamanho: `${tamanhoKB} KB`,
      nomeArquivo,
      base64Length: pdfBase64.length
    });

    const url = `${EVOLUTION_API_URL}/message/sendMedia/${EVOLUTION_INSTANCE}`;

    const payload = {
      number: whatsappNumber,
      mediatype: 'document',
      mimetype: 'application/pdf',
      caption: caption,
      fileName: nomeArquivo,
      media: pdfBase64
    };

    console.log('📤 Enviando para:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify(payload)
    });

    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('❌ Erro ao enviar WhatsApp:', response.status, errorText);
      return false;
    }

    const result: unknown = await response.json();
    console.log('✅ Response body:', JSON.stringify(result, null, 2));
    console.log('✅ PDF enviado via WhatsApp com sucesso!');
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar WhatsApp:', error);
    if (error instanceof Error) {
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
    }
    return false;
  }
}