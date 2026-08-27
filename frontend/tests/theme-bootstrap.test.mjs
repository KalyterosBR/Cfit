import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const bootstrap = html.match(/<script>\s*([\s\S]*?)\s*<\/script>/)?.[1];

assert.ok(bootstrap, "O bootstrap síncrono do tema deve existir no documento.");

function runBootstrap({ savedTheme = null, systemDark = false, pathname = "/dashboard" } = {}) {
    const classes = new Set(["cfit-theme-booting"]);
    const documentElement = {
        classList: {
            toggle(name, enabled) {
                if (enabled) classes.add(name);
                else classes.delete(name);
            },
        },
        dataset: {},
        style: {},
    };

    vm.runInNewContext(bootstrap, {
        document: { documentElement },
        localStorage: { getItem: () => savedTheme },
        window: { matchMedia: () => ({ matches: systemDark }), location: { pathname } },
    });

    return { classes, documentElement };
}

test("aplica o modo escuro salvo antes da renderização", () => {
    const { classes, documentElement } = runBootstrap({ savedTheme: "dark" });

    assert.equal(classes.has("dark"), true);
    assert.equal(documentElement.dataset.cfitTheme, "dark");
    assert.equal(documentElement.style.colorScheme, "dark");
});

test("força superfície clara nas rotas públicas antes do React", () => {
    for (const pathname of ["/", "/login", "/forgot-password", "/reset-password"]) {
        const { classes, documentElement } = runBootstrap({ savedTheme: "dark", systemDark: true, pathname });

        assert.equal(classes.has("dark"), false);
        assert.equal(documentElement.dataset.cfitTheme, "light");
        assert.equal(documentElement.style.colorScheme, "light");
    }
});

test("aplica o modo claro salvo mesmo quando o sistema prefere escuro", () => {
    const { classes, documentElement } = runBootstrap({ savedTheme: "light", systemDark: true });

    assert.equal(classes.has("dark"), false);
    assert.equal(documentElement.dataset.cfitTheme, "light");
    assert.equal(documentElement.style.colorScheme, "light");
});

test("usa a preferência do sistema somente sem escolha persistida", () => {
    const { classes, documentElement } = runBootstrap({ systemDark: true });

    assert.equal(classes.has("dark"), true);
    assert.equal(documentElement.dataset.cfitTheme, "dark");
});
