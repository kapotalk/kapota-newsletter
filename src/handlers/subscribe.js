import { countRecentAttempts, recordAttempt } from "../db.js";
import { inscrever } from "../inscricao.js";

const ALLOWED_ORIGIN = "https://kapota.com.br";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": ALLOWED_ORIGIN },
  });
}

export async function handleSubscribe(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const now = new Date().toISOString();
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const oneHourAgo = new Date(Date.parse(now) - 60 * 60 * 1000).toISOString();
  const recentAttempts = await countRecentAttempts(env.DB, ip, oneHourAgo);
  if (recentAttempts >= 5) {
    return json({ error: "Muitas tentativas. Tenta de novo mais tarde." }, 429);
  }

  const payload = await request.json().catch(() => ({}));
  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  if (!EMAIL_RE.test(email)) {
    return json({ error: "Email inválido" }, 400);
  }

  const workerOrigin = new URL(request.url).origin;
  let result;
  try {
    result = await inscrever(env, email, workerOrigin, now);
  } catch {
    await recordAttempt(env.DB, ip, now);
    return json({ error: "Não foi possível enviar o email de confirmação, tenta de novo em um instante." }, 503);
  }
  await recordAttempt(env.DB, ip, now);
  return json(result);
}
