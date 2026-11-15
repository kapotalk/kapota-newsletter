import { C, DISPLAY, MONO, esc } from "./templates.js";

const FONTES =
  "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Geist+Mono:wght@500&display=swap";
const BLOG = "https://kapota.com.br/blog/";

// Página simples na identidade do email, usada por /confirm e /unsubscribe.
export function pageResponse({ titulo, texto, status = 200 }) {
  const html = `<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(titulo)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="${FONTES}" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  body { margin:0; background:${C.preto}; color:${C.branco}; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; min-height:100vh; }
  main { max-width:640px; margin:0 auto; padding:28px 20px 48px; min-height:100vh; display:flex; flex-direction:column; }
  .marca { display:flex; align-items:center; gap:12px; font-family:${DISPLAY}; font-weight:800; font-size:19px; letter-spacing:-0.04em; }
  .bola { width:34px; height:34px; border-radius:50%; background:${C.brasa}; color:${C.preto}; display:flex; align-items:center; justify-content:center; font-size:17px; }
  .corpo { margin:auto 0; padding:72px 0 40px; }
  .rotulo { font-family:${MONO}; font-size:11px; font-weight:500; letter-spacing:0.14em; text-transform:uppercase; color:${C.fumaca}; margin:0; }
  .rotulo i { display:inline-block; width:8px; height:8px; background:${C.brasa}; margin-right:10px; }
  h1 { font-family:${DISPLAY}; font-weight:800; font-size:clamp(38px,11vw,64px); line-height:0.98; letter-spacing:-0.035em; margin:18px 0 0; overflow-wrap:anywhere; }
  p.texto { margin:20px 0 0; max-width:440px; font-size:16px; line-height:1.55; color:${C.fumaca}; }
  a.botao { display:inline-block; margin-top:32px; background:${C.brasa}; color:${C.preto}; text-decoration:none; font-weight:700; font-size:15px; line-height:1; padding:16px 28px; border-radius:999px; }
</style>
</head>
<body><main>
  <div class="marca"><span class="bola">K</span><span>Klysman Kley</span></div>
  <div class="corpo">
    <p class="rotulo"><i></i>Leitura de Mercado</p>
    <h1>${esc(titulo)}</h1>
    <p class="texto">${esc(texto)}</p>
    <a class="botao" href="${BLOG}">Ir pra Leitura de Mercado &rarr;</a>
  </div>
</main></body></html>`;
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
