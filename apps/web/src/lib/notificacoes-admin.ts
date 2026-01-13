// apps/web/src/lib/notificacoes-admin.ts

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://31.97.42.88:8082';
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'teste-eduardo';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'apikey321';
const ADMIN_WHATSAPP = process.env.ADMIN_WHATSAPP || '5593991436570';

type TipoNotificacao = 
  | 'PAGINA_PAGAMENTO'
  | 'PIX_GERADO'
  | 'CARTAO_PROCESSADO'
  | 'BILHETE_EMITIDO'
  | 'ERRO_PAGAMENTO'
  | 'ERRO_EMISSAO';

type DadosNotificacao = {
  tipo: TipoNotificacao;
  orderId?: string;
  valor?: number;
  passageiro?: string;
  origem?: string;
  destino?: string;
  assentos?: string[];
  erro?: string;
  detalhes?: string;
  cupom?: string;
};

export async function notificarAdmin(dados: DadosNotificacao): Promise<void> {
  try {
    const mensagem = montarMensagemAdmin(dados);
    
    const url = `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`;
    
    const payload = {
      number: ADMIN_WHATSAPP,
      text: mensagem,
      delay: 1000
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('❌ Erro ao enviar notificação admin:', response.status);
    } else {
      console.log('✅ Notificação admin enviada:', dados.tipo);
    }
  } catch (error) {
    console.error('❌ Erro ao notificar admin:', error);
  }
}

function montarMensagemAdmin(dados: DadosNotificacao): string {
  const timestamp = new Date().toLocaleString('pt-BR');
  
  switch (dados.tipo) {
    case 'PAGINA_PAGAMENTO':
      return `🟡 *CLIENTE NA PÁGINA DE PAGAMENTO*\n\n` +
             `⏰ ${timestamp}\n` +
             `👤 ${dados.passageiro || 'N/A'}\n` +
             `📍 ${dados.origem} → ${dados.destino}\n` +
             `💺 Assentos: ${dados.assentos?.join(', ') || 'N/A'}\n` +
             `💰 Valor: R$ ${dados.valor?.toFixed(2) || 'N/A'}` +
             (dados.cupom ? `\n🎟️ Cupom: ${dados.cupom}` : '');
    
    case 'PIX_GERADO':
      return `🟢 *PIX GERADO*\n\n` +
             `⏰ ${timestamp}\n` +
             `👤 ${dados.passageiro || 'N/A'}\n` +
             `📍 ${dados.origem} → ${dados.destino}\n` +
             `💰 Valor: R$ ${dados.valor?.toFixed(2) || 'N/A'}\n` +
             `🔑 Order: ${dados.orderId}\n\n` +
             `⏳ Aguardando pagamento...`;
    
    case 'CARTAO_PROCESSADO':
      return `💳 *PAGAMENTO APROVADO (CARTÃO)*\n\n` +
             `⏰ ${timestamp}\n` +
             `👤 ${dados.passageiro || 'N/A'}\n` +
             `📍 ${dados.origem} → ${dados.destino}\n` +
             `💰 Valor: R$ ${dados.valor?.toFixed(2) || 'N/A'}\n` +
             `🔑 Order: ${dados.orderId}\n\n` +
             `✅ Iniciando emissão de bilhete...`;
    
    case 'BILHETE_EMITIDO':
      return `🎉 *BILHETE EMITIDO COM SUCESSO*\n\n` +
             `⏰ ${timestamp}\n` +
             `👤 ${dados.passageiro || 'N/A'}\n` +
             `📍 ${dados.origem} → ${dados.destino}\n` +
             `💺 Assentos: ${dados.assentos?.join(', ') || 'N/A'}\n` +
             `💰 Valor: R$ ${dados.valor?.toFixed(2) || 'N/A'}\n` +
             `🔑 Order: ${dados.orderId}\n\n` +
             `✅ Cliente recebeu bilhete no WhatsApp!`;
    
    case 'ERRO_PAGAMENTO':
      return `🔴 *ERRO NO PAGAMENTO*\n\n` +
             `⏰ ${timestamp}\n` +
             `👤 ${dados.passageiro || 'N/A'}\n` +
             `💰 Valor: R$ ${dados.valor?.toFixed(2) || 'N/A'}\n` +
             `🔑 Order: ${dados.orderId || 'N/A'}\n\n` +
             `❌ ${dados.erro}\n` +
             (dados.detalhes ? `📝 ${dados.detalhes}` : '');
    
    case 'ERRO_EMISSAO':
      return `🔴 *ERRO NA EMISSÃO*\n\n` +
             `⏰ ${timestamp}\n` +
             `👤 ${dados.passageiro || 'N/A'}\n` +
             `📍 ${dados.origem} → ${dados.destino}\n` +
             `💰 Valor: R$ ${dados.valor?.toFixed(2) || 'N/A'}\n` +
             `🔑 Order: ${dados.orderId}\n\n` +
             `❌ ${dados.erro}\n` +
             (dados.detalhes ? `📝 ${dados.detalhes}\n\n` : '') +
             `⚠️ VERIFICAR ESTORNO!`;
    
    default:
      return `📢 *GOOD TRIP*\n\n${timestamp}\n\n${dados.detalhes || 'Notificação'}`;
  }
}