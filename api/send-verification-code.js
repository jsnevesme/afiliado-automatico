// Vercel Serverless Function: Disparo de Código de Confirmação de Conta por E-mail
// URL: https://afiliado-automatico.vercel.app/api/send-verification-code

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'online',
      service: 'Afiliado Automático — Email Verification Service',
      endpoint: '/api/send-verification-code',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    let payload = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (e) {
        payload = {};
      }
    }
    payload = payload || {};

    const { email, username = 'Afiliado', code } = payload;

    if (!email || !code) {
      return res.status(400).json({ error: 'E-mail e código de confirmação são obrigatórios.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanUsername = String(username).trim();
    const cleanCode = String(code).trim();
    const currentYear = new Date().getFullYear();

    // HTML Oficial com Logotipo e Design da Plataforma
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Código de Confirmação - Afiliado Automático</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #ffffff; border-radius: 24px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #e2e8f0;">
          <!-- Top Header com Logo Oficial -->
          <tr>
            <td align="center" style="padding: 36px 32px 24px 32px; background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%); border-bottom: 1px solid #f1f5f9;">
              <img src="https://afiliado-automatico.vercel.app/logo.png" alt="Afiliado Automático" width="180" style="display: block; max-height: 48px; width: auto; margin: 0 auto;" />
            </td>
          </tr>
          <!-- Conteúdo Principal -->
          <tr>
            <td style="padding: 32px 32px 20px 32px;">
              <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0; text-align: center;">
                Confirmação de Conta
              </h1>
              <p style="font-size: 14px; line-height: 22px; color: #475569; margin: 0 0 20px 0; text-align: center;">
                Olá, <strong>${cleanUsername}</strong>! Bem-vindo ao <strong>Afiliado Automático</strong>.
              </p>
              <p style="font-size: 14px; line-height: 22px; color: #475569; margin: 0 0 24px 0; text-align: center;">
                Para ativar sua conta e desbloquear o acesso ao seu painel e à extensão oficial do Chrome, utilize a senha de confirmação de 6 dígitos abaixo:
              </p>

              <!-- Caixa de Destaque com o Código -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 24px 0;">
                <tr>
                  <td align="center">
                    <div style="background-color: #0f172a; border-radius: 16px; padding: 22px 32px; text-align: center; display: inline-block; box-shadow: 0 8px 16px -4px rgba(15, 23, 42, 0.2);">
                      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; margin-bottom: 6px;">
                        Senha de Confirmação
                      </div>
                      <div style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #38bdf8; font-family: 'Courier New', Courier, monospace;">
                        ${cleanCode}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="font-size: 13px; line-height: 20px; color: #64748b; margin: 0 0 16px 0; text-align: center;">
                ⏱️ Este código expira em <strong>15 minutos</strong>.
              </p>
              <div style="background-color: #f8fafc; border-radius: 12px; padding: 14px; border: 1px dashed #cbd5e1; font-size: 12px; color: #64748b; text-align: center; margin-bottom: 12px;">
                Se você não solicitou este cadastro, nenhuma ação é necessária e você pode desconsiderar este e-mail com segurança.
              </div>
            </td>
          </tr>
          <!-- Rodapé do E-mail -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #f1f5f9;">
              <p style="font-size: 12px; font-weight: 600; color: #475569; margin: 0 0 4px 0;">
                Afiliado Automático
              </p>
              <p style="font-size: 11px; color: #94a3b8; margin: 0;">
                Mercado Livre • Shopee • Amazon • WhatsApp Automation<br>
                © ${currentYear} Afiliado Automático. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const senderEmail = process.env.EMAIL_FROM || 'Afiliado Automático <contato@afiliadoautomatico.com.br>';
    const emailSubject = `Seu código de confirmação: ${cleanCode} - Afiliado Automático`;

    let delivered = false;
    let providerUsed = 'none';

    // 1. Envio via Resend API (Se configurado RESEND_API_KEY)
    if (process.env.RESEND_API_KEY) {
      try {
        const fromAddress = process.env.RESEND_FROM || senderEmail;
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [cleanEmail],
            subject: emailSubject,
            html: htmlBody
          })
        });

        if (resendRes.ok) {
          delivered = true;
          providerUsed = 'resend';
          console.log(`[Email] Enviado com sucesso via Resend para ${cleanEmail}`);
        } else {
          const errData = await resendRes.json();
          console.warn('[Email] Erro Resend:', errData);
        }
      } catch (err) {
        console.warn('[Email] Falha ao enviar via Resend:', err);
      }
    }

    // 2. Envio via Brevo / Sendinblue (Se configurado BREVO_API_KEY)
    if (!delivered && process.env.BREVO_API_KEY) {
      try {
        const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': process.env.BREVO_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sender: { name: 'Afiliado Automático', email: process.env.BREVO_FROM || 'contato@afiliadoautomatico.com.br' },
            to: [{ email: cleanEmail, name: cleanUsername }],
            subject: emailSubject,
            htmlContent: htmlBody
          })
        });

        if (brevoRes.ok) {
          delivered = true;
          providerUsed = 'brevo';
          console.log(`[Email] Enviado com sucesso via Brevo para ${cleanEmail}`);
        } else {
          const errData = await brevoRes.json();
          console.warn('[Email] Erro Brevo:', errData);
        }
      } catch (err) {
        console.warn('[Email] Falha ao enviar via Brevo:', err);
      }
    }

    // 3. Envio via SendGrid (Se configurado SENDGRID_API_KEY)
    if (!delivered && process.env.SENDGRID_API_KEY) {
      try {
        const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: cleanEmail }] }],
            from: { email: process.env.SENDGRID_FROM || 'contato@afiliadoautomatico.com.br', name: 'Afiliado Automático' },
            subject: emailSubject,
            content: [{ type: 'text/html', value: htmlBody }]
          })
        });

        if (sgRes.ok) {
          delivered = true;
          providerUsed = 'sendgrid';
          console.log(`[Email] Enviado com sucesso via SendGrid para ${cleanEmail}`);
        }
      } catch (err) {
        console.warn('[Email] Falha ao enviar via SendGrid:', err);
      }
    }

    console.log(`[Email Verification] Código para ${cleanEmail}: [${cleanCode}] (Provedor: ${providerUsed}, Entregue: ${delivered})`);

    return res.status(200).json({
      success: true,
      delivered,
      provider: providerUsed,
      message: delivered
        ? 'E-mail de confirmação enviado com sucesso!'
        : 'Código de confirmação gerado com sucesso.',
      email: cleanEmail,
      // Retorna o código no payload caso nenhum provedor externo SMTP/API esteja configurado ainda,
      // permitindo que o usuário ou ambiente de testes conclua a verificação normalmente
      code: !delivered ? cleanCode : undefined
    });
  } catch (error) {
    console.error('[Email Verification] Erro no processador:', error);
    return res.status(500).json({ error: error.message || 'Erro interno ao processar e-mail de confirmação.' });
  }
}
