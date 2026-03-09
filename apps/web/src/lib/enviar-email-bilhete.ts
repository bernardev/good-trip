// apps/web/src/lib/enviar-email-bilhete.ts
import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || 'noreply@ehcode.dev';
const SMTP_PASS = process.env.SMTP_PASS || '';
const ADMIN_EMAIL = 'jucelino@goodtrip.com.br';

type DadosBilhete = {
  localizador: string;
  numeroBilhete: string;
  origem: string;
  destino: string;
  data: string;
  horario: string;
  assentos: string[];
  passageiro: string;
  emailCliente: string;
  valor: number;
};

/**
 * Envia email com bilhete PDF anexo para o admin
 */
export async function enviarEmailBilheteAdmin(
  pdfBuffer: Buffer,
  dados: DadosBilhete
): Promise<{ sucesso: boolean; erro?: string }> {
  
  if (!SMTP_PASS) {
    console.error('SMTP_PASS não configurada no .env');
    return { sucesso: false, erro: 'Configuração de email incompleta' };
  }

  try {
    // 🔧 Criar transporter com SMTP Hostinger
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true para 465, false para 587
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false, // Para evitar problemas com certificados
      },
    });

    // Testar conexão
    await transporter.verify();
    console.log('Conexão SMTP verificada com sucesso!');

    const htmlAdmin = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; }
    .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 25px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 25px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .info-box { background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
    .info-row { padding: 8px 0; border-bottom: 1px solid #e0e7ff; }
    .info-row:last-child { border-bottom: none; }
    .label { font-weight: bold; color: #1e3a8a; display: inline-block; width: 160px; }
    .value { color: #1f2937; }
    .highlight { background: #dbeafe; padding: 15px; border-radius: 6px; text-align: center; margin: 15px 0; }
    .highlight strong { color: #1e40af; font-size: 20px; }
    .footer { text-align: center; margin-top: 25px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">🎫 Novo Bilhete Emitido</h2>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Sistema Good Trip</p>
    </div>
    
    <div class="content">
      <div class="highlight">
        <p style="margin: 0; font-size: 14px; color: #6b7280;">Localizador</p>
        <strong>${dados.localizador}</strong>
      </div>

      <div class="info-box">
        <h3 style="margin-top: 0; color: #1e3a8a;">📋 Informações do Bilhete</h3>
        
        <div class="info-row">
          <span class="label">Nº Bilhete:</span>
          <span class="value">${dados.numeroBilhete}</span>
        </div>
        
        <div class="info-row">
          <span class="label">Passageiro:</span>
          <span class="value">${dados.passageiro}</span>
        </div>
        
        <div class="info-row">
          <span class="label">Email Cliente:</span>
          <span class="value">${dados.emailCliente}</span>
        </div>
        
        <div class="info-row">
          <span class="label">Origem:</span>
          <span class="value">${dados.origem}</span>
        </div>
        
        <div class="info-row">
          <span class="label">Destino:</span>
          <span class="value">${dados.destino}</span>
        </div>
        
        <div class="info-row">
          <span class="label">Data/Hora:</span>
          <span class="value">${dados.data} às ${dados.horario}</span>
        </div>
        
        <div class="info-row">
          <span class="label">Assento(s):</span>
          <span class="value">${dados.assentos.join(', ')}</span>
        </div>
        
        <div class="info-row">
          <span class="label">Valor Total:</span>
          <span class="value" style="font-weight: bold; color: #059669;">R$ ${dados.valor.toFixed(2)}</span>
        </div>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
        📎 Bilhete em PDF anexado neste email.
      </p>

      <div class="footer">
        <p style="margin: 0;"><strong>Good Trip</strong> - Sistema de Gestão</p>
        <p style="margin: 5px 0 0 0; font-size: 12px;">Email automático</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const nomeArquivo = `bilhete-${dados.localizador}.pdf`;

    console.log(`Enviando bilhete para admin: ${ADMIN_EMAIL}`);
    
    await transporter.sendMail({
      from: `"Good Trip Sistema" <${SMTP_USER}>`,
      to: ADMIN_EMAIL,
      subject: `Bilhete ${dados.localizador} - ${dados.passageiro}`,
      html: htmlAdmin,
      attachments: [
        {
          filename: nomeArquivo,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    console.log('Email enviado para admin com sucesso!');
    return { sucesso: true };

  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Envia email com bilhete PDF anexo para o CLIENTE
 */
export async function enviarEmailBilheteCliente(
  pdfBuffer: Buffer,
  dados: DadosBilhete
): Promise<{ sucesso: boolean; erro?: string }> {

  if (!SMTP_PASS) {
    console.error('SMTP_PASS não configurada no .env');
    return { sucesso: false, erro: 'Configuração de email incompleta' };
  }

  if (!dados.emailCliente) {
    console.error('Email do cliente não informado');
    return { sucesso: false, erro: 'Email do cliente não informado' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      tls: { rejectUnauthorized: false },
    });

    await transporter.verify();

    const htmlCliente = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; }
    .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .content { background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .localizador { background: #dbeafe; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .localizador strong { color: #1e40af; font-size: 24px; letter-spacing: 2px; }
    .info-box { background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
    .info-row { padding: 10px 0; border-bottom: 1px solid #e0e7ff; display: flex; justify-content: space-between; }
    .info-row:last-child { border-bottom: none; }
    .label { font-weight: bold; color: #1e3a8a; }
    .value { color: #1f2937; text-align: right; }
    .alert { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 14px; color: #92400e; }
    .footer { text-align: center; margin-top: 25px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0; font-size: 22px;">Sua passagem est\u00e1 confirmada!</h2>
      <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 14px;">Good Trip - Passagens Rodovi\u00e1rias</p>
    </div>

    <div class="content">
      <p style="font-size: 16px;">Ol\u00e1, <strong>${dados.passageiro}</strong>!</p>
      <p>Sua compra foi realizada com sucesso. Segue abaixo os detalhes da sua viagem e o bilhete em PDF anexo.</p>

      <div class="localizador">
        <p style="margin: 0; font-size: 13px; color: #6b7280;">Localizador</p>
        <strong>${dados.localizador}</strong>
      </div>

      <div class="info-box">
        <div class="info-row">
          <span class="label">Origem</span>
          <span class="value">${dados.origem}</span>
        </div>
        <div class="info-row">
          <span class="label">Destino</span>
          <span class="value">${dados.destino}</span>
        </div>
        <div class="info-row">
          <span class="label">Data</span>
          <span class="value">${dados.data}</span>
        </div>
        <div class="info-row">
          <span class="label">Hor\u00e1rio</span>
          <span class="value">${dados.horario}</span>
        </div>
        <div class="info-row">
          <span class="label">Assento(s)</span>
          <span class="value">${dados.assentos.join(', ')}</span>
        </div>
        <div class="info-row">
          <span class="label">Valor</span>
          <span class="value" style="font-weight: bold; color: #059669;">R$ ${dados.valor.toFixed(2)}</span>
        </div>
      </div>

      <div class="alert">
        <strong>Dica:</strong> Salve o bilhete em PDF no seu celular para acesso offline. Apresente-o no embarque.
      </div>

      <p style="color: #6b7280; font-size: 14px;">
        Em caso de d\u00favidas, entre em contato pelo WhatsApp: <strong>(93) 99143-6570</strong>
      </p>

      <div class="footer">
        <p style="margin: 0;"><strong>Good Trip</strong></p>
        <p style="margin: 5px 0 0 0;">Boa viagem!</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const nomeArquivo = `bilhete-${dados.localizador}.pdf`;

    console.log(`Enviando bilhete para cliente: ${dados.emailCliente}`);

    await transporter.sendMail({
      from: `"Good Trip" <${SMTP_USER}>`,
      to: dados.emailCliente,
      cc: 'ebernardes.dev@gmail.com',
      subject: `Sua passagem ${dados.origem} \u2192 ${dados.destino} - ${dados.data} | Good Trip`,
      html: htmlCliente,
      attachments: [
        {
          filename: nomeArquivo,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    console.log('Email enviado para cliente com sucesso!');
    return { sucesso: true };

  } catch (error) {
    console.error('Erro ao enviar email para cliente:', error);
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}