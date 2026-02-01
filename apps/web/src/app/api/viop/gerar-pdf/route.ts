// apps/web/src/app/api/viop/gerar-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import QRCode from 'qrcode';
import { kv } from '@vercel/kv';

const HTML_TEMPLATE = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>BPE Interestadual</title>
  <style>
    @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");
    
    @page { size: A4 landscape; margin: 0; }
    
    * { box-sizing: border-box; }
    
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      font-size: 10px;
      color: #000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    body {
      padding: 5mm;
      display: flex;
    }
    
    .container {
      width: 100%;
      height: 100%;
      display: flex;
      gap: 0;
    }
    
    .col {
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .col-left {
      width: 33%;
      border-right: 1px dashed #ccc;
      gap: 2rem;
    }
    
    .col-center {
      width: 34%;
      border-right: 1px dashed #ccc;
    }
    
    .col-right {
      width: 33%;
      justify-content: space-between;
    }
    
    .header-company {
      text-align: center;
      margin-bottom: 10px;
    }
    
    .header-company h2 {
      font-size: 12px;
      margin: 0;
      font-weight: 700;
    }
    
    .header-company p {
      font-size: 9px;
      margin: 1px 0;
    }
    
    .row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 3px;
    }
    
    .label {
      font-weight: 700;
      font-size: 9px;
      color: #333;
    }
    
    .financials {
      width: 100%;
      margin: 8px 0;
      border-collapse: collapse;
      font-size: 9px;
    }
    
    .financials td {
      padding: 1px 0;
    }
    
    .financials .amount {
      text-align: right;
    }
    
    .barcode-container {
      text-align: center;
      margin: 1rem 0;
    }
    
    .barcode-img {
      max-width: 100%;
      height: 40px;
    }
    
    .qrcode-large {
      width: 90px;
      height: 90px;
    }
    
    .legal-text {
      font-size: 11px;
      text-align: justify;
      line-height: 1.2;
    }
    
    .legal-box {
      height: 555px;
    }
    
    .legal-text p {
      margin-bottom: 6px;
    }
    
    .qrcode-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      margin-top: auto;
      padding-top: 10px;
    }
    
    .digital-pass-header h3 {
      text-align: center;
      font-size: 12px;
      margin: 0;
      font-weight: 700;
    }
    
    .cut-line {
      width: 100%;
      border-bottom: 1px dashed #999;
      margin: 6px 0;
      text-align: center;
      font-size: 8px;
      color: #666;
      line-height: 0.1em;
    }
    
    .cut-line span {
      background: #fff;
      padding: 0 5px;
    }
    
    .pass-details {
      width: 100%;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .pass-item {
      margin-bottom: 2px;
    }
    
    .big-highlight {
      margin: 8px 0;
      align-items: flex-start;
    }
    
    .huge-text {
      font-size: 20px;
      font-weight: 800;
      line-height: 1;
    }
    
    .buson-footer {
      margin-top: 5px;
      text-align: center;
      font-size: 9px;
    }
    
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .bold { font-weight: 700; }
    .fs-small { font-size: 8px; }
    
    a {
      color: #000;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- COLUNA ESQUERDA -->
    <div class="col col-left">
      <div>
        <div class="header-company">
          <h2>{{nomeEmpresa}}</h2>
          <p>CNPJ: {{cnpjEmpresa}} IE: {{ieEmpresa}}</p>
          <p>{{enderecoEmpresa}}</p>
          <p style="font-weight: 600">Documento Auxiliar do Bilhete de Passagem Eletrônico</p>
        </div>

        <div class="trip-info">
          <div style="display: flex; flex-direction: column">
            <div><span class="label">Origem: {{origem}}</span></div>
            <div><span class="label">Destino: {{destino}}</span></div>
          </div>

          <div class="row">
            <div><span class="label">Data:</span> {{dataViagem}}</div>
            <div class="text-right"><span class="label">Hora:</span> {{horaViagem}}</div>
          </div>

          <div class="row">
            <div><span class="label">Poltrona: {{poltrona}}</span></div>
            <div class="text-right"><span class="label">Plataforma: {{plataforma}}</span></div>
          </div>

          <div style="margin: 5px 0">
            <span class="label">Linha: {{linha}}</span>
            <div class="row"><span>Modalidade: {{modalidade}}</span></div>
          </div>

          <div class="row">
            <span>Prefixo: {{prefixoOnibus}}</span>
            <span>Serviço: {{idServico}}</span>
          </div>

          <table class="financials">
            <tr><td>Tarifa:</td><td class="amount">{{valorTarifa}}</td></tr>
            <tr><td>Pedágio:</td><td class="amount">{{valorPedagio}}</td></tr>
            <tr><td>Taxa de Embarque:</td><td class="amount">{{valorTaxaEmbarque}}</td></tr>
            <tr><td>Seguro:</td><td class="amount">{{valorSeguro}}</td></tr>
            <tr style="border-bottom: 1px dashed #ccc"><td>Outros:</td><td class="amount">{{valorOutros}}</td></tr>
            <tr><td style="padding-top: 5px; font-weight: 700">Valor total:</td><td class="amount bold" style="padding-top: 5px">{{valorTotal}}</td></tr>
            <tr><td>Desconto:</td><td class="amount">{{valorDesconto}}</td></tr>
            <tr class="bold"><td>Valor a Pagar:</td><td class="amount">{{valorPago}}</td></tr>
          </table>

          <div class="row">
            <span>Forma de pagamento</span>
            <span>Valor Pago</span>
          </div>
          <div class="row">
            <span>{{formaPagamento}}</span>
            <span>{{valorPago}}</span>
          </div>
          <div class="row">
            <span>Troco:</span>
            <span>{{valorTroco}}</span>
          </div>
        </div>
      </div>

      <div class="access-key-area">
        <div style="text-align: center">
          <p class="fs-small" style="margin-bottom: 2px">
            Consulte a chave de acesso em:<br/>
            <a href="https://dfe-portal.svrs.rs.gov.br/bpe/qrcode">dfe-portal.svrs.rs.gov.br/bpe/qrcode</a>
          </p>
          <strong class="fs-small" style="display: block; margin-bottom: 5px">{{chaveAcesso}}</strong>

          <div class="barcode-container">
            <svg width="100%" height="40">
              <rect width="100%" height="100%" fill="white"/>
              {{#each barcodeLines}}
              <rect x="{{x}}" y="5" width="{{width}}" height="30" fill="black"/>
              {{/each}}
            </svg>
          </div>
        </div>

        <div style="display: flex; gap: 0.5rem; align-items: start">
          <div style="margin-top: 5px">
            <img src="{{qrCodeBpe}}" class="qrcode-large" alt="QR Code"/>
          </div>
          <div style="font-size: 8px; line-height: 1.1">
            <p>Passageiro: {{nomePassageiro}}</p>
            <p>Doc: {{documentoPassageiro}}</p>
            <p>Tipo de Desconto: Tarifa promocional</p>
            <p>Bp-e nº: {{numeroBpe}} Série: {{serieBpe}} | Tipo BP-e: 0</p>
            <p>Protocolo de Autorização: {{protocoloAutorizacao}}</p>
            <p>Data de Autorização: {{dataAutorizacao}}</p>
            <p>Nº Bilhete: {{numeroBilhete}}</p>
            <p>Localizador: {{localizador}}</p>
          </div>
        </div>

        <p class="fs-small" style="margin-top: 10px">{{tributosRodape}}</p>
      </div>
    </div>

    <!-- COLUNA CENTRO -->
    <div class="col col-center">
      <div class="legal-text legal-box">{{{termsHtml}}}</div>

      {{#if showGuiaQR}}
      <div class="qrcode-box">
        <p class="text-center bold" style="font-size: 12px">
          Para ler o guia do passageiro<br/>completo acesse pelo QRCode abaixo
        </p>
        <img src="{{qrCodeGuia}}" class="qrcode-large" alt="QR Code Guia"/>
        <a href="{{urlGuia}}" class="fs-small">{{urlGuia}}</a>
      </div>
      {{/if}}
    </div>

    <!-- COLUNA DIREITA -->
    <div class="col col-right">
      <div>
        <div class="digital-pass-header">
          <h3>Passagem Digital</h3>
          <div class="barcode-container">
            <svg width="100%" height="40">
              <rect width="100%" height="100%" fill="white"/>
              {{#each barcodeLines}}
              <rect x="{{x}}" y="5" width="{{width}}" height="30" fill="black"/>
              {{/each}}
            </svg>
          </div>
        </div>

        <div class="cut-line">
          <span>Use esse documento para embarcar direto</span>
        </div>

        <div class="pass-details">
          <div class="pass-item">
            <span class="label fs-small">Origem</span>
            <div class="bold">{{origem}}</div>
            <div class="fs-small">Local de Embarque: {{origem}}</div>
          </div>

          <div class="pass-item">
            <span class="label fs-small">Destino</span>
            <div class="bold">{{destino}}</div>
            <div class="fs-small">Local de Desembarque: {{destino}}</div>
          </div>

          <div class="pass-item" style="margin-top: 5px">
            <span class="label fs-small">Linha</span>
            <div class="bold fs-small">{{linha}}</div>
          </div>

          <div class="row" style="margin-top: 5px">
            <div>
              <span class="label fs-small">Data da viagem</span>
              <div class="bold">{{dataViagem}}</div>
            </div>
            <div class="text-right">
              <span class="label fs-small">Hora da viagem</span>
              <div class="bold">{{horaViagem}}</div>
            </div>
          </div>

          <div class="text-center bold" style="margin: 5px 0; font-size: 10px">
            Horário Inicio Embarque: {{horaInicioEmbarque}} / Horário Fim Embarque: {{horaFimEmbarque}}
          </div>

          <div class="row big-highlight">
            <div style="width: 50%">
              <span class="label fs-small">Poltrona</span>
              <div class="huge-text">{{poltrona}}</div>
            </div>
            <div style="width: 50%; text-align: right">
              <span class="label fs-small">Plataforma</span>
              <div class="huge-text">{{plataforma}}</div>
            </div>
          </div>

          <div class="pass-item">
            <span class="label fs-small">Nome</span>
            <div class="bold fs-small">{{nomePassageiroUpper}}</div>
            <span class="label fs-small">Documento</span>
            <div class="bold fs-small">{{documentoPassageiro}}</div>
          </div>

          <div class="row">
            <div>
              <span class="label fs-small">Tipo</span>
              <div class="bold fs-small">{{modalidade}}</div>
            </div>
            <div class="text-right">
              <span class="label fs-small">Nº Bilhete/BP-e</span>
              <div class="bold fs-small">{{numeroBilhete}}</div>
              <div class="bold fs-small">{{numeroBpe}}</div>
            </div>
          </div>

          <div class="pass-item">
            <span class="label fs-small">Viação</span>
            <div class="bold fs-small">{{nomeEmpresa}}</div>
          </div>
        </div>
      </div>

      {{#if qrCodeTaxaEmbarque}}
      <div style="margin-top: 10px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.5rem">
        <span class="label">Rodoviária</span>
        <img src="{{qrCodeTaxaEmbarque}}" class="qrcode-large" alt="QR Taxa"/>
      </div>
      {{/if}}

      <div class="buson-footer">
        <p>Para embarcar na rodoviária</p>
        <div style="line-height: 1">
          <p style="font-size: 9px">Localizador</p>
          <p style="font-weight: 800; font-size: 14px">{{localizador}}</p>
        </div>
        <a href="https://www.viacaoouroeprata.com.br/site/">www.viacaoouroeprata.com.br/site</a>
      </div>
    </div>
  </div>
</body>
</html>
`;

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    console.log('📄 Gerando PDF para orderId:', orderId);

    // 🔥 BUSCAR DADOS REAIS DO CACHE KV (salvos pelo confirmar-reserva)
    const bilheteCache = await kv.get(`bilhete:${orderId}`);

    if (!bilheteCache) {
      console.error('❌ Bilhete não encontrado no cache:', orderId);
      return NextResponse.json({ error: 'Bilhete não encontrado' }, { status: 404 });
    }

    const reserva = typeof bilheteCache === 'string' ? JSON.parse(bilheteCache) : bilheteCache;
    console.log('✅ Dados do bilhete recuperados do cache');

    // Formatar chave de acesso com espaços
    const chaveFormatada = reserva.chaveBpe?.match(/.{1,4}/g)?.join(' ') || '';

    // Gerar linhas do barcode (mock)
    const barcodeLines = Array.from({ length: 50 }, (_, i) => ({
      x: i * 4,
      width: Math.random() > 0.5 ? 1 : 2,
    }));

    // 🔥 GERAR QR CODES COMO BASE64
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

    // Preparar dados para o template
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

    // Compilar template
    const template = Handlebars.compile(HTML_TEMPLATE);
    const html = template(templateData);

    // Gerar PDF com Puppeteer (funciona na Vercel)
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ],
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

    // Converter para Buffer
    const buffer = Buffer.from(pdfBuffer);

    console.log('✅ PDF gerado com sucesso! Tamanho:', (buffer.length / 1024).toFixed(2), 'KB');

    // Retornar PDF
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="bilhete-${orderId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    return NextResponse.json({ error: 'Erro ao gerar PDF' }, { status: 500 });
  }
}