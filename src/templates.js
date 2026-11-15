/* Templates de email na identidade Virada (portado de
   KCM/09-Brands/kapota/design-system/email/email.js).
   Layout em tabela, estilo inline, tema escuro via prefers-color-scheme. */

export const C = {
  preto: "#0a0a0a", carvao: "#161616", papel: "#f3f1ec", branco: "#ffffff",
  cinza: "#5c5c5c", fumaca: "#8f8f8f", linha: "#dcd8cf",
  brasa: "#ff5a1f", brasa700: "#c2410c"
};
export const DISPLAY = "'Bricolage Grotesque','Helvetica Neue',Helvetica,Arial,sans-serif";
const CORPO = "'Helvetica Neue',Helvetica,Arial,sans-serif";
export const MONO = "'Geist Mono','SF Mono',Menlo,Consolas,monospace";
const FONTES = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&amp;family=Geist+Mono:wght@500&amp;display=swap";
const SITE = "https://kapota.com.br";
export const BLOG = "https://kapota.com.br/blog/";
const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export const esc = (s) => String(s ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const d2 = (n) => String(n).padStart(2, "0");
// "2026-11-10" vira "ter 10/11"; data sem fuso, como está no banco
const diaCurto = (iso) => {
  if (!iso) return "";
  const [a, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  return `${DIAS[new Date(Date.UTC(a, m - 1, d)).getUTCDay()]} ${d2(d)}/${d2(m)}`;
};

/* ---------- Peças ---------- */
const mono = (cor) => `font-family:${MONO};font-size:11px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:${cor};`;
const quadrado = `<span style="display:inline-block;width:8px;height:8px;background:${C.brasa};margin-right:10px;vertical-align:1px;"></span>`;

// K na bola brasa + nome, igual ao topo do site
const marca = (claro) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td width="34" height="34" align="center" valign="middle" bgcolor="${C.brasa}" style="width:34px;height:34px;border-radius:17px;background:${C.brasa};color:${C.preto};font-family:${DISPLAY};font-weight:800;font-size:17px;line-height:34px;">K</td>
    <td valign="middle" class="${claro ? "" : "kpe-escrito"}" style="padding-left:12px;font-family:${DISPLAY};font-weight:800;font-size:19px;letter-spacing:-0.04em;color:${claro ? C.branco : C.preto};white-space:nowrap;">Klysman Kley</td>
  </tr></table>`;

// botão "à prova de bala": a célula pinta o fundo, o link ocupa a área toda
const botao = (href, texto) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td bgcolor="${C.brasa}" style="border-radius:999px;background:${C.brasa};">
      <a href="${esc(href)}" style="display:inline-block;padding:16px 28px;border-radius:999px;font-family:${CORPO};font-size:15px;font-weight:700;line-height:1;color:${C.preto};text-decoration:none;">${texto} &rarr;</a>
    </td>
  </tr></table>`;

const capa = ({ rotulo, sobrelinha, titulo, texto, extra = "" }) => `
  <tr><td class="kpe-capa" bgcolor="${C.preto}" style="background:${C.preto};border-radius:28px;padding:32px 36px 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td valign="middle">${marca(true)}</td>
      <td valign="middle" align="right" class="kpe-some" style="${mono(C.fumaca)}">${rotulo}</td>
    </tr></table>
    <p style="margin:56px 0 0;${mono(C.fumaca)}">${quadrado}${sobrelinha}</p>
    <h1 class="kpe-h1" style="margin:18px 0 0;font-family:${DISPLAY};font-weight:800;font-size:48px;line-height:0.98;letter-spacing:-0.035em;color:${C.branco};">${titulo}</h1>
    <p style="margin:20px 0 0;max-width:440px;font-family:${CORPO};font-size:16px;line-height:1.55;color:${C.fumaca};">${texto}</p>
    ${extra}
  </td></tr>`;

const rodape = (linhas) => `
  <tr><td class="kpe-lado" style="padding:56px 36px 0;">
    ${marca(false)}
    <p class="kpe-texto" style="margin:18px 0 0;font-family:${CORPO};font-size:13px;line-height:1.6;color:${C.cinza};">${linhas.texto}</p>
    <p style="margin:12px 0 0;${mono(C.cinza)}">${linhas.links}</p>
  </td></tr>`;

const linkRodape = (href, texto, sublinha) => `<a class="kpe-texto" href="${esc(href)}" style="color:${C.cinza};text-decoration:${sublinha ? "underline" : "none"};">${texto}</a>`;

/* ---------- Documento ---------- */
// Regras do tema escuro (segue o aparelho, via prefers-color-scheme) e do celular.
const ESCURO = `
  .kpe-fundo, .kpe-body { background:${C.preto} !important; }
  .kpe-capa { background:${C.carvao} !important; }
  .kpe-escrito, .kpe-titulo, .kpe-link { color:${C.branco} !important; }
  .kpe-texto { color:${C.fumaca} !important; }
  .kpe-num, .kpe-serie, .kpe-seta { color:${C.brasa} !important; }
  .kpe-item { border-color:#2b2b2b !important; }`;
const CELULAR = `
  @media (max-width: 620px) {
    .kpe-moldura { padding:8px 8px 32px !important; }
    .kpe-capa { padding:24px 22px 30px !important; border-radius:22px !important; }
    .kpe-lado { padding-left:14px !important; padding-right:14px !important; }
    .kpe-h1 { font-size:38px !important; }
    .kpe-numcol { width:34px !important; }
    .kpe-some { display:none !important; }
  }`;

function documento({ titulo, previa, corpo }) {
  // espaços invisíveis depois da prévia, pra caixa de entrada não completar com o começo do corpo
  const enchimento = "&#8199;&#65279;&#847; ".repeat(60);
  return `<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<meta name="x-apple-disable-message-reformatting">
<title>${esc(titulo)}</title>
<link href="${FONTES}" rel="stylesheet">
<style>
body { margin:0; padding:0; }
a { text-decoration:none; }
@media (prefers-color-scheme: dark) {${ESCURO}
  }
${CELULAR}
</style>
</head>
<body class="kpe-body" style="margin:0;padding:0;background:${C.papel};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${esc(previa)}${enchimento}</div>
<table role="presentation" class="kpe-fundo" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.papel}" style="background:${C.papel};">
<tr><td class="kpe-moldura" align="center" style="padding:24px 12px 48px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
    ${corpo}
    <tr><td style="height:24px;line-height:24px;font-size:0;">&nbsp;</td></tr>
  </table>
</td></tr>
</table>
</body></html>`;
}

/* ---------- Resumo da semana ---------- */
function assuntoResumo(posts) {
  return posts.length === 1 ? "Resumo da semana: 1 artigo novo" : `Resumo da semana: ${posts.length} artigos novos`;
}

function item(post, i) {
  const url = esc(post.url);
  const quando = diaCurto(post.date_iso);
  return `
    <tr><td class="kpe-item" style="padding:28px 0;border-top:1px solid ${C.linha};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td class="kpe-numcol" width="48" valign="top" style="width:48px;padding-top:1px;">
          <span class="kpe-num" style="font-family:${MONO};font-size:13px;font-weight:500;color:${C.brasa700};">${d2(i + 1)}</span>
        </td>
        <td valign="top">
          <p style="margin:0;${mono(C.cinza)}"><span class="kpe-serie" style="color:${C.brasa700};">${esc(post.category || "Leitura de Mercado")}</span>${quando ? `<span class="kpe-texto" style="color:${C.cinza};">&nbsp;&nbsp;·&nbsp;&nbsp;${quando}</span>` : ""}</p>
          <h2 style="margin:10px 0 0;font-family:${DISPLAY};font-weight:700;font-size:22px;line-height:1.16;letter-spacing:-0.02em;">
            <a class="kpe-titulo" href="${url}" style="color:${C.preto};text-decoration:none;">${esc(post.title)}</a>
          </h2>
          ${post.excerpt ? `<p class="kpe-texto" style="margin:10px 0 0;font-family:${CORPO};font-size:15px;line-height:1.55;color:${C.cinza};">${esc(post.excerpt)}</p>` : ""}
          <p style="margin:14px 0 0;"><a class="kpe-link" href="${url}" style="font-family:${CORPO};font-size:14px;font-weight:700;color:${C.preto};text-decoration:none;">Ler artigo <span class="kpe-seta" style="color:${C.brasa700};">&rarr;</span></a></p>
        </td>
      </tr></table>
    </td></tr>`;
}

export function resumo({ posts, periodo, descadastrar }) {
  const n = posts.length;
  const titulo = n === 1
    ? `<span style="color:${C.brasa};">1 artigo</span><br>novo na semana.`
    : `<span style="color:${C.brasa};">${n} artigos</span><br>novos na semana.`;
  const previa = n === 1 ? posts[0].title : `${posts[0].title} e mais ${n - 1}.`;
  const corpo = `
    ${capa({
      rotulo: "Resumo da semana",
      sobrelinha: esc(periodo),
      titulo,
      texto: "Separei aqui o que saiu na Leitura de Mercado de segunda a domingo, sem enrolação."
    })}
    <tr><td class="kpe-lado" style="padding:36px 36px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${posts.map(item).join("")}
        <tr><td class="kpe-item" style="padding:32px 0 0;border-top:1px solid ${C.linha};">${botao(BLOG, "Ver todos os artigos")}</td></tr>
      </table>
    </td></tr>
    ${rodape({
      texto: "Você recebe este resumo porque assinou a newsletter em kapota.com.br. Ele chega toda segunda, às 8h, e só sai quando tem artigo novo.",
      links: `${linkRodape(descadastrar, "Descadastrar", true)}&nbsp;&nbsp;·&nbsp;&nbsp;${linkRodape(SITE, "kapota.com.br")}`
    })}`;
  return { assunto: assuntoResumo(posts), previa, html: documento({ titulo: assuntoResumo(posts), previa, corpo }) };
}

/* ---------- Confirmação de inscrição ---------- */
export function confirmacao({ confirmar }) {
  const assunto = "Confirma sua inscrição na Leitura de Mercado";
  const corpo = `
    ${capa({
      rotulo: "Newsletter",
      sobrelinha: "Leitura de Mercado",
      titulo: `Falta só<br><span style="color:${C.brasa};">um clique.</span>`,
      texto: "Confirma que quer receber o resumo da semana. Ele chega toda segunda, às 8h, com o que saiu no blog.",
      extra: `<div style="margin-top:32px;">${botao(confirmar, "Confirmar inscrição")}</div>`
    })}
    ${rodape({
      texto: "Se você não pediu isso, é só ignorar este email. Sem a confirmação, você não recebe nada.",
      links: linkRodape(SITE, "kapota.com.br")
    })}`;
  const previa = "Confirma e o resumo da semana começa a chegar toda segunda, às 8h.";
  return { assunto, previa, html: documento({ titulo: assunto, previa, corpo }) };
}

