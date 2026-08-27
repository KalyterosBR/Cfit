import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const routes = read("../src/routes/index.tsx");
const home = read("../src/pages/Home.tsx");
const header = read("../src/features/auth/components/HomeHeader.tsx");
const system = read("../src/features/auth/components/HomeSystem.tsx");
const login = read("../src/features/auth/components/LoginForm.tsx");
const html = read("../index.html");
const footer = read("../src/features/auth/components/HomeFooter.tsx");
const seo = read("../src/services/seo.ts");
const vite = read("../vite.config.ts");
const vercel = read("../vercel.json");
const asyncState = read("../src/components/AsyncState.tsx");

test("homepage e autenticação usam rotas separadas", () => {
    assert.match(routes, /path="\/"[\s\S]*element={<Suspense[\s\S]*<Home \/>/);
    assert.match(routes, /path="\/login"[\s\S]*<Login \/>/);
    assert.doesNotMatch(home, /LoginForm/);
    assert.match(header, /to="\/login"/);
});

test("rotas públicas e autenticadas usam fallbacks próprios", () => {
    assert.match(routes, /fallback={<PublicRouteFallback \/>}/);
    assert.match(routes, /fallback={<LoginRouteFallback \/>}/);
    assert.doesNotMatch(routes, /<Suspense fallback={<AppBootSkeleton \/>}>/);
    assert.match(asyncState, /data-route-fallback="public"/);
    assert.match(asyncState, /data-route-fallback="login"/);
    assert.doesNotMatch(asyncState.match(/function PublicRouteFallback[\s\S]*?\n}/)?.[0] ?? "", /sidebar|topbar|TableSkeleton/);
});

test("demonstração identifica conteúdo fictício e oferece navegação acessível", () => {
    assert.match(system, /Representação demonstrativa/);
    assert.match(system, /role="tablist"/);
    assert.match(system, /role="tabpanel"/);
    assert.match(system, /prefers-reduced-motion: reduce/);
    assert.match(system, /Pausar reprodução automática/);
    assert.match(system, /onMouseEnter=\{\(\) => setInteractionPaused\(true\)\}/);
    assert.match(system, /onFocusCapture=\{\(\) => setInteractionPaused\(true\)\}/);
    assert.match(system, /setUserPaused\(true\)/);
    assert.match(system, /ArrowLeft/);
    assert.match(system, /ArrowRight/);
    assert.match(system, /Financeiro, acesso, retenção, agenda e automações chegam a uma fila única/);
    assert.match(system, /Aulas e eventos compartilham contexto, conflitos, ocupação, lista de espera e histórico/);
});

test("login associa campos e anuncia erros", () => {
    assert.match(login, /htmlFor="login-email"/);
    assert.match(login, /htmlFor="login-password"/);
    assert.match(login, /role="alert"/);
    assert.match(login, /aria-busy={loading}/);
});

test("documento público possui metadados essenciais", () => {
    assert.match(html, /lang="pt-BR"/);
    assert.match(html, /name="description"/);
    assert.match(html, /property="og:title"/);
    assert.match(html, /name="twitter:card"/);
    assert.match(html, /name="robots"/);
    assert.match(html, /isPublicRoute/);
    assert.match(html, /publicPaths/);
});

test("footer e CTAs usam destinos semânticos", () => {
    assert.match(footer, /\["#recursos", "Operação"\]/);
    assert.match(footer, /\["#sistema", "Produto"\]/);
    assert.match(footer, /\["#solucoes", "Acesso"\]/);
    assert.match(footer, /to="\/login"/);
    assert.doesNotMatch(footer, /<button/);
});

test("SEO exige URL pública não local para indexação de produção", () => {
    assert.match(seo, /VITE_PUBLIC_SITE_URL/);
    assert.match(seo, /LOCAL_HOSTS/);
    assert.match(seo, /import\.meta\.env\.PROD/);
    assert.match(seo, /noindex,nofollow/);
    assert.match(vite, /Disallow: \/\\n/);
    assert.match(vite, /sitemap\.xml/);
    assert.match(vercel, /X-Robots-Tag/);
    assert.match(vercel, /login\|forgot-password\|reset-password/);
});
