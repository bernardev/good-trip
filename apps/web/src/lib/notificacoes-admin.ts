// apps/web/src/lib/notificacoes-admin.ts

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://31.97.42.88:8082';
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'monitoramento-eduardo';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'apikey321';
const ADMIN_WHATSAPP = process.env.ADMIN_WHATSAPP || '5541999475635';

type TipoNotificacao =
  | 'BUSCA_REALIZADA'
  | 'ASSENTOS_SELECIONADOS'
  | 'IDENTIFICACAO_CONCLUIDA'
  | 'PAGINA_PAGAMENTO'
  | 'PIX_GERADO'
  | 'PIX_EXPIRADO'
  | 'CARTAO_PROCESSADO'
  | 'BILHETE_EMITIDO'
  | 'ERRO_PAGAMENTO'
  | 'ERRO_EMISSAO'
  | 'ESTORNO_PROCESSADO'
  | 'ESTORNO_FALHOU'
  | 'PAGAMENTO_WEBHOOK'
  | 'PAGAMENTO_SEM_BILHETE';

type DadosNotificacao = {
  tipo: TipoNotificacao;
  orderId?: string;
  valor?: number;
  passageiro?: string;
  origem?: string;
  destino?: string;
  data?: string;
  assentos?: string[];
  erro?: string;
  detalhes?: string;
  cupom?: string;
  resultados?: number;
  valorEstornado?: number;
  motivo?: string;
  ip?: string;
};

export async function notificarAdmin(dados: DadosNotificacao): Promise<void> {
  try {
    let mensagem = montarMensagemAdmin(dados);

    // Anexar IP do cliente ao final de toda mensagem
    if (dados.ip) {
      mensagem += `\n🌐 IP: ${dados.ip}`;
    }

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
  const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  switch (dados.tipo) {
    case 'BUSCA_REALIZADA':
      return `🔍 *BUSCA REALIZADA*\n\n` +
             `⏰ ${timestamp}\n` +
             `📍 ${dados.origem || 'N/A'} → ${dados.destino || 'N/A'}\n` +
             `📅 ${dados.data || 'N/A'}\n` +
             `📊 ${dados.resultados ?? 0} resultado(s) encontrado(s)`;

    case 'ASSENTOS_SELECIONADOS':
      return `💺 *ASSENTOS SELECIONADOS*\n\n` +
             `⏰ ${timestamp}\n` +
             `📍 ${dados.origem || 'N/A'} → ${dados.destino || 'N/A'}\n` +
             `💺 Assentos: ${dados.assentos?.join(', ') || 'N/A'}\n` +
             `💰 Valor: R$ ${dados.valor?.toFixed(2) || 'N/A'}`;

    case 'IDENTIFICACAO_CONCLUIDA':
      return `📝 *IDENTIFICAÇÃO CONCLUÍDA*\n\n` +
             `⏰ ${timestamp}\n` +
             `👤 ${dados.passageiro || 'N/A'}\n` +
             `📍 ${dados.origem || 'N/A'} → ${dados.destino || 'N/A'}\n` +
             `💺 Assentos: ${dados.assentos?.join(', ') || 'N/A'}\n` +
             `💰 Valor: R$ ${dados.valor?.toFixed(2) || 'N/A'}`;

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
             `⏳ Aguardando pagamento (10 min)...`;

    case 'PIX_EXPIRADO':
      return `⏰ *PIX EXPIRADO*\n\n` +
             `⏰ ${timestamp}\n` +
             `👤 ${dados.passageiro || 'N/A'}\n` +
             `💰 Valor: R$ ${dados.valor?.toFixed(2) || 'N/A'}\n` +
             `🔑 Order: ${dados.orderId || 'N/A'}\n\n` +
             `❌ Cliente não pagou dentro do prazo de 10 min`;

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

    case 'ESTORNO_PROCESSADO':
      return `💸 *ESTORNO PROCESSADO*\n\n` +
             `⏰ ${timestamp}\n` +
             `🔑 Order: ${dados.orderId || 'N/A'}\n` +
             `💰 Valor estornado: R$ ${dados.valorEstornado?.toFixed(2) || 'N/A'}\n` +
             `📝 Motivo: ${dados.motivo || dados.detalhes || 'N/A'}\n\n` +
             `✅ Dinheiro devolvido automaticamente ao cliente`;

    case 'ESTORNO_FALHOU':
      return `🚨 *ESTORNO FALHOU*\n\n` +
             `⏰ ${timestamp}\n` +
             `🔑 Order: ${dados.orderId || 'N/A'}\n` +
             `💰 Valor: R$ ${dados.valor?.toFixed(2) || 'N/A'}\n` +
             `❌ ${dados.erro || 'Erro desconhecido'}\n\n` +
             `⚠️ AÇÃO MANUAL NECESSÁRIA!`;

    case 'PAGAMENTO_WEBHOOK':
      return `🔔 *PAGAMENTO VIA WEBHOOK*\n\n` +
             `⏰ ${timestamp}\n` +
             `🔑 Order: ${dados.orderId || 'N/A'}\n` +
             `💰 Valor: R$ ${dados.valor?.toFixed(2) || 'N/A'}\n` +
             `📝 ${dados.detalhes || 'Pagamento detectado via webhook PagarMe'}\n\n` +
             (dados.motivo || '');

    case 'PAGAMENTO_SEM_BILHETE':
      return `🚨 *PAGAMENTO SEM BILHETE DETECTADO*\n\n` +
             `⏰ ${timestamp}\n` +
             `🔑 Order: ${dados.orderId || 'N/A'}\n` +
             `💰 Valor: R$ ${dados.valor?.toFixed(2) || 'N/A'}\n` +
             `📝 ${dados.detalhes || 'Cliente pagou mas nenhum bilhete foi emitido'}\n` +
             `🔄 Estorno automático acionado\n\n` +
             (dados.ip ? `🌐 IP: ${dados.ip}\n` : '');

    default:
      return `📢 *GOOD TRIP*\n\n${timestamp}\n\n${dados.detalhes || 'Notificação'}`;
  }
}
