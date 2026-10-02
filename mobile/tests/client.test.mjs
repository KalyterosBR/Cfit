import test from 'node:test';
import assert from 'node:assert/strict';
const { createClient, ApiError } = await import(process.env.CFIT_TEST_CLIENT);
const profile = { role: 'STUDENT', name: 'Aluno', must_change_password: false };
const tokens = { access: 'access-1', refresh: 'refresh-1' };
const ok = data => new Response(JSON.stringify(data), { status: 200 });
const unauthorized = () => new Response(JSON.stringify({ detail: 'Sessão encerrada' }), { status: 401 });
function setup(request) {
  let saved = null;
  const storage = { read: async () => saved, write: async value => { saved = value; }, clear: async () => { saved = null; } };
  return { client: createClient('https://api.test/api', storage, request), read: () => saved };
}
const credentials = { email: 'aluno@example.test', password: 'secret' };
test('login uses the dedicated endpoint without captcha and remembers only when selected', async () => {
  const fixture = setup(async (url, options) => {
    if (url.endsWith('/mobile/login/')) { assert.deepEqual(JSON.parse(options.body), credentials); return ok(tokens); }
    return ok(profile);
  });
  await fixture.client.login(credentials, false);
  assert.equal(fixture.read(), null);
  await fixture.client.login(credentials, true);
  assert.equal(JSON.parse(fixture.read()).refresh, tokens.refresh);
  await fixture.client.clear(); assert.equal(fixture.read(), null);
});
test('manager account cannot establish a student session', async () => {
  const fixture = setup(async url => ok(url.endsWith('/mobile/login/') ? tokens : { role: 'ADMIN' }));
  await assert.rejects(fixture.client.login(credentials, true), /portal do aluno/);
  assert.equal(fixture.read(), null);
  await assert.rejects(fixture.client.authenticated('/users/portal/me/'), /Entre novamente/);
});
test('2FA response does not save tokens', async () => {
  const fixture = setup(async () => new Response(JSON.stringify({ two_factor_required: true, detail: 'Código enviado' }), { status: 428 }));
  await assert.rejects(fixture.client.login(credentials, true), e => e instanceof ApiError && e.status === 428);
  assert.equal(fixture.read(), null);
});
test('parallel unauthorized requests share refresh and preserve rotated credentials', async () => {
  let refreshes = 0;
  const fixture = setup(async (url, options) => {
    if (url.endsWith('/mobile/login/')) return ok(tokens);
    if (url.endsWith('/users/me/')) return ok(profile);
    if (url.endsWith('/auth/refresh/')) { refreshes++; await new Promise(resolve => setTimeout(resolve, 5)); return ok({ access: 'access-2', refresh: 'refresh-2' }); }
    return options.headers.Authorization === 'Bearer access-1' ? unauthorized() : ok({ workouts: [] });
  });
  await fixture.client.login(credentials, true);
  await Promise.all([fixture.client.authenticated('/portal'), fixture.client.authenticated('/portal')]);
  assert.equal(refreshes, 1); assert.equal(JSON.parse(fixture.read()).refresh, 'refresh-2');
});
test('logout during refresh never restores a session', async () => {
  let finish;
  let started;
  const refreshStarted = new Promise(resolve => { started = resolve; });
  const fixture = setup(async url => {
    if (url.endsWith('/mobile/login/')) return ok(tokens);
    if (url.endsWith('/users/me/')) return ok(profile);
    if (url.endsWith('/auth/refresh/')) { started(); return new Promise(resolve => { finish = () => resolve(ok({ access: 'new', refresh: 'new' })); }); }
    return unauthorized();
  });
  await fixture.client.login(credentials, true);
  const pending = fixture.client.authenticated('/portal');
  const rejected = assert.rejects(pending, /sessão foi encerrada/);
  await refreshStarted; await fixture.client.clear(); finish(); await rejected;
  assert.equal(fixture.read(), null);
});
test('revoked refresh clears storage and notifies the UI', async () => {
  const fixture = setup(async url => url.endsWith('/mobile/login/') ? ok(tokens) : url.endsWith('/users/me/') ? ok(profile) : unauthorized());
  let expired = false; fixture.client.setOnExpired(() => { expired = true; });
  await fixture.client.login(credentials, true);
  await assert.rejects(fixture.client.authenticated('/portal'), ApiError);
  assert.equal(expired, true); assert.equal(fixture.read(), null);
});
test('offline restoration keeps saved tokens for retry', async () => {
  let offline = false;
  const fixture = setup(async url => { if (offline) throw new TypeError('Network request failed'); return ok(url.endsWith('/mobile/login/') ? tokens : profile); });
  await fixture.client.login(credentials, true); offline = true;
  await assert.rejects(fixture.client.restore(), /conectar/);
  assert.ok(fixture.read());
});
test('late unauthorized response does not rotate an already renewed session again', async () => {
  let calls = 0;
  let refreshes = 0;
  const fixture = setup(async (url, options) => {
    if (url.endsWith('/mobile/login/')) return ok(tokens);
    if (url.endsWith('/users/me/')) return ok(profile);
    if (url.endsWith('/auth/refresh/')) { refreshes++; return ok({ access: 'access-2', refresh: 'refresh-2' }); }
    if (options.headers.Authorization === 'Bearer access-1') { if (++calls === 2) await new Promise(resolve => setTimeout(resolve, 20)); return unauthorized(); }
    return ok({});
  });
  await fixture.client.login(credentials, true);
  await Promise.all([fixture.client.authenticated('/portal'), fixture.client.authenticated('/portal')]);
  assert.equal(refreshes, 1);
});
test('remembered session restores by rotating refresh and validating the student profile', async () => {
  const seen = [];
  let saved = JSON.stringify({ ...tokens, origin: 'https://api.test/api' });
  const client = createClient('https://api.test/api', { read: async () => saved, write: async value => { saved = value; }, clear: async () => { saved = null; } }, async url => {
    seen.push(url); return ok(url.endsWith('/refresh/') ? { access: 'access-2', refresh: 'refresh-2' } : profile);
  });
  assert.deepEqual(await client.restore(), profile);
  assert.deepEqual(seen, ['https://api.test/api/auth/refresh/', 'https://api.test/api/users/me/']);
  assert.equal(JSON.parse(saved).refresh, 'refresh-2');
});
test('corrupt or foreign saved session is discarded without a network call', async () => {
  for (const value of ['invalid-json', JSON.stringify({ ...tokens, origin: 'https://another.test/api' })]) {
    let cleared = false;
    const client = createClient('https://api.test/api', { read: async () => value, write: async () => {}, clear: async () => { cleared = true; } }, async () => { assert.fail('No network request expected'); });
    assert.equal(await client.restore(), null); assert.equal(cleared, true);
  }
});
