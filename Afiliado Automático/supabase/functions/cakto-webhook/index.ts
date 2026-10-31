import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CAKTO_SECRET = "f8c3de3d-1fea-4d7c-a8b0-29f63c4c3454";

Deno.serve(async (req: Request) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const rawBody = await req.text();
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validação de Secret
    const incomingSecret = payload.secret || req.headers.get("x-cakto-secret");
    if (incomingSecret !== CAKTO_SECRET) {
      console.warn("Unauthorized webhook attempt: secret mismatch", incomingSecret);
      return new Response(JSON.stringify({ error: "Unauthorized: Invalid secret" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const event = payload.event;
    const data = payload.data || {};
    const status = data.status || "";

    console.log(`Recebido evento Cakto: ${event}, status: ${status}`);

    // Só processamos compras aprovadas / pagas
    const isApproved = event === "purchase_approved" || status === "paid" || event === "order_paid";
    if (!isApproved) {
      return new Response(
        JSON.stringify({ message: `Ignorado evento/status não pago: ${event} / ${status}` }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const customer = data.customer || {};
    const email = (customer.email || "").trim().toLowerCase();
    if (!email) {
      return new Response(JSON.stringify({ error: "No customer email found in payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Identificação do Plano e Duração
    const checkoutUrl = (data.checkoutUrl || "").toLowerCase();
    const productName = (data.product?.name || "").toLowerCase();
    const offerName = (data.offer?.name || "").toLowerCase();
    const combinedInfo = `${checkoutUrl} ${productName} ${offerName}`;

    let plan = "starter";
    let period = "monthly";

    if (checkoutUrl.includes("3anjzu2") || (combinedInfo.includes("ultra") && combinedInfo.includes("mensal"))) {
      plan = "ultra";
      period = "monthly";
    } else if (checkoutUrl.includes("rfxsekm") || (combinedInfo.includes("ultra") && (combinedInfo.includes("anual") || combinedInfo.includes("ano")))) {
      plan = "ultra";
      period = "yearly";
    } else if (checkoutUrl.includes("x3whytm") || (combinedInfo.includes("pro") && combinedInfo.includes("mensal"))) {
      plan = "pro";
      period = "monthly";
    } else if (checkoutUrl.includes("685h3or") || (combinedInfo.includes("pro") && (combinedInfo.includes("anual") || combinedInfo.includes("ano")))) {
      plan = "pro";
      period = "yearly";
    } else if (checkoutUrl.includes("fajichq") || (combinedInfo.includes("starter") && combinedInfo.includes("mensal"))) {
      plan = "starter";
      period = "monthly";
    } else if (checkoutUrl.includes("bi9dwyf") || (combinedInfo.includes("starter") && (combinedInfo.includes("anual") || combinedInfo.includes("ano")))) {
      plan = "starter";
      period = "yearly";
    } else if (combinedInfo.includes("ultra")) {
      plan = "ultra";
      period = "monthly";
    } else if (combinedInfo.includes("pro")) {
      plan = "pro";
      period = "monthly";
    }

    // Inicializa cliente admin do Supabase (ignora RLS com service_role)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Registra compra na tabela cakto_purchases
    const { error: purchaseError } = await supabase.from("cakto_purchases").insert({
      order_id: data.id || null,
      customer_name: customer.name || null,
      customer_email: email,
      customer_phone: customer.phone || null,
      customer_doc: customer.docNumber || null,
      checkout_id: data.checkout ? String(data.checkout) : null,
      checkout_url: data.checkoutUrl || null,
      plan_identified: plan,
      plan_period: period,
      amount: data.amount ?? null,
      payment_method: data.paymentMethod || null,
      status: "paid",
      raw_payload: payload,
    });

    if (purchaseError) {
      console.error("Erro ao registrar cakto_purchases:", purchaseError);
    }

    // 2. Procura se existe perfil para este e-mail
    const { data: profiles, error: profileFindError } = await supabase
      .from("profiles")
      .select("*")
      .ilike("email", email);

    if (profileFindError) {
      console.error("Erro ao buscar perfil:", profileFindError);
    }

    let userUpdated = false;
    if (profiles && profiles.length > 0) {
      const profile = profiles[0];
      const now = new Date();
      let expiresAt: Date;
      if (period === "yearly") {
        expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      } else {
        expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      }

      // Regra superadmin: nunca rebaixa jsnevesme@gmail.com
      const isSuperAdmin = profile.role === "superadmin" || email === "jsnevesme@gmail.com";
      const updateData: any = {
        plan: isSuperAdmin ? "ultra" : plan,
        plan_period: isSuperAdmin ? "lifetime" : period,
        plan_status: "active",
        plan_expires_at: isSuperAdmin ? null : expiresAt.toISOString(),
      };

      if (!isSuperAdmin) {
        if (plan === "starter") {
          // Se já tem plataforma permitida definida e diferente de 'all', mantém; senão define 'mercadolivre'
          if (!profile.allowed_platform || profile.allowed_platform === "all") {
            updateData.allowed_platform = "mercadolivre";
          }
        } else {
          updateData.allowed_platform = "all";
        }
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", profile.id);

      if (updateError) {
        console.error("Erro ao atualizar perfil do usuário:", updateError);
      } else {
        userUpdated = true;
        console.log(`Perfil ${email} atualizado com sucesso para plano ${plan} (${period})!`);
      }
    } else {
      console.log(`Compra registrada. Usuário ${email} ainda não tem conta; será ativado no cadastro via trigger.`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Webhook processado com sucesso",
        plan,
        period,
        email,
        userUpdated,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Erro no processamento do webhook:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
