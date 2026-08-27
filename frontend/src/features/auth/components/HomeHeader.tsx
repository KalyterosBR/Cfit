import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "@/components/branding/Logo";

type SectionId = "recursos" | "sistema" | "solucoes";
const sections: { id: SectionId; label: string }[] = [
    { id: "recursos", label: "Operação" },
    { id: "sistema", label: "Produto" },
    { id: "solucoes", label: "Acesso" },
];

function animateScroll(target: number) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        window.scrollTo(0, target);
        return;
    }
    const start = window.scrollY;
    const distance = target - start;
    const duration = 700;
    let startedAt: number | null = null;
    function animate(time: number) {
        if (startedAt === null) startedAt = time;
        const progress = Math.min((time - startedAt) / duration, 1);
        const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        window.scrollTo(0, start + distance * eased);
        if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
}

export default function HomeHeader() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState<SectionId | null>(null);

    useEffect(() => {
        function handleScroll() {
            setScrolled(window.scrollY > 24);
            setActiveSection(sections.find(({ id }) => {
                const element = document.getElementById(id);
                if (!element) return false;
                const rect = element.getBoundingClientRect();
                return rect.top <= 110 && rect.bottom > 110;
            })?.id ?? null);
        }
        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (!menuOpen) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") setMenuOpen(false);
        }
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", handleEscape);
        };
    }, [menuOpen]);

    function goTo(id: string) {
        setMenuOpen(false);
        window.history.replaceState(null, "", `#${id}`);

        window.requestAnimationFrame(() => {
            const element = document.getElementById(id);
            if (!element) return;

            const headerHeight = 78;
            const sectionGap = window.innerWidth < 768 ? 12 : 20;
            const sectionRect = element.getBoundingClientRect();
            const availableHeight = window.innerHeight - headerHeight;
            const fitsViewport = sectionRect.height <= availableHeight - sectionGap * 2;
            const offset = fitsViewport
                ? Math.max((availableHeight - sectionRect.height) / 2, sectionGap)
                : sectionGap;
            const target = sectionRect.top + window.scrollY - headerHeight - offset;
            const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);

            animateScroll(Math.min(Math.max(target, 0), maxScroll));
        });
    }

    return (
        <header className={`sticky top-0 z-50 border-b transition ${scrolled ? "border-slate-200/80 bg-white/92 backdrop-blur-xl" : "border-slate-200/60 bg-[#f4f7fb]/95"}`}>
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
            <div className="mx-auto grid h-[78px] max-w-[1600px] grid-cols-[1fr_auto] items-center px-6 md:grid-cols-[1fr_auto_1fr] lg:px-10">
                <button type="button" onClick={() => animateScroll(0)} aria-label="Voltar ao início" className="w-fit transition-opacity hover:opacity-75"><Logo width={128} /></button>
                <nav className="hidden items-center gap-1 rounded-full border border-slate-200 bg-white/75 p-1 shadow-[0_10px_30px_-26px_rgba(15,23,42,0.45)] md:flex">
                    {sections.map(({ id, label }) => <a key={id} href={`#${id}`} aria-current={activeSection === id ? "location" : undefined} onClick={(event) => { event.preventDefault(); goTo(id); }} className={`min-w-[94px] rounded-full px-4 py-2 text-center text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${activeSection === id ? "bg-[#081426] text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"}`}>{label}</a>)}
                </nav>
                <div className="hidden justify-end md:flex"><Link to="/login" className="inline-flex min-h-11 items-center rounded-full border border-slate-300 bg-white px-5 text-xs font-black text-slate-800 transition hover:border-blue-400 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Entrar</Link></div>
                <button type="button" onClick={() => setMenuOpen((current) => !current)} className="flex h-10 w-10 items-center justify-center justify-self-end rounded-full border border-slate-300 bg-white text-slate-800 md:hidden" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}>{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
            </div>
            {menuOpen && <div className="border-t border-slate-200 bg-white px-6 py-4 md:hidden"><nav className="grid gap-2">{sections.map(({ id, label }) => <a key={id} href={`#${id}`} aria-current={activeSection === id ? "location" : undefined} onClick={(event) => { event.preventDefault(); goTo(id); }} className={`min-h-11 rounded-xl px-4 py-3 text-left text-sm font-bold focus-visible:outline-2 focus-visible:outline-blue-600 ${activeSection === id ? "bg-[#081426] text-white" : "text-slate-700 hover:bg-slate-50"}`}>{label}</a>)}<Link to="/login" onClick={() => setMenuOpen(false)} className="mt-2 flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white">Entrar</Link></nav></div>}
        </header>
    );
}
