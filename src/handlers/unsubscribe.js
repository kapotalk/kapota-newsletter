import { unsubscribeByToken } from "../db.js";
import { pageResponse } from "../page.js";

export async function handleUnsubscribe(request, env) {
  const token = new URL(request.url).searchParams.get("token");
  const ok = token ? await unsubscribeByToken(env.DB, token) : false;
  if (!ok) return pageResponse({ titulo: "Link inválido.", texto: "Não achei essa inscrição.", status: 400 });
  return pageResponse({
    titulo: "Pronto, você saiu.",
    texto: "Não vai mais receber o resumo da semana. Sem ressentimentos.",
  });
}
