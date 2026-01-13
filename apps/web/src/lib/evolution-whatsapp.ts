// apps/web/src/lib/evolution-whatsapp.ts

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://31.97.42.88:8082';
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'teste-eduardo';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'apikey321';

/**
 * Normaliza telefone brasileiro removendo 9 duplicado
 */
function normalizarTelefoneBrasileiro(telefone: string): string {
  const limpo = telefone.replace(/\D/g, '');
  
  // Se começar com 5593 e tiver 99 depois, remove um 9
  // Ex: 5593991869422 -> 559391869422
  if (limpo.startsWith('5593') && limpo.charAt(4) === '9' && limpo.charAt(5) === '9') {
    return limpo.substring(0, 4) + limpo.substring(5); // Remove o 5º caractere (9 duplicado)
  }
  
  // Se não tiver 55 no início, adiciona
  if (!limpo.startsWith('55')) {
    return `55${limpo}`;
  }
  
  return limpo;
}

/**
 * Envia PDF do bilhete via WhatsApp
 */
export async function enviarBilhetePDFWhatsApp(
  telefone: string,
  pdfBuffer: Buffer,
  nomeArquivo: string,
  caption: string
): Promise<boolean> {
  try {
    console.log('📞 Telefone original:', telefone);
    
    // Normalizar telefone (remove 9 duplicado se necessário)
    const whatsappNumber = normalizarTelefoneBrasileiro(telefone);
    
    console.log('📱 WhatsApp number normalizado:', whatsappNumber);
    
    // Validar tamanho (deve ter 12 ou 13 dígitos: 55 + DDD + número)
    if (whatsappNumber.length < 12 || whatsappNumber.length > 13) {
      console.error('❌ Telefone inválido após normalização:', whatsappNumber);
      return false;
    }

    // Converter PDF para base64
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
    console.log('📦 Payload (sem base64):', {
      number: payload.number,
      mediatype: payload.mediatype,
      mimetype: payload.mimetype,
      caption: payload.caption,
      fileName: payload.fileName,
      mediaSize: `${tamanhoKB} KB`
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify(payload)
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response statusText:', response.statusText);

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