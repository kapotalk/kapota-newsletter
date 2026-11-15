// Cadastro pra liberar os materiais de conteudos.kapota.com.br. Quem chama é o Worker
// kapota-conteudos, pelo service binding (entrypoint Materiais em index.js); não tem rota
// pública. Tabelas na migração 0006.
import { countRecentAttempts, recordAttempt } from "./db.js";
import { inscrever } from "./inscricao.js";

// Versão do texto de consentimento mostrado na tela (texto completo no README do DS do kapota).
export const CONSENTIMENTO = "lgpd-v1-2026-11-15";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_RE = /^[a-z0-9-]{1,80}$/;
const LIMITE_POR_HORA = 10;
const SEGUNDOS_MINIMOS = 2;

export class ErroCadastro extends Error {
  constructor(mensagem, status = 400) {
    super(mensagem);
    this.status = status;
  }
}

const texto = (v) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "");

// Celular ou fixo do Brasil, com ou sem 55 e DDD; guarda só dígitos, sempre com 55.
export function normalizaWhatsapp(valor) {
  let d = String(valor ?? "").replace(/\D/g, "").replace(/^0+/, "");
  if (d.length === 12 || d.length === 13) {
    if (!d.startsWith("55")) return null;
    d = d.slice(2);
  }
  if (d.length !== 10 && d.length !== 11) return null;
  if (!/^[1-9][1-9]/.test(d)) return null; // DDD de 11 a 99
  if (d.length === 11 && d[2] !== "9") return null; // celular com 9 dígitos começa com 9
  return `55${d}`;
}

export function validaCadastro(dados) {
  const nome = texto(dados?.nome);
  const email = texto(dados?.email).toLowerCase();
  const whatsapp = normalizaWhatsapp(dados?.whatsapp);
  const material = texto(dados?.material);
  const titulo = texto(dados?.titulo).slice(0, 160) || material;
  if (nome.length < 2 || nome.length > 80) throw new ErroCadastro("Escreve seu nome, com pelo menos 2 letras.");
  if (!EMAIL_RE.test(email) || email.length > 200) throw new ErroCadastro("Confere o email.");
  if (!whatsapp) throw new ErroCadastro("Confere o WhatsApp, com DDD.");
  if (!SLUG_RE.test(material)) throw new ErroCadastro("Material não encontrado.");
  return { nome, email, whatsapp, material, titulo, newsletter: dados?.newsletter === true };
}

async function hash(token) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
const novoToken = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, "0")).join("");

async function guardaTitulo(db, material, titulo, now) {
  await db
    .prepare(
      `INSERT INTO materiais (slug, titulo, visitas, atualizado_em) VALUES (?, ?, 0, ?)
       ON CONFLICT(slug) DO UPDATE SET titulo = excluded.titulo, atualizado_em = excluded.atualizado_em`
    )
    .bind(material, titulo, now)
    .run();
}

// Cadastra (ou reaproveita, pelo email) e libera o aparelho. Devolve { token } pro cookie,
// ou { token: null } quando o pedido parece de robô (nada é guardado).
export async function cadastrar(env, dados, { ip = "unknown", segundos = null, workerOrigin, now = new Date().toISOString() } = {}) {
  if (texto(dados?.site)) return { token: null }; // campo escondido: só robô preenche
  if (typeof segundos === "number" && segundos < SEGUNDOS_MINIMOS) {
    throw new ErroCadastro("Calma, confere os dados e manda de novo.");
  }
  const chave = `material:${ip}`;
  const umaHoraAtras = new Date(Date.parse(now) - 60 * 60 * 1000).toISOString();
  if ((await countRecentAttempts(env.DB, chave, umaHoraAtras)) >= LIMITE_POR_HORA) {
    throw new ErroCadastro("Muitas tentativas por aqui. Tenta de novo mais tarde.", 429);
  }
  const c = validaCadastro(dados);
  await recordAttempt(env.DB, chave, now);

  const lead = await env.DB
    .prepare(
      `INSERT INTO material_leads (nome, email, whatsapp, material, newsletter, consentimento, created_at, atualizado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET
         nome = excluded.nome,
         whatsapp = excluded.whatsapp,
         newsletter = MAX(material_leads.newsletter, excluded.newsletter),
         consentimento = excluded.consentimento,
         atualizado_em = excluded.atualizado_em
       RETURNING id`
    )
    .bind(c.nome, c.email, c.whatsapp, c.material, c.newsletter ? 1 : 0, CONSENTIMENTO, now, now)
    .first();

  const token = novoToken();
  await env.DB
    .prepare("INSERT INTO material_acessos (token_hash, lead_id, created_at) VALUES (?, ?, ?)")
    .bind(await hash(token), lead.id, now)
    .run();
  await guardaTitulo(env.DB, c.material, c.titulo, now);

  let newsletter = null;
  if (c.newsletter) {
    try {
      newsletter = (await inscrever(env, c.email, workerOrigin || env.WORKER_URL, now)).status;
    } catch (e) {
      // o material libera mesmo assim; a pessoa pode assinar de novo pelo site
      console.error("Inscrição na newsletter pelo material falhou", e);
      newsletter = "falhou";
    }
  }
  return { token, newsletter };
}

// Aparelho liberado? Devolve { id, nome } ou null.
export async function acesso(env, token) {
  if (typeof token !== "string" || !/^[0-9a-f]{64}$/.test(token)) return null;
  return env.DB
    .prepare(
      `SELECT l.id, l.nome FROM material_acessos a JOIN material_leads l ON l.id = a.lead_id
       WHERE a.token_hash = ?`
    )
    .bind(await hash(token))
    .first();
}

// Abriu o material ou chegou na última tela. Conta uma vez por pessoa e material.
export async function evento(env, token, dados, now = new Date().toISOString()) {
  const tipo = dados?.tipo;
  const material = texto(dados?.material);
  if ((tipo !== "abriu" && tipo !== "fim") || !SLUG_RE.test(material)) return { ok: false };
  const quem = await acesso(env, token);
  if (!quem) return { ok: false };
  await guardaTitulo(env.DB, material, texto(dados?.titulo).slice(0, 160) || material, now);
  await env.DB
    .prepare("INSERT OR IGNORE INTO material_eventos (lead_id, material, tipo, created_at) VALUES (?, ?, ?, ?)")
    .bind(quem.id, material, tipo, now)
    .run();
  return { ok: true };
}

// Alguém viu a tela de cadastro (contagem simples, sem identificar).
export async function visita(env, material, titulo, now = new Date().toISOString()) {
  const slug = texto(material);
  if (!SLUG_RE.test(slug)) return { ok: false };
  await env.DB
    .prepare(
      `INSERT INTO materiais (slug, titulo, visitas, atualizado_em) VALUES (?, ?, 1, ?)
       ON CONFLICT(slug) DO UPDATE SET visitas = materiais.visitas + 1, atualizado_em = excluded.atualizado_em`
    )
    .bind(slug, texto(titulo).slice(0, 160) || slug, now)
    .run();
  return { ok: true };
}
