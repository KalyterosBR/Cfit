import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const localHosts = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function publicSiteOrigin(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || localHosts.has(url.hostname)) return null;
    return `${url.origin}/`;
  } catch {
    return null;
  }
}

function publicIndexFiles(siteOrigin: string | null): Plugin {
  return {
    name: "cfit-public-index-files",
    apply: "build",
    transformIndexHtml(html) {
      if (!siteOrigin) return html;
      return html
        .replace('<meta name="robots" content="noindex,nofollow" />', '<meta name="robots" content="index,follow" />')
        .replace("</head>", `  <link rel="canonical" href="${siteOrigin}" />\n  <meta property="og:url" content="${siteOrigin}" />\n  <meta property="og:image" content="${new URL("/android-chrome-512x512.png", siteOrigin)}" />\n</head>`);
    },
    async closeBundle() {
      const output = resolve(process.cwd(), "dist");
      const robots = siteOrigin
        ? `User-agent: *\nAllow: /\nDisallow: /login\nDisallow: /forgot-password\nDisallow: /reset-password\nDisallow: /dashboard\nSitemap: ${new URL("/sitemap.xml", siteOrigin)}\n`
        : "User-agent: *\nDisallow: /\n";
      await writeFile(resolve(output, "robots.txt"), robots, "utf8");

      if (siteOrigin) {
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteOrigin}</loc></url>\n</urlset>\n`;
        await writeFile(resolve(output, "sitemap.xml"), sitemap, "utf8");
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const siteOrigin = publicSiteOrigin(env.VITE_PUBLIC_SITE_URL);

  return {
    plugins: [react(), tailwindcss(), publicIndexFiles(siteOrigin)],
    resolve: { tsconfigPaths: true },
    server: {
      host: "0.0.0.0",
      watch: { usePolling: true, interval: 100 },
    },
  };
});
