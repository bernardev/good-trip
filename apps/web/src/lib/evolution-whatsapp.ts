// apps/web/src/lib/evolution-whatsapp.ts

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://31.97.42.88:8082';
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'teste-eduardo';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'apikey321';

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
    // Normalizar telefone
    const telefoneNumeros = telefone.replace(/\D/g, '');
    
    if (telefoneNumeros.length < 10 || telefoneNumeros.length > 11) {
      console.error('❌ Telefone inválido:', telefone);
      return false;
    }

    const whatsappNumber = telefoneNumeros.startsWith('55') 
      ? telefoneNumeros 
      : `55${telefoneNumeros}`;

    // Converter PDF para base64
    const pdfBase64 = pdfBuffer.toString('base64');

    const url = `${EVOLUTION_API_URL}/message/sendMedia/${EVOLUTION_INSTANCE}`;

    const payload = {
      number: whatsappNumber,
      mediatype: 'document',
      mimetype: 'application/pdf',
      caption: caption,
      fileName: nomeArquivo,
      media: pdfBase64
    };

    console.log('📤 Enviando PDF via WhatsApp:', {
      para: whatsappNumber,
      arquivo: nomeArquivo,
      tamanho: `${(pdfBuffer.length / 1024).toFixed(2)} KB`
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('❌ Erro ao enviar WhatsApp:', response.status, errorText);
      return false;
    }

    const result: unknown = await response.json();
    console.log('✅ PDF enviado via WhatsApp com sucesso!');
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar WhatsApp:', error);
    return false;
  }
}