import { countRecentAttempts, recordAttempt, insertContact } from "../db.js";

const ALLOWED_ORIGIN = "https://kapota.com.br";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": ALLOWED_ORIGIN },
  });
}

const str = (v) => (typeof v === "string" ? v.trim() : "");

export async function handleContact(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }
  if (request.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const payload = await request.json().catch(() => ({}));
  const body = payload && typeof payload === "object" ? payload : {};

  // Honeypot: bot preenche, responde ok sem guardar nada.
  if (typeof body.site === "string" && body.site.length > 0) return json({ status: "ok" });

  const now = new Date().toISOString();
  const ip = `contact:${request.headers.get("CF-Connecting-IP") ?? "unknown"}`;
  const oneHourAgo = new Date(Date.parse(now) - 60 * 60 * 1000).toISOString();
  if ((await countRecentAttempts(env.DB, ip, oneHourAgo)) >= 5) {
    return json({ error: "Muitas tentativas. Tenta de novo mais tarde." }, 429);
  }

  const nome = str(body.nome);
  const email = str(body.email);
  const assunto = str(body.assunto);
  const mensagem = str(body.mensagem);

  if (nome.length < 1 || nome.length > 120) return json({ error: "Nome precisa ter de 1 a 120 caracteres." }, 400);
  if (!EMAIL_RE.test(email) || email.length > 200) return json({ error: "Email inválido." }, 400);
  if (assunto.length < 1 || assunto.length > 80) return json({ error: "Assunto precisa ter de 1 a 80 caracteres." }, 400);
  if (mensagem.length < 1 || mensagem.length > 5000) return json({ error: "Mensagem precisa ter de 1 a 5000 caracteres." }, 400);

  await insertContact(env.DB, { nome, email, assunto, mensagem }, now);
  await recordAttempt(env.DB, ip, now);
  return json({ status: "ok" });
}
