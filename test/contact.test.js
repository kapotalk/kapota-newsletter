import { env, SELF } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { listContacts } from "../src/db.js";
import { applyMigrations } from "./helpers/migrate.js";

beforeAll(async () => {
  await applyMigrations(env);
});

let n = 0;
const nextIp = () => `203.0.113.${++n}`;

const VALID = { nome: "Ana", email: "ana@example.com", assunto: "Parceria", mensagem: "Oi, tudo bem?", site: "" };

function post(body, ip = nextIp()) {
  return SELF.fetch("https://worker.example/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json", "CF-Connecting-IP": ip },
    body: JSON.stringify(body),
  });
}

describe("POST /contact", () => {
  it("guarda a mensagem e responde ok", async () => {
    const res = await post({ ...VALID, nome: "  Ana  ", email: "sucesso@example.com" });
    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://kapota.com.br");
    expect(await res.json()).toEqual({ status: "ok" });
    const row = (await listContacts(env.DB)).find((r) => r.email === "sucesso@example.com");
    expect(row).toMatchObject({ nome: "Ana", assunto: "Parceria", mensagem: "Oi, tudo bem?", status: "nova" });
    expect(row.created_at).toBeTruthy();
  });

  it("honeypot preenchido responde ok e não guarda nada", async () => {
    const res = await post({ ...VALID, email: "bot@example.com", site: "http://spam" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
    expect((await listContacts(env.DB)).some((r) => r.email === "bot@example.com")).toBe(false);
  });

  it("email inválido responde 400", async () => {
    const res = await post({ ...VALID, email: "nao-e-email" });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBeTruthy();
  });

  it("mensagem longa demais responde 400", async () => {
    const res = await post({ ...VALID, email: "longa@example.com", mensagem: "a".repeat(5001) });
    expect(res.status).toBe(400);
    expect((await listContacts(env.DB)).some((r) => r.email === "longa@example.com")).toBe(false);
  });

  it("campos vazios respondem 400", async () => {
    expect((await post({ ...VALID, nome: "   " })).status).toBe(400);
    expect((await post({ ...VALID, assunto: "" })).status).toBe(400);
    expect((await post({ ...VALID, assunto: "a".repeat(81) })).status).toBe(400);
  });

  it("limita a 5 por hora por IP e responde 429", async () => {
    const ip = nextIp();
    for (let i = 0; i < 5; i++) {
      expect((await post({ ...VALID, email: `rl${i}@example.com` }, ip)).status).toBe(200);
    }
    const res = await post({ ...VALID, email: "rl6@example.com" }, ip);
    expect(res.status).toBe(429);
    expect((await listContacts(env.DB)).some((r) => r.email === "rl6@example.com")).toBe(false);
  });

  it("o limite do contato não consome o do subscribe", async () => {
    const ip = nextIp();
    for (let i = 0; i < 5; i++) await post({ ...VALID, email: `sep${i}@example.com` }, ip);
    const res = await SELF.fetch("https://worker.example/subscribe", {
      method: "OPTIONS",
      headers: { "CF-Connecting-IP": ip },
    });
    expect(res.status).toBe(200);
  });

  it("responde o preflight OPTIONS com CORS", async () => {
    const res = await SELF.fetch("https://worker.example/contact", { method: "OPTIONS" });
    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://kapota.com.br");
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("POST");
    expect(res.headers.get("Access-Control-Allow-Headers")).toContain("Content-Type");
  });
});
