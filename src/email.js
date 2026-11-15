import { resumo, confirmacao } from "./templates.js";

const FROM = "Klysman Kley <novidades@kapota.com.br>";

async function sendEmail(env, { to, subject, html }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend falhou (${res.status}): ${body}`);
  }
  return res.json();
}

const SERIES = {
  "Radar de Notícias": "Se Atualize",
  "Leitura Estratégica": "Se Atualize",
  "Radar da Semana": "Resumo da Semana",
  "Modelo Mental": "Nota Mental",
  "Frase Comentada": "Pensa Nisso",
};

// Mapeia nome antigo de série pro novo, preservando sufixo " #N".
export function renameCategory(category) {
  if (typeof category !== "string") return category;
  const m = category.trim().match(/^(.*?)(\s+#\d+)?$/);
  const base = m[1];
  return SERIES[base] ? SERIES[base] + (m[2] ?? "") : category;
}

export async function sendConfirmationEmail(env, email, confirmUrl) {
  const { assunto, html } = confirmacao({ confirmar: confirmUrl });
  return sendEmail(env, { to: email, subject: assunto, html });
}

export async function sendWeeklyDigest(env, email, unsubscribeUrl, posts, weekLabel) {
  const mapped = posts.map((p) => ({ ...p, category: renameCategory(p.category) }));
  const { assunto, html } = resumo({ posts: mapped, periodo: weekLabel, descadastrar: unsubscribeUrl });
  return sendEmail(env, { to: email, subject: assunto, html });
}
