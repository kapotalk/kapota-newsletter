import { env } from "cloudflare:test";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cadastrar, acesso, evento, visita, normalizaWhatsapp, ErroCadastro, CONSENTIMENTO } from "../src/materiais.js";
import { getSubscriberByEmail } from "../src/db.js";
import { Materiais } from "../src/index.js";
import { applyMigrations } from "./helpers/migrate.js";

beforeAll(async () => {
  await applyMigrations(env);
});

let enviados;
beforeEach(() => {
  enviados = [];
  vi.stubGlobal("fetch", vi.fn(async (url, init) => {
    enviados.push({ url: String(url), body: init?.body });
    return new Response(JSON.stringify({ id: "mock" }), { status: 200 });
  }));
});
afterEach(() => vi.unstubAllGlobals());

let n = 0;
const ip = () => `198.51.100.${++n}`;
const BASE = { nome: "Ana Souza", whatsapp: "(83) 99876-5432", material: "direito-autoral-conexo", titulo: "Direito Autoral x Direito Conexo" };
const lead = (email) => env.DB.prepare("SELECT * FROM material_leads WHERE email = ?").bind(email).first();

describe("normalizaWhatsapp", () => {
  it("aceita os formatos comuns e guarda com 55", () => {
    expect(normalizaWhatsapp("(83) 99876-5432")).toBe("5583998765432");
    expect(normalizaWhatsapp("+55 83 99876 5432")).toBe("5583998765432");
    expect(normalizaWhatsapp("083998765432")).toBe("5583998765432");
    expect(normalizaWhatsapp("83 3333-4444")).toBe("558333334444");
  });
  it("recusa número sem DDD, curto ou estrangeiro", () => {
    expect(normalizaWhatsapp("99876-5432")).toBeNull();
    expect(normalizaWhatsapp("123")).toBeNull();
    expect(normalizaWhatsapp("+1 415 555 0100")).toBeNull();
    expect(normalizaWhatsapp("(83) 89876-5432")).toBeNull();
    expect(normalizaWhatsapp("")).toBeNull();
  });
});

describe("cadastrar", () => {
  it("guarda a pessoa, libera o aparelho e não mexe na newsletter sem a caixa marcada", async () => {
    const r = await cadastrar(env, { ...BASE, email: "  Ana@Example.com " }, { ip: ip(), segundos: 9 });
    expect(r.token).toMatch(/^[0-9a-f]{64}$/);
    expect(r.newsletter).toBeNull();
    const l = await lead("ana@example.com");
    expect(l).toMatchObject({ nome: "Ana Souza", whatsapp: "5583998765432", material: "direito-autoral-conexo", newsletter: 0, consentimento: CONSENTIMENTO });
    expect(await acesso(env, r.token)).toMatchObject({ id: l.id, nome: "Ana Souza" });
    expect(await getSubscriberByEmail(env.DB, "ana@example.com")).toBeNull();
    expect(enviados).toHaveLength(0);
    const m = await env.DB.prepare("SELECT * FROM materiais WHERE slug = ?").bind("direito-autoral-conexo").first();
    expect(m.titulo).toBe("Direito Autoral x Direito Conexo");
  });

  it("mesmo email em outro aparelho reaproveita a pessoa e mantém o primeiro material", async () => {
    const a = await cadastrar(env, { ...BASE, email: "beto@example.com" }, { ip: ip() });
    const b = await cadastrar(env, { ...BASE, email: "beto@example.com", nome: "Beto Lima", material: "erros-metadata-lancamento" }, { ip: ip() });
    expect(b.token).not.toBe(a.token);
    const l = await lead("beto@example.com");
    expect(l).toMatchObject({ nome: "Beto Lima", material: "direito-autoral-conexo" });
    expect((await acesso(env, a.token)).id).toBe(l.id);
    expect((await acesso(env, b.token)).id).toBe(l.id);
  });

  it("caixa da newsletter marcada inscreve como pendente e manda a confirmação", async () => {
    const r = await cadastrar(env, { ...BASE, email: "news@example.com", newsletter: true }, { ip: ip(), workerOrigin: "https://worker.example" });
    expect(r.newsletter).toBe("pending");
    expect((await lead("news@example.com")).newsletter).toBe(1);
    expect((await getSubscriberByEmail(env.DB, "news@example.com")).status).toBe("pending");
    expect(enviados.some((e) => e.url.includes("api.resend.com") && e.body.includes("worker.example/confirm"))).toBe(true);
  });

  it("falha no email da newsletter não impede de liberar o material", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("erro", { status: 500 })));
    const r = await cadastrar(env, { ...BASE, email: "falha@example.com", newsletter: true }, { ip: ip() });
    expect(r.token).toMatch(/^[0-9a-f]{64}$/);
    expect(r.newsletter).toBe("falhou");
  });

  it("campo escondido preenchido não guarda nada nem libera", async () => {
    const r = await cadastrar(env, { ...BASE, email: "robo@example.com", site: "http://spam" }, { ip: ip() });
    expect(r).toEqual({ token: null });
    expect(await lead("robo@example.com")).toBeNull();
  });

  it("envio rápido demais pede pra mandar de novo", async () => {
    await expect(cadastrar(env, { ...BASE, email: "rapido@example.com" }, { ip: ip(), segundos: 1 })).rejects.toThrow(ErroCadastro);
    expect(await lead("rapido@example.com")).toBeNull();
  });

  it("recusa nome, email ou WhatsApp inválidos", async () => {
    await expect(cadastrar(env, { ...BASE, email: "x@example.com", nome: "A" }, { ip: ip() })).rejects.toThrow(/nome/);
    await expect(cadastrar(env, { ...BASE, email: "nao-e-email" }, { ip: ip() })).rejects.toThrow(/email/);
    await expect(cadastrar(env, { ...BASE, email: "y@example.com", whatsapp: "9999" }, { ip: ip() })).rejects.toThrow(/WhatsApp/);
    await expect(cadastrar(env, { ...BASE, email: "z@example.com", material: "../etc" }, { ip: ip() })).rejects.toThrow(/Material/);
  });

  it("limita a 10 cadastros por hora por conexão", async () => {
    const mesmo = ip();
    for (let i = 0; i < 10; i++) await cadastrar(env, { ...BASE, email: `lote${i}@example.com` }, { ip: mesmo });
    const erro = await cadastrar(env, { ...BASE, email: "lote10@example.com" }, { ip: mesmo }).catch((e) => e);
    expect(erro).toBeInstanceOf(ErroCadastro);
    expect(erro.status).toBe(429);
  });
});

describe("acesso, evento e visita", () => {
  it("token desconhecido ou fora do formato não libera", async () => {
    expect(await acesso(env, "a".repeat(64))).toBeNull();
    expect(await acesso(env, "curto")).toBeNull();
    expect(await acesso(env, undefined)).toBeNull();
  });

  it("conta abriu e fim uma vez por pessoa e material", async () => {
    const { token } = await cadastrar(env, { ...BASE, email: "leitora@example.com" }, { ip: ip() });
    const dados = { material: "caminho-dinheiro-streaming", titulo: "O caminho do dinheiro no streaming" };
    expect(await evento(env, token, { ...dados, tipo: "abriu" })).toEqual({ ok: true });
    await evento(env, token, { ...dados, tipo: "abriu" });
    await evento(env, token, { ...dados, tipo: "fim" });
    const { results } = await env.DB.prepare(
      "SELECT tipo FROM material_eventos e JOIN material_leads l ON l.id = e.lead_id WHERE l.email = ? ORDER BY tipo"
    ).bind("leitora@example.com").all();
    expect(results.map((r) => r.tipo)).toEqual(["abriu", "fim"]);
    expect(await evento(env, "b".repeat(64), { ...dados, tipo: "abriu" })).toEqual({ ok: false });
    expect(await evento(env, token, { ...dados, tipo: "outro" })).toEqual({ ok: false });
  });

  it("visita soma na tela de cadastro do material", async () => {
    await visita(env, "selo-distribuidora-agencia", "Sete papéis, sete funções diferentes");
    await visita(env, "selo-distribuidora-agencia", "Sete papéis, sete funções diferentes");
    const m = await env.DB.prepare("SELECT * FROM materiais WHERE slug = ?").bind("selo-distribuidora-agencia").first();
    expect(m).toMatchObject({ visitas: 2, titulo: "Sete papéis, sete funções diferentes" });
    expect(await visita(env, "../nada", "x")).toEqual({ ok: false });
  });
});

describe("entrypoint Materiais", () => {
  it("devolve o erro de validação em vez de lançar", async () => {
    // o runtime de teste não deixa construir WorkerEntrypoint; chama os métodos com o env
    const m = { env };
    const chama = (metodo, ...args) => Materiais.prototype[metodo].call(m, ...args);
    expect(await chama("cadastrar", { ...BASE, email: "ruim" }, { ip: ip() })).toEqual({ erro: "Confere o email.", status: 400 });
    const ok = await chama("cadastrar", { ...BASE, email: "rpc@example.com" }, { ip: ip(), segundos: 5 });
    expect(ok.token).toMatch(/^[0-9a-f]{64}$/);
    expect((await chama("acesso", ok.token)).nome).toBe("Ana Souza");
  });
});
