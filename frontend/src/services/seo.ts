const PUBLIC_SITE_URL = import.meta.env.VITE_PUBLIC_SITE_URL?.trim();
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function configuredPublicOrigin() {
    if (!PUBLIC_SITE_URL) return null;
    try {
        const url = new URL(PUBLIC_SITE_URL);
        if (!['http:', 'https:'].includes(url.protocol) || LOCAL_HOSTS.has(url.hostname)) return null;
        return `${url.origin}/`;
    } catch {
        return null;
    }
}
function setMeta(selector: string, attribute: "name" | "property", key: string, content: string | null) {
    let element = document.querySelector<HTMLMetaElement>(selector);
    if (!content) {
        element?.remove();
        return;
    }
    if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
    }
    element.content = content;
}

export function applySeo(pathname: string, title: string) {
    const publicOrigin = configuredPublicOrigin();
    const productionPublicSite = import.meta.env.PROD && Boolean(publicOrigin);
    const homepage = pathname === "/";
    const indexable = productionPublicSite && homepage;
    const canonicalUrl = publicOrigin
        ? new URL(homepage ? "/" : pathname, publicOrigin).toString()
        : import.meta.env.DEV
            ? new URL(homepage ? "/" : pathname, window.location.origin).toString()
            : null;

    document.title = homepage ? "Cfit — Gestão e performance para academias" : `${title} — Cfit`;
    setMeta('meta[name="robots"]', "name", "robots", indexable ? "index,follow" : "noindex,nofollow");
    setMeta('meta[property="og:url"]', "property", "og:url", canonicalUrl);
    setMeta('meta[property="og:image"]', "property", "og:image", publicOrigin ? new URL("/android-chrome-512x512.png", publicOrigin).toString() : null);

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalUrl) {
        canonical?.remove();
        return;
    }
    if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;
}
