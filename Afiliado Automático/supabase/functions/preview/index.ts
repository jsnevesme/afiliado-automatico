// Supabase Edge Function: preview
// Smart OpenGraph Preview Bridge para WhatsApp, Telegram e redes sociais.
// Garante que ofertas (mesmo com vídeo na 1ª posição ou links Shopee bloqueados pelo Facebook crawler)
// exibam a foto oficial do produto em alta resolução no Link Preview nativo do WhatsApp.
// URL: https://pbatxljxcnkogcqfhomc.supabase.co/functions/v1/preview

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://pbatxljxcnkogcqfhomc.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiYXR4bGp4Y25rb2djcWZob21jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzNDc4OTUsImV4cCI6MjEwODkyMzg5NX0.jdxHvK_dYjNxW6DL3FXQQLXm56U1A6nTseHsXFWedsQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function escapeHtml(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
        "Access-Control-Allow-Headers": "*"
      }
    });
  }

  const reqUrl = new URL(req.url);

  // Endpoint para criação rápida de preview link via POST
  if (req.method === "POST") {
    try {
      const body = await req.json();
      const id = body.id || Math.random().toString(36).substring(2, 8);
      const targetUrl = body.url || body.targetUrl;
      const imageUrl = body.img || body.imageUrl;
      const title = body.title || "Oferta Imperdível";
      const price = body.price || "";

      if (!targetUrl || !imageUrl) {
        return new Response(JSON.stringify({ error: "url e img são obrigatórios" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      await supabase.from("preview_links").upsert({
        id,
        target_url: targetUrl,
        image_url: imageUrl,
        title,
        price
      });

      const previewUrl = `${reqUrl.origin}/functions/v1/preview?p=${id}`;
      return new Response(JSON.stringify({ success: true, id, previewUrl }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
  }

  // Tratamento GET (crawlers e redirecionamento de cliques de usuários)
  let pParam = reqUrl.searchParams.get("p") || reqUrl.searchParams.get("id");
  let targetParam = reqUrl.searchParams.get("url");
  let imgParam = reqUrl.searchParams.get("img");
  let titleParam = reqUrl.searchParams.get("title");
  let priceParam = reqUrl.searchParams.get("price");
  let descParam = reqUrl.searchParams.get("desc");

  // Se veio via path (ex: /functions/v1/preview/s7x9k2)
  const pathParts = reqUrl.pathname.split("/").filter(Boolean);
  const lastSegment = pathParts[pathParts.length - 1];
  if (!pParam && lastSegment && lastSegment !== "preview") {
    pParam = lastSegment;
  }

  // Se veio parâmetro curto 'p', busca no banco preview_links
  if (pParam) {
    try {
      const { data } = await supabase
        .from("preview_links")
        .select("target_url, image_url, title, price")
        .eq("id", pParam)
        .maybeSingle();

      if (data) {
        targetParam = data.target_url;
        imgParam = data.image_url;
        titleParam = data.title;
        priceParam = data.price;
      }
    } catch (dbErr) {
      console.warn("Erro ao buscar preview_link:", dbErr);
    }
  }

  if (!targetParam) {
    return new Response("Oferta não encontrada ou parâmetro 'url' ausente.", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }

  let targetUrl = targetParam.trim();
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = "https://" + targetUrl;
  }

  const userAgent = req.headers.get("user-agent") || "";
  const isCrawler = /whatsapp|facebookexternalhit|facebot|twitterbot|slackbot|telegrambot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest\/0\.|bingpreview|googlebot/i.test(userAgent);

  // Se não for crawler (usuário humano clicando no card ou link),
  // faz redirecionamento instantâneo (302) para o link oficial de afiliado
  if (!isCrawler) {
    return new Response(null, {
      status: 302,
      headers: {
        "Location": targetUrl,
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  }

  // Se for o crawler do WhatsApp/Facebook, serve o OpenGraph com a foto do produto
  const productImg = imgParam ? imgParam.trim() : "";
  const productTitle = titleParam ? titleParam.trim() : "Oferta Imperdível";
  const productPrice = priceParam ? priceParam.trim() : "";
  const customDesc = descParam ? descParam.trim() : "";

  const metaDesc = customDesc || (productPrice
    ? `🔥 Por apenas ${productPrice}! Aproveite o desconto exclusivo no link oficial.`
    : "Aproveite esta oferta exclusiva com desconto especial.");

  const safeTitle = escapeHtml(productTitle);
  const safeDesc = escapeHtml(metaDesc);
  const safeImg = escapeHtml(productImg);
  const safeUrl = escapeHtml(targetUrl);

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
  
  <!-- OpenGraph Metadata para WhatsApp, Facebook e Telegram -->
  <meta property="og:site_name" content="Afiliado Automático">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDesc}">
  <meta property="og:type" content="product">
  <meta property="og:url" content="${safeUrl}">
  ${safeImg ? `<meta property="og:image" content="${safeImg}">` : ""}
  ${safeImg ? `<meta property="og:image:secure_url" content="${safeImg}">` : ""}
  ${safeImg ? `<meta property="og:image:type" content="image/jpeg">` : ""}
  <meta property="og:image:width" content="600">
  <meta property="og:image:height" content="600">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDesc}">
  ${safeImg ? `<meta name="twitter:image" content="${safeImg}">` : ""}

  <!-- Redirecionamento instantâneo se um navegador abrir o HTML diretamente -->
  <meta http-equiv="refresh" content="0;url=${safeUrl}">
</head>
<body style="font-family: sans-serif; text-align: center; padding: 40px; background-color: #f8fafc; color: #1e293b;">
  <p style="font-size: 16px; font-weight: bold;">Redirecionando para a oferta oficial...</p>
  <p><a href="${safeUrl}" style="color: #2563eb; text-decoration: underline;">Clique aqui se não for redirecionado automaticamente</a>.</p>
  <script>window.location.replace(${JSON.stringify(targetUrl)});</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400"
    }
  });
});
