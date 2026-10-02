export type Tokens = { access: string; refresh: string };
export type Profile = { email: string; name: string; role: string; must_change_password: boolean; academy: { id: string; name: string } | null; active_unit: { id: string; name: string } | null };
export class ApiError extends Error {
  constructor(public status: number, public data: Record<string, unknown>) {
    const messages = Object.values(data).flat().filter(value => typeof value === 'string');
    super(typeof data.detail === 'string' ? data.detail : messages.join(' ') || 'Não foi possível concluir a solicitação.');
  }
}
export interface SessionStorage { read(): Promise<string | null>; write(value: string): Promise<void>; clear(): Promise<void> }
export function createClient(baseUrl: string, storage: SessionStorage, request: typeof fetch = fetch) {
  let tokens: Tokens | null = null;
  let remembered = false;
  let generation = 0;
  let refreshing: Promise<void> | null = null;
  let onExpired = () => {};
  let persistence = Promise.resolve();
  const enqueue = (action: () => Promise<void>) => {
    const result = persistence.then(action);
    persistence = result.catch(() => {});
    return result;
  };
  async function send<T>(path: string, body?: unknown, access?: string): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await request(`${baseUrl}${path}`, {
        method: body === undefined ? 'GET' : 'POST', signal: controller.signal,
        headers: { 'Content-Type': 'application/json', ...(access ? { Authorization: `Bearer ${access}` } : {}) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      let data: Record<string, unknown>;
      try { data = await response.json(); } catch { throw new Error('O servidor retornou uma resposta inesperada. Tente novamente.'); }
      if (!response.ok) throw new ApiError(response.status, data);
      return data as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error instanceof Error && error.message.startsWith('O servidor')) throw error;
      throw new Error('Não foi possível conectar ao Cfit. Verifique sua conexão e tente novamente.');
    } finally { clearTimeout(timer); }
  }
  async function clear() {
    generation += 1; tokens = null; remembered = false;
    await enqueue(() => storage.clear());
  }
  async function refresh() {
    if (refreshing) return refreshing;
    const current = tokens;
    const version = generation;
    if (!current) throw new Error('Entre novamente para continuar.');
    const pending = (async () => {
      try {
        const next = await send<Tokens>('/auth/refresh/', { refresh: current.refresh });
        if (generation !== version) throw new Error('A sessão foi encerrada.');
        if (remembered) await enqueue(() => storage.write(JSON.stringify({ ...next, origin: baseUrl })));
        if (generation !== version) throw new Error('A sessão foi encerrada.');
        tokens = next;
      } catch (error) {
        if (generation === version && error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          await clear(); onExpired();
        }
        throw error;
      }
    })();
    refreshing = pending;
    try { await pending; } finally { if (refreshing === pending) refreshing = null; }
  }
  async function authenticated<T>(path: string, body?: unknown): Promise<T> {
    if (!tokens) throw new Error('Entre novamente para continuar.');
    const version = generation;
    const sentAccess = tokens.access;
    let result: T;
    try { result = await send<T>(path, body, sentAccess); }
    catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401 || version !== generation) throw error;
      if (tokens?.access === sentAccess) await refresh();
      if (!tokens || version !== generation) throw new Error('A sessão foi encerrada.');
      try { result = await send<T>(path, body, tokens.access); }
      catch (retryError) {
        if (retryError instanceof ApiError && retryError.status === 401 && version === generation) { await clear(); onExpired(); }
        throw retryError;
      }
    }
    if (version !== generation) throw new Error('A sessão foi encerrada.');
    return result;
  }
  function requireStudent(profile: Profile) {
    if (profile.role !== 'STUDENT') throw new Error('Use a conta do portal do aluno. O acesso da gestão continua no Cfit web.');
    return profile;
  }
  return {
    send, authenticated, clear,
    setOnExpired(callback: () => void) { onExpired = callback; },
    async login(credentials: { email: string; password: string; two_factor_code?: string }, keepConnected: boolean) {
      const version = generation;
      const next = await send<Tokens>('/auth/mobile/login/', credentials);
      const profile = requireStudent(await send<Profile>('/users/me/', undefined, next.access));
      if (generation !== version) throw new Error('A sessão foi encerrada.');
      await enqueue(() => keepConnected ? storage.write(JSON.stringify({ ...next, origin: baseUrl })) : storage.clear());
      if (generation !== version) throw new Error('A sessão foi encerrada.');
      tokens = next; remembered = keepConnected;
      return profile;
    },
    async restore() {
      const saved = await storage.read();
      if (!saved) return null;
      try {
        const parsed = JSON.parse(saved);
        if (parsed.origin !== baseUrl || typeof parsed.refresh !== 'string' || typeof parsed.access !== 'string') { await clear(); return null; }
        tokens = { access: parsed.access, refresh: parsed.refresh }; remembered = true;
        await refresh();
        return requireStudent(await authenticated<Profile>('/users/me/'));
      } catch (error) {
        // Do not erase a remembered session just because the device is offline.
        if (error instanceof SyntaxError || (error instanceof ApiError && [401, 403].includes(error.status))) { await clear(); return null; }
        throw error;
      }
    },
  };
}
