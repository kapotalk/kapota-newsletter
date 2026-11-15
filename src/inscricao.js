import { getSubscriberByEmail, insertPendingSubscriber, reopenAsPending } from "./db.js";
import { sendConfirmationEmail } from "./email.js";
import { generateToken } from "./tokens.js";

// Coloca o email na newsletter como pendente e manda a confirmação (fluxo de sempre).
// Devolve { status: "pending" | "already-confirmed" }; lança se o email de confirmação falhar.
// Quem chama cuida do limite por IP e da validação do email.
export async function inscrever(env, email, workerOrigin, now = new Date().toISOString()) {
  const existing = await getSubscriberByEmail(env.DB, email);
  if (existing?.status === "confirmed") return { status: "already-confirmed" };

  let confirmToken;
  if (!existing) {
    confirmToken = generateToken();
    await insertPendingSubscriber(env.DB, email, confirmToken, generateToken(), now);
  } else if (existing.status === "pending") {
    confirmToken = existing.confirm_token;
  } else {
    confirmToken = generateToken();
    await reopenAsPending(env.DB, email, confirmToken, now);
  }
  await sendConfirmationEmail(env, email, `${workerOrigin}/confirm?token=${confirmToken}`);
  return { status: "pending" };
}
