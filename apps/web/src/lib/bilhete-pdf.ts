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
    let y = height - 60;
    
    const azul = rgb(0.118, 0.251, 0.686); // #1E40AF
    const preto = rgb(0, 0, 0);
    const cinza = rgb(0.4, 0.4, 0.4);
    
    // === CABEÇALHO ===
    page.drawText('GOOD TRIP', {
      x: width / 2 - 80,
      y: y,
      size: 24,
      font: fontBold,
      color: azul
    });
    y -= 25;
    
    page.drawText('Bilhete de Passagem Eletronico', {
      x: width / 2 - 110,
      y: y,
      size: 14,
      font: fontRegular,
      color: preto
    });
    y -= 30;
    
    // Linha horizontal
    page.drawLine({
      start: { x: 40, y: y },
      end: { x: width - 40, y: y },
      thickness: 1,
      color: cinza
    });
    y -= 25;
    
    // === ROTA ===
    page.drawText('ROTA', {
      x: 40,
      y: y,
      size: 12,
      font: fontBold,
      color: azul
    });
    y -= 20;
    
    page.drawText(`${dados.origemNome} -> ${dados.destinoNome}`, {
      x: 60,
      y: y,
      size: 11,
      font: fontRegular,
      color: preto
    });
    y -= 25;
    
    page.drawText(`Data: ${dados.dataFormatada}`, {
      x: 60,
      y: y,
      size: 10,
      font: fontRegular,
      color: preto
    });
    y -= 15;
    
    page.drawText(`Saida: ${dados.horarioSaida}  |  Chegada: ${dados.horarioChegada}`, {
      x: 60,
      y: y,
      size: 10,
      font: fontRegular,
      color: preto
    });
    y -= 15;
    
    page.drawText(`Classe: ${dados.classe}  |  Empresa: ${dados.empresa}`, {
      x: 60,
      y: y,
      size: 10,
      font: fontRegular,
      color: preto
    });
    y -= 30;
    
    // === PASSAGEIRO ===
    page.drawText('PASSAGEIRO', {
      x: 40,
      y: y,
      size: 12,
      font: fontBold,
      color: azul
    });
    y -= 20;
    
    page.drawText(dados.passageiro.nome, {
      x: 60,
      y: y,
      size: 11,
      font: fontRegular,
      color: preto
    });
    y -= 18;
    
    page.drawText(`CPF: ${dados.passageiro.documento}`, {
      x: 60,
      y: y,
      size: 10,
      font: fontRegular,
      color: preto
    });
    y -= 30;
    
    // === ASSENTO ===
    page.drawText('ASSENTO', {
      x: 40,
      y: y,
      size: 12,
      font: fontBold,
      color: azul
    });
    y -= 25;
    
    page.drawText(dados.assento, {
      x: 60,
      y: y,
      size: 18,
      font: fontBold,
      color: preto
    });
    y -= 35;
    
    // === LOCALIZADOR ===
    page.drawText('LOCALIZADOR', {
      x: 40,
      y: y,
      size: 12,
      font: fontBold,
      color: azul
    });
    y -= 23;
    
    page.drawText(dados.localizador, {
      x: 60,
      y: y,
      size: 14,
      font: fontBold,
      color: preto
    });
    y -= 35;
    
    // === VALORES ===
    page.drawText('VALORES', {
      x: 40,
      y: y,
      size: 12,
      font: fontBold,
      color: azul
    });
    y -= 18;
    
    const valores = [
      `Tarifa: R$ ${dados.tarifa.toFixed(2)}`,
      `Pedagio: R$ ${dados.pedagio.toFixed(2)}`,
      `Taxa Embarque: R$ ${dados.taxaEmbarque.toFixed(2)}`,
      `Seguro: R$ ${dados.seguro.toFixed(2)}`,
      `Outros: R$ ${dados.outros.toFixed(2)}`
    ];
    
    valores.forEach(texto => {
      page.drawText(texto, {
        x: 60,
        y: y,
        size: 10,
        font: fontRegular,
        color: preto
      });
      y -= 15;
    });
    
    y -= 5;
    page.drawText(`TOTAL: R$ ${dados.total.toFixed(2)}`, {
      x: 60,
      y: y,
      size: 12,
      font: fontBold,
      color: azul
    });
    y -= 30;
    
    // === RODAPÉ ===
    page.drawLine({
      start: { x: 40, y: y },
      end: { x: width - 40, y: y },
      thickness: 1,
      color: cinza
    });
    y -= 20;
    
    page.drawText('IMPORTANTE:', {
      x: 40,
      y: y,
      size: 9,
      font: fontBold,
      color: cinza
    });
    y -= 15;
    
    const avisos = [
      '- Chegue com 30 minutos de antecedencia',
      '- Apresente documento com foto no embarque',
      '- Guarde este bilhete ate o final da viagem'
    ];
    
    avisos.forEach(texto => {
      page.drawText(texto, {
        x: 50,
        y: y,
        size: 8,
        font: fontRegular,
        color: cinza
      });
      y -= 12;
    });
    
    y -= 10;
    
    const rodape = [
      'Good Trip Transporte e Turismo LTDA',
      'WhatsApp: (93) 99143-6570',
      'www.goodtrip.com.br'
    ];
    
    rodape.forEach(texto => {
      const textWidth = fontRegular.widthOfTextAtSize(texto, 8);
      page.drawText(texto, {
        x: (width - textWidth) / 2,
        y: y,
        size: 8,
        font: fontRegular,
        color: cinza
      });
      y -= 12;
    });
    
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
    
  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error);
    throw error;
  }
}