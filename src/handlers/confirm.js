import { confirmByToken } from "../db.js";
import { pageResponse } from "../page.js";

export async function handleConfirm(request, env) {
  const token = new URL(request.url).searchParams.get("token");
  const ok = token ? await confirmByToken(env.DB, token, new Date().toISOString()) : false;
  if (!ok) {
    return pageResponse({
      titulo: "Link inválido.",
      texto: "Esse link já foi usado ou expirou. Se quiser, assina de novo pelo site.",
      status: 400,
    });
  }
  return pageResponse({
    titulo: "Inscrição confirmada.",
    texto: "Toda segunda, às 8h, o resumo da semana chega no seu email.",
  });
}
