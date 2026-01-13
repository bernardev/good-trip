// apps/web/src/lib/bilhete-pdf.ts
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

type BilheteData = {
  localizador: string;
  numeroBilhete: string;
  passageiro: {
    nome: string;
    documento: string;
  };
  origemNome: string;
  destinoNome: string;
  dataFormatada: string;
  horarioSaida: string;
  horarioChegada: string;
  assento: string;
  classe: string;
  empresa: string;
  total: number;
  tarifa: number;
  pedagio: number;
  taxaEmbarque: number;
  seguro: number;
  outros: number;
};

export async function gerarBilhetePDF(dados: BilheteData): Promise<Buffer> {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    const { width, height } = page.getSize();
    let y = height - 40;
    
    const azul = rgb(0.118, 0.251, 0.686);
    const preto = rgb(0, 0, 0);
    const cinza = rgb(0.4, 0.4, 0.4);
    const cinzaClaro = rgb(0.96, 0.96, 0.96);
    
    // Função auxiliar para desenhar linha horizontal
    const drawLine = (yPos: number) => {
      page.drawRectangle({
        x: 40,
        y: yPos,
        width: width - 80,
        height: 1,
        color: rgb(0.8, 0.8, 0.8)
      });
    };
    
    // === CABEÇALHO AGÊNCIA ===
    page.drawText('GOOD TRIP TRANSPORTE E TURISMO LTDA', {
      x: 50,
      y: y,
      size: 9,
      font: fontBold,
      color: preto
    });
    y -= 12;
    
    page.drawText('CNPJ: 38.627.614/0001-70', {
      x: 50,
      y: y,
      size: 8,
      font: fontRegular,
      color: preto
    });
    y -= 12;
    
    page.drawText('AG GETULIO VARGAS, 519 - CENTRO', {
      x: 50,
      y: y,
      size: 8,
      font: fontRegular,
      color: preto
    });
    y -= 12;
    
    page.drawText('ITAITUBA - PA', {
      x: 50,
      y: y,
      size: 8,
      font: fontRegular,
      color: preto
    });
    
    page.drawText('WhatsApp: (93) 99143-6570', {
      x: width - 200,
      y: height - 40,
      size: 8,
      font: fontRegular,
      color: preto
    });
    
    page.drawText('suporte@goodtrip.com.br', {
      x: width - 200,
      y: height - 52,
      size: 8,
      font: fontRegular,
      color: preto
    });
    
    y -= 25;
    drawLine(y);
    y -= 20;
    
    // === CABEÇALHO EMITENTE (fundo cinza) ===
    page.drawRectangle({
      x: 40,
      y: y - 50,
      width: width - 80,
      height: 50,
      color: cinzaClaro
    });
    
    page.drawText('VIACAO OURO E PRATA S.A.', {
      x: width / 2 - 80,
      y: y - 15,
      size: 9,
      font: fontBold,
      color: preto
    });
    y -= 25;
    
    page.drawText('CNPJ: 92954106004725 IE: 154581976', {
      x: width / 2 - 100,
      y: y,
      size: 7,
      font: fontRegular,
      color: preto
    });
    y -= 10;
    
    page.drawText('TV DUQUE DE CAXIAS, 200 - AMPARO | SANTAREM - PA CEP: 68035620', {
      x: width / 2 - 170,
      y: y,
      size: 7,
      font: fontRegular,
      color: preto
    });
    
    y -= 30;
    
    page.drawText('Documento Auxiliar do Bilhete de Passagem Eletronico', {
      x: width / 2 - 140,
      y: y,
      size: 10,
      font: fontBold,
      color: preto
    });
    
    y -= 35;
    drawLine(y);
    y -= 20;
    
    // === ORIGEM E DESTINO ===
    page.drawText(`Origem: ${dados.origemNome}`, {
      x: 50,
      y: y,
      size: 9,
      font: fontBold,
      color: preto
    });
    
    page.drawText(`Destino: ${dados.destinoNome}`, {
      x: width - 250,
      y: y,
      size: 9,
      font: fontBold,
      color: preto
    });
    
    y -= 15;
    
    page.drawText(`Data: ${dados.dataFormatada}`, {
      x: width / 2 - 50,
      y: y,
      size: 9,
      font: fontBold,
      color: preto
    });
    
    y -= 20;
    drawLine(y);
    y -= 20;
    
    // === DADOS DA VIAGEM ===
    page.drawText(`Embarque: ${dados.dataFormatada} ${dados.horarioSaida}`, {
      x: 50,
      y: y,
      size: 8,
      font: fontRegular,
      color: preto
    });
    
    page.drawText(`Partida: ${dados.dataFormatada} ${dados.horarioSaida}`, {
      x: 200,
      y: y,
      size: 8,
      font: fontRegular,
      color: preto
    });
    
    page.drawText(`Chegada: ${dados.dataFormatada} ${dados.horarioChegada}`, {
      x: 350,
      y: y,
      size: 8,
      font: fontRegular,
      color: preto
    });
    
    page.drawText(`Poltrona: ${dados.assento}`, {
      x: width - 100,
      y: y,
      size: 8,
      font: fontBold,
      color: preto
    });
    
    y -= 15;
    
    page.drawText(`Tipo: ${dados.classe}`, {
      x: 200,
      y: y,
      size: 8,
      font: fontRegular,
      color: preto
    });
    
    y -= 12;
    
    page.drawText(`Linha: ${dados.empresa}`, {
      x: 50,
      y: y,
      size: 8,
      font: fontRegular,
      color: preto
    });
    
    y -= 20;
    drawLine(y);
    y -= 20;
    
    // === VALORES ===
    const valores = [
      `Tarifa: R$ ${dados.tarifa.toFixed(2)}`,
      `Pedagio: R$ ${dados.pedagio.toFixed(2)}`,
      `Embarque: R$ ${dados.taxaEmbarque.toFixed(2)}`,
      `Seguro: R$ ${dados.seguro.toFixed(2)}`,
      `Outros: R$ ${dados.outros.toFixed(2)}`
    ];
    
    valores.forEach(texto => {
      page.drawText(texto, {
        x: width / 2 - 50,
        y: y,
        size: 8,
        font: fontRegular,
        color: preto
      });
      y -= 12;
    });
    
    y -= 5;
    page.drawText(`Valor Total: R$ ${dados.total.toFixed(2)}`, {
      x: width / 2 - 50,
      y: y,
      size: 10,
      font: fontBold,
      color: preto
    });
    
    y -= 15;
    page.drawText(`Valor a Pagar: R$ ${dados.total.toFixed(2)}`, {
      x: width / 2 - 50,
      y: y,
      size: 10,
      font: fontBold,
      color: preto
    });
    
    y -= 15;
    page.drawText('FORMA PAGAMENTO: VALOR PAGO', {
      x: width / 2 - 80,
      y: y,
      size: 9,
      font: fontBold,
      color: preto
    });
    
    y -= 20;
    drawLine(y);
    y -= 20;
    
    // === PASSAGEIRO ===
    page.drawText('PASSAGEIRO(A)', {
      x: 50,
      y: y,
      size: 9,
      font: fontBold,
      color: preto
    });
    y -= 15;
    
    page.drawText(`DOC ${dados.passageiro.documento} - ${dados.passageiro.nome.toUpperCase()}`, {
      x: 50,
      y: y,
      size: 8,
      font: fontRegular,
      color: preto
    });
    
    y -= 15;
    page.drawText('TIPO DE DESCONTO: Normal', {
      x: 50,
      y: y,
      size: 8,
      font: fontRegular,
      color: preto
    });
    
    y -= 25;
    
    page.drawText(`Localizador: ${dados.localizador}`, {
      x: 50,
      y: y,
      size: 9,
      font: fontBold,
      color: preto
    });
    
    y -= 15;
    
    page.drawText(`No bilhete: ${dados.numeroBilhete}`, {
      x: 50,
      y: y,
      size: 8,
      font: fontRegular,
      color: preto
    });
    
    y -= 25;
    drawLine(y);
    y -= 20;
    
    // === RODAPÉ ===
    page.drawText('IMPORTANTE:', {
      x: 50,
      y: y,
      size: 8,
      font: fontBold,
      color: cinza
    });
    y -= 12;
    
    const avisos = [
      '- Chegue com 30 minutos de antecedencia',
      '- Apresente documento com foto no embarque',
      '- Guarde este bilhete ate o final da viagem'
    ];
    
    avisos.forEach(texto => {
      page.drawText(texto, {
        x: 50,
        y: y,
        size: 7,
        font: fontRegular,
        color: cinza
      });
      y -= 10;
    });
    
    y -= 10;
    
    page.drawText('Good Trip Transporte e Turismo LTDA', {
      x: width / 2 - 90,
      y: y,
      size: 7,
      font: fontRegular,
      color: cinza
    });
    y -= 10;
    
    page.drawText('WhatsApp: (93) 99143-6570', {
      x: width / 2 - 65,
      y: y,
      size: 7,
      font: fontRegular,
      color: cinza
    });
    y -= 10;
    
    page.drawText('www.goodtrip.com.br', {
      x: width / 2 - 50,
      y: y,
      size: 7,
      font: fontRegular,
      color: cinza
    });
    
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
    
  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error);
    throw error;
  }
}