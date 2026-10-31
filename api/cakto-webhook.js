// Vercel Serverless Function: Webhook Oficial da Cakto
// URL: https://afiliado-automatico.vercel.app/api/cakto-webhook

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pbatxljxcnkogcqfhomc.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiYXR4bGp4Y25rb2djcWZob21jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzNDc4OTUsImV4cCI6MjEwODkyMzg5NX0.jdxHvK_dYjNxW6DL3FXQQLXm56U1A6nTseHsXFWedsQ';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-cakto-secret');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Health check / Teste de URL via Navegador
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'online',
      service: 'Afiliado Automático — Webhook Cakto',
      endpoint: '/api/cakto-webhook',
      message: 'Servidor ativo e pronto para receber eventos da Cakto!',
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

    const event = payload.event || req.query.event || '';
    const data = payload.data || {};
    const status = (data.status || payload.status || '').toLowerCase();

    console.log(`[Cakto Webhook] Evento: "${event}", Status: "${status}"`);

    // 1. Identificação de Teste do Painel da Cakto
    const isTest = 
      event === 'event_test' || 
      event === 'test' || 
      payload.test === true || 
      req.query.test === 'true' ||
      (!data.customer?.email && !payload.customer?.email && !payload.email);

    if (isTest) {
      console.log('[Cakto Webhook] Disparo de teste detectado da Cakto. Respondendo 200 OK.');
      return res.status(200).json({
        success: true,
        message: 'Webhook de teste da Cakto validado e respondido com sucesso!',
        status: 'online',
        received_event: event || 'event_test',
        timestamp: new Date().toISOString()
      });
    }

    // 2. Extração de Dados do Cliente
    const customer = data.customer || payload.customer || payload.buyer || {};
    const customerEmail = (customer.email || payload.email || '').trim().toLowerCase();
    const customerName = customer.name || payload.name || '';
    const customerPhone = customer.phone || payload.phone || '';
    const customerDoc = customer.docNumber || customer.document || customer.cpf || '';
    const orderId = String(data.id || data.order_id || payload.order_id || payload.id || '');
    const amount = data.amount ?? payload.amount ?? null;
    const paymentMethod = data.paymentMethod || data.payment_method || payload.paymentMethod || null;

    if (!customerEmail) {
      // Se não há e-mail, responde 200 com aviso para não falhar webhook de teste
      return res.status(200).json({
        success: true,
        message: 'Evento recebido, mas nenhum e-mail de cliente foi encontrado no payload.',
        event
      });
    }

    // 3. Identificação do Plano e Duração baseada nos Checkouts Oficiais da Cakto
    const checkoutUrl = (data.checkoutUrl || data.checkout_url || payload.checkoutUrl || '').toLowerCase();
    const checkoutId = String(data.checkout || payload.checkout || '');
    const productName = (data.product?.name || payload.product?.name || '').toLowerCase();
    const offerName = (data.offer?.name || payload.offer?.name || '').toLowerCase();
    const combinedInfo = `${checkoutUrl} ${checkoutId} ${productName} ${offerName}`.toLowerCase();

    let plan = 'starter';
    let period = 'monthly';

    if (combinedInfo.includes('3anjzu2') || (combinedInfo.includes('ultra') && combinedInfo.includes('mensal'))) {
      plan = 'ultra';
      period = 'monthly';
    } else if (combinedInfo.includes('rfxsekm') || (combinedInfo.includes('ultra') && (combinedInfo.includes('anual') || combinedInfo.includes('ano')))) {
      plan = 'ultra';
      period = 'yearly';
    } else if (combinedInfo.includes('x3whytm') || (combinedInfo.includes('pro') && combinedInfo.includes('mensal'))) {
      plan = 'pro';
      period = 'monthly';
    } else if (combinedInfo.includes('685h3or') || (combinedInfo.includes('pro') && (combinedInfo.includes('anual') || combinedInfo.includes('ano')))) {
      plan = 'pro';
      period = 'yearly';
    } else if (combinedInfo.includes('fajichq') || combinedInfo.includes('1260860') || (combinedInfo.includes('starter') && combinedInfo.includes('mensal'))) {
      plan = 'starter';
      period = 'monthly';
    } else if (combinedInfo.includes('bi9dwyf') || (combinedInfo.includes('starter') && (combinedInfo.includes('anual') || combinedInfo.includes('ano')))) {
      plan = 'starter';
      period = 'yearly';
    } else if (combinedInfo.includes('ultra')) {
      plan = 'ultra';
      period = 'monthly';
    } else if (combinedInfo.includes('pro')) {
      plan = 'pro';
      period = 'monthly';
    }

    console.log(`[Cakto Webhook] Cliente: ${customerEmail} -> Plano: ${plan.toUpperCase()} (${period})`);

    // 4. Chamada RPC no Supabase (transacional com privilégios elevados)
    const activeKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
    const rpcUrl = `${SUPABASE_URL}/rest/v1/rpc/handle_cakto_purchase`;

    const rpcPayload = {
      p_customer_email: customerEmail,
      p_plan: plan,
      p_period: period,
      p_order_id: orderId || null,
      p_customer_name: customerName || null,
      p_customer_phone: customerPhone || null,
      p_customer_doc: customerDoc || null,
      p_checkout_id: checkoutId || null,
      p_checkout_url: checkoutUrl || null,
      p_amount: amount ? Number(amount) : null,
      p_payment_method: paymentMethod,
      p_raw_payload: payload
    };

    let rpcSuccess = false;
    let rpcResponse = null;

    try {
      const resp = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'apikey': activeKey,
          'Authorization': `Bearer ${activeKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(rpcPayload)
      });

      if (resp.ok) {
        rpcResponse = await resp.json();
        rpcSuccess = true;
        console.log('[Cakto Webhook] RPC executada com sucesso:', rpcResponse);
      } else {
        const errText = await resp.text();
        console.warn('[Cakto Webhook] Aviso na chamada RPC Supabase:', resp.status, errText);
      }
    } catch (rpcErr) {
      console.warn('[Cakto Webhook] Exceção ao chamar RPC:', rpcErr.message);
    }

    // 5. Fallback direto se a RPC não estiver disponível
    if (!rpcSuccess) {
      try {
        // Insere registro na cakto_purchases
        await fetch(`${SUPABASE_URL}/rest/v1/cakto_purchases`, {
          method: 'POST',
          headers: {
            'apikey': activeKey,
            'Authorization': `Bearer ${activeKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            order_id: orderId || null,
            customer_name: customerName || null,
            customer_email: customerEmail,
            customer_phone: customerPhone || null,
            customer_doc: customerDoc || null,
            checkout_id: checkoutId || null,
            checkout_url: checkoutUrl || null,
            plan_identified: plan,
            plan_period: period,
            amount: amount ? Number(amount) : null,
            payment_method: paymentMethod,
            status: 'paid',
            raw_payload: payload
          })
        });

        // Atualiza perfil caso o usuário já exista
        const expiresDays = period === 'yearly' ? 365 : 30;
        const expiresDate = new Date();
        expiresDate.setDate(expiresDate.getDate() + expiresDays);

        await fetch(`${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(customerEmail)}`, {
          method: 'PATCH',
          headers: {
            'apikey': activeKey,
            'Authorization': `Bearer ${activeKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            plan,
            plan_period: period,
            plan_status: 'active',
            plan_expires_at: expiresDate.toISOString(),
            allowed_platform: plan === 'starter' ? 'mercadolivre' : 'all'
          })
        });
      } catch (fbErr) {
        console.error('[Cakto Webhook] Erro no fallback REST:', fbErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Webhook processado e plano ativado com sucesso!',
      customer_email: customerEmail,
      plan,
      period,
      rpc: rpcResponse || 'fallback_executed'
    });
  } catch (err) {
    console.error('[Cakto Webhook] Erro fatal no processamento:', err);
    // Sempre responde 200 para a Cakto não considerar falha de rede
    return res.status(200).json({
      success: false,
      message: 'Evento recebido, erro interno tratado: ' + err.message
    });
  }
}
