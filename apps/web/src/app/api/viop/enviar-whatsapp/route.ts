// apps/web/src/app/api/viop/enviar-whatsapp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import Handlebars from 'handlebars';
import QRCode from 'qrcode';
import { enviarBilhetePDFWhatsApp } from '@/lib/evolution-whatsapp';
import { kv } from '@vercel/kv';

// 🔥 USAR O MESMO HTML_TEMPLATE DO gerar-pdf (copiar completo)
const HTML_TEMPLATE = `[... MESMO HTML DO gerar-pdf ...]`;

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    console.log('📱 Iniciando envio de bilhete via WhatsApp:', orderId);

    // 🔥 BUSCAR DADOS REAIS DO CACHE KV (salvos pelo confirmar-reserva)
    const bilheteCache = await kv.get(`bilhete:${orderId}`);

    if (!bilheteCache) {
      console.error('❌ Bilhete não encontrado no cache:', orderId);
      return NextResponse.json({ error: 'Bilhete não encontrado' }, { status: 404 });
    }

    const reserva = typeof bilheteCache === 'string' ? JSON.parse(bilheteCache) : bilheteCache;
    console.log('✅ Dados do bilhete recuperados do cache');

    // Verificar se tem telefone
    const telefone = reserva.passageiro?.telefone;
    if (!telefone) {
      console.error('❌ Telefone não encontrado na reserva');
      return NextResponse.json({ error: 'Telefone não encontrado' }, { status: 400 });
    }

    console.log('📞 Telefone encontrado:', telefone);

    // [MESMO CÓDIGO DE FORMATAÇÃO E QR CODES DO gerar-pdf]
    const chaveFormatada = reserva.chaveBpe?.match(/.{1,4}/g)?.join(' ') || '';

    const barcodeLines = Array.from({ length: 50 }, (_, i) => ({
      x: i * 4,
      width: Math.random() > 0.5 ? 1 : 2,
    }));

    let qrCodeBpeBase64 = '';
    let qrCodeGuiaBase64 = '';
    let qrCodeTaxaBase64 = '';

    try {
      if (reserva.qrCodeBpe) {
        qrCodeBpeBase64 = await QRCode.toDataURL(reserva.qrCodeBpe, { width: 90, margin: 1 });
      }
      
      if (reserva.orgaoConcedenteId === 3) {
        qrCodeGuiaBase64 = await QRCode.toDataURL('https://www.viacaoouroepratacom.br/guia-passageiros', { width: 90, margin: 1 });
      }
      
      if (reserva.qrCodeTaxaEmbarque) {
        qrCodeTaxaBase64 = await QRCode.toDataURL(reserva.qrCodeTaxaEmbarque, { width: 90, margin: 1 });
      }
    } catch (error) {
      console.error('Erro ao gerar QR codes:', error);
    }

    const templateData = {
      nomeEmpresa: reserva.cabecalhoEmitente?.razaoSocial || '',
      cnpjEmpresa: reserva.cabecalhoEmitente?.cnpj || '',
      ieEmpresa: reserva.cabecalhoEmitente?.inscricaoEstadual || '',
      enderecoEmpresa: `${reserva.cabecalhoEmitente?.endereco}, ${reserva.cabecalhoEmitente?.numero}, ${reserva.cabecalhoEmitente?.bairro}, CEP ${reserva.cabecalhoEmitente?.cep}`,
      origem: reserva.origemNome || '',
      destino: reserva.destinoNome || '',
      dataViagem: reserva.dataFormatada || '',
      horaViagem: reserva.horarioSaida || '',
      poltrona: reserva.assentos?.[0] || reserva.poltrona || '',
      plataforma: reserva.plataforma || '-',
      linha: reserva.linha || '',
      modalidade: reserva.classe || '',
      prefixoOnibus: reserva.prefixo || '',
      idServico: reserva.servico || '',
      valorTarifa: `R$ ${(reserva.tarifa || 0).toFixed(2)}`,
      valorPedagio: `R$ ${(reserva.pedagio || 0).toFixed(2)}`,
      valorTaxaEmbarque: `R$ ${(reserva.taxaEmbarque || 0).toFixed(2)}`,
      valorSeguro: `R$ ${(reserva.seguro || 0).toFixed(2)}`,
      valorOutros: `R$ ${(reserva.outros || 0).toFixed(2)}`,
      valorTotal: `R$ ${(reserva.total || 0).toFixed(2)}`,
      valorDesconto: 'R$ 0,00',
      valorPago: `R$ ${(reserva.total || 0).toFixed(2)}`,
      valorTroco: 'R$ 0,00',
      formaPagamento: 'Vale Eletrônico WEBTEF',
      chaveAcesso: chaveFormatada,
      qrCodeBpe: qrCodeBpeBase64,
      nomePassageiro: reserva.passageiro?.nome || '',
      nomePassageiroUpper: (reserva.passageiro?.nome || '').toUpperCase(),
      documentoPassageiro: reserva.passageiro?.documento || '',
      numeroBpe: reserva.numeroBPe || '',
      serieBpe: reserva.serie || '',
      protocoloAutorizacao: reserva.protocolo || '',
      dataAutorizacao: reserva.dataEmissao ? new Date(reserva.dataEmissao).toLocaleString('pt-BR') : '',
      numeroBilhete: reserva.numeroBilhete || '',
      localizador: reserva.localizador || '',
      tributosRodape: `ICMS-RS 5,10 (17,00%) OUTROS TRIB-RS 4,80 (16,00%) Horário de Início do embarque: ${reserva.dataHoraEmbarqueInicio} Horário final do embarque: ${reserva.dataHoraEmbarqueFim} Classe de Serviço: (IC) ${reserva.classe}`,
      termsHtml: reserva.customizacaoRodapeCupomDeEmbarque || '<p>Os direitos e deveres dos passageiros podem ser consultados através do Guia de Orientação aos Passageiros.</p>',
      showGuiaQR: reserva.orgaoConcedenteId === 3,
      qrCodeGuia: qrCodeGuiaBase64,
      urlGuia: 'www.viacaoouroepratacom.br/guia-passageiros',
      qrCodeTaxaEmbarque: qrCodeTaxaBase64 || null,
      horaInicioEmbarque: reserva.dataHoraEmbarqueInicio?.split(' ')[1] || '',
      horaFimEmbarque: reserva.dataHoraEmbarqueFim?.split(' ')[1] || '',
      barcodeLines,
    };

    console.log('📄 Compilando template HTML...');

    const template = Handlebars.compile(HTML_TEMPLATE);
    const html = template(templateData);

    console.log('🖨️ Gerando PDF com Puppeteer...');

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    
    await browser.close();

    const buffer = Buffer.from(pdfBuffer);

    console.log('✅ PDF gerado com sucesso! Tamanho:', (buffer.length / 1024).toFixed(2), 'KB');

    const caption = `🎫 *Seu Bilhete Good Trip*\n\n` +
                   `✈️ ${reserva.origemNome} → ${reserva.destinoNome}\n` +
                   `📅 ${reserva.dataFormatada} às ${reserva.horarioSaida}\n` +
                   `💺 Assento: ${reserva.assentos?.[0] || reserva.poltrona}\n` +
                   `🔢 Localizador: ${reserva.localizador}\n\n` +
                   `✅ Bilhete confirmado! Boa viagem! 🚌`;

    const nomeArquivo = `bilhete-${reserva.localizador}.pdf`;

    console.log('📤 Enviando PDF via WhatsApp...');

    const sucesso = await enviarBilhetePDFWhatsApp(
      telefone,
      buffer,
      nomeArquivo,
      caption
    );

    if (!sucesso) {
      console.error('❌ Falha ao enviar WhatsApp');
      return NextResponse.json({ error: 'Falha ao enviar WhatsApp' }, { status: 500 });
    }

    console.log('✅ Bilhete enviado via WhatsApp com sucesso!');

    return NextResponse.json({ 
      success: true,
      message: 'Bilhete enviado via WhatsApp com sucesso!' 
    });

  } catch (error) {
    console.error('❌ Erro ao enviar bilhete via WhatsApp:', error);
    return NextResponse.json({ 
      error: 'Erro ao enviar bilhete via WhatsApp',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}