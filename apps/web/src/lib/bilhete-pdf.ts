// apps/web/src/lib/bilhete-pdf.ts
import PDFDocument from 'pdfkit';

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
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4',
        margin: 40,
        bufferPages: true
      });

      const buffers: Buffer[] = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // === CABEÇALHO ===
      doc.fontSize(20)
         .fillColor('#1E40AF')
         .text('GOOD TRIP', { align: 'center' });
      
      doc.fontSize(14)
         .fillColor('#000000')
         .text('Bilhete de Passagem Eletrônico', { align: 'center' });
      
      doc.moveDown();
      doc.moveTo(40, doc.y)
         .lineTo(555, doc.y)
         .stroke();
      doc.moveDown();

      // === DADOS DA VIAGEM ===
      doc.fontSize(12)
         .fillColor('#1E40AF')
         .text('ROTA', { underline: true });
      
      doc.fontSize(11)
         .fillColor('#000000')
         .text(`${dados.origemNome} → ${dados.destinoNome}`, { indent: 20 });
      
      doc.moveDown(0.5);

      doc.fontSize(10)
         .text(`Data: ${dados.dataFormatada}`, { indent: 20 })
         .text(`Saida: ${dados.horarioSaida}  |  Chegada: ${dados.horarioChegada}`, { indent: 20 })
         .text(`Classe: ${dados.classe}  |  Empresa: ${dados.empresa}`, { indent: 20 });
      
      doc.moveDown();

      // === PASSAGEIRO ===
      doc.fontSize(12)
         .fillColor('#1E40AF')
         .text('PASSAGEIRO', { underline: true });
      
      doc.fontSize(11)
         .fillColor('#000000')
         .text(dados.passageiro.nome, { indent: 20 })
         .fontSize(10)
         .text(`CPF: ${dados.passageiro.documento}`, { indent: 20 });
      
      doc.moveDown();

      // === ASSENTO ===
      doc.fontSize(12)
         .fillColor('#1E40AF')
         .text('ASSENTO', { underline: true });
      
      doc.fontSize(16)
         .fillColor('#000000')
         .text(dados.assento, { indent: 20 });
      
      doc.moveDown();

      // === LOCALIZADOR ===
      doc.fontSize(12)
         .fillColor('#1E40AF')
         .text('LOCALIZADOR', { underline: true });
      
      doc.fontSize(14)
         .fillColor('#000000')
         .text(dados.localizador, { indent: 20 });
      
      doc.moveDown();

      // === VALORES ===
      doc.fontSize(12)
         .fillColor('#1E40AF')
         .text('VALORES', { underline: true });
      
      doc.fontSize(10)
         .fillColor('#000000')
         .text(`Tarifa: R$ ${dados.tarifa.toFixed(2)}`, { indent: 20 })
         .text(`Pedagio: R$ ${dados.pedagio.toFixed(2)}`, { indent: 20 })
         .text(`Taxa Embarque: R$ ${dados.taxaEmbarque.toFixed(2)}`, { indent: 20 })
         .text(`Seguro: R$ ${dados.seguro.toFixed(2)}`, { indent: 20 })
         .text(`Outros: R$ ${dados.outros.toFixed(2)}`, { indent: 20 });
      
      doc.moveDown(0.5);
      
      doc.fontSize(12)
         .fillColor('#1E40AF')
         .text(`TOTAL: R$ ${dados.total.toFixed(2)}`, { indent: 20 });
      
      doc.moveDown();

      // === RODAPÉ ===
      doc.moveTo(40, doc.y)
         .lineTo(555, doc.y)
         .stroke();
      
      doc.moveDown();
      
      doc.fontSize(9)
         .fillColor('#666666')
         .text('IMPORTANTE:', { continued: false })
         .text('- Chegue com 30 minutos de antecedencia', { indent: 10 })
         .text('- Apresente documento com foto no embarque', { indent: 10 })
         .text('- Guarde este bilhete ate o final da viagem', { indent: 10 });
      
      doc.moveDown();
      
      doc.fontSize(8)
         .text('Good Trip Transporte e Turismo LTDA', { align: 'center' })
         .text('WhatsApp: (93) 99143-6570', { align: 'center' })
         .text('www.goodtrip.com.br', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}