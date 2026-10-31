// Vercel Serverless Function: Smart OpenGraph Preview Bridge para WhatsApp
// Garante que ofertas (mesmo com vídeo na 1ª posição ou links encurtados da Shopee)
// carreguem a foto oficial em alta resolução no WhatsApp Web via Link Preview nativo sem anexar arquivo.
// URL: https://afiliado-automatico.vercel.app/api/p

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, img, title, price, desc } = req.query;

  if (!url) {
    return res.status(400).send('URL de destino não informada.');
  }

  let targetUrl = decodeURIComponent(url).trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }

  const userAgent = req.headers['user-agent'] || '';
  const isCrawler = /whatsapp|facebookexternalhit|twitterbot|slackbot|telegrambot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest\/0\.|bingpreview/i.test(userAgent);

  // Se não for um crawler de prévia de redes sociais (ou seja, é um usuário humano clicando no link),
  // redireciona instantaneamente para o link de afiliado oficial
  if (!isCrawler) {
    res.setHeader('Location', targetUrl);
    return res.status(302).end();
  }

  // Se for o crawler do WhatsApp, serve a página OpenGraph perfeita com a foto do produto
  let productImg = img ? decodeURIComponent(img).trim() : '';
  const productTitle = title ? decodeURIComponent(title).trim() : 'Oferta Imperdível';
  const productPrice = price ? decodeURIComponent(price).trim() : '';
  const customDesc = desc ? decodeURIComponent(desc).trim() : '';

  const metaDesc = customDesc || (productPrice 
    ? `🔥 Por apenas ${productPrice}! Compre agora no link oficial com desconto exclusivo.`
    : 'Aproveite esta oferta exclusiva com desconto especial.');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');

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
  ${safeImg ? `<meta property="og:image" content="${safeImg}">` : ''}
  ${safeImg ? `<meta property="og:image:secure_url" content="${safeImg}">` : ''}
  ${safeImg ? `<meta property="og:image:type" content="image/jpeg">` : ''}
  <meta property="og:image:width" content="600">
  <meta property="og:image:height" content="600">
  
  <!-- Twitter Card Metadata -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDesc}">
  ${safeImg ? `<meta name="twitter:image" content="${safeImg}">` : ''}

  <!-- Redirecionamento instantâneo de segurança -->
  <meta http-equiv="refresh" content="0;url=${safeUrl}">
</head>
<body style="font-family: sans-serif; text-align: center; padding: 40px;">
  <p>Redirecionando para a oferta oficial...</p>
  <p><a href="${safeUrl}">Clique aqui se não for redirecionado automaticamente</a>.</p>
  <script>window.location.replace(${JSON.stringify(targetUrl)});</script>
</body>
</html>`;

  return res.status(200).send(html);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
