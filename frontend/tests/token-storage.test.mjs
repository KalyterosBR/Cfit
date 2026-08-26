import assert from "node:assert/strict";
import test from "node:test";

class MemoryStorage {
  #values = new Map();

  getItem(key) { return this.#values.get(key) ?? null; }
  setItem(key, value) { this.#values.set(key, String(value)); }
  removeItem(key) { this.#values.delete(key); }
  clear() { this.#values.clear(); }
}

globalThis.localStorage = new MemoryStorage();
globalThis.sessionStorage = new MemoryStorage();

const { clearTokens, getAccessToken, getRefreshToken, saveTokens } = await import("../src/features/auth/services/token.service.ts");

test("manter conectado salva a sessão persistente", () => {
  clearTokens();
  saveTokens("access-local", "refresh-local", true);

  assert.equal(localStorage.getItem("cfit_access_token"), "access-local");
  assert.equal(localStorage.getItem("cfit_keep_connected"), "true");
  assert.equal(sessionStorage.getItem("cfit_access_token"), null);
});

test("renovação preserva localStorage mesmo com access residual na sessão", () => {
  clearTokens();
  saveTokens("access-local", "refresh-local", true);
  sessionStorage.setItem("cfit_access_token", "access-residual");

  saveTokens("access-renovado", "refresh-renovado");

  assert.equal(getAccessToken(), "access-renovado");
  assert.equal(getRefreshToken(), "refresh-renovado");
  assert.equal(localStorage.getItem("cfit_access_token"), "access-renovado");
  assert.equal(sessionStorage.getItem("cfit_access_token"), null);
});

test("sessão temporária continua restrita ao sessionStorage", () => {
  clearTokens();
  saveTokens("access-session", "refresh-session", false);

  assert.equal(sessionStorage.getItem("cfit_access_token"), "access-session");
  assert.equal(localStorage.getItem("cfit_access_token"), null);
  assert.equal(localStorage.getItem("cfit_keep_connected"), null);
});
