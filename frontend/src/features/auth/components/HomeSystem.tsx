import { useCallback, useEffect, useState, type KeyboardEvent, type ReactNode } from "react";

import {
    ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, CheckCircle2,
    CircleDollarSign, Clock3, Dumbbell, Gauge, LayoutDashboard, ListChecks, Pause, Play, Users,
} from "lucide-react";

type SlideDirection = 1 | -1;
type Slide = { id: string; label: string; eyebrow: string; title: string; description: string; icon: typeof LayoutDashboard; screenshot?: string; content: ReactNode };

const productScreens = import.meta.glob("/src/assets/product-screens/*.{webp,png,jpg,jpeg}", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const getProductScreen = (name: string) => Object.entries(productScreens).find(([path]) => path.endsWith(`/${name}`))?.[1];

function ProductScreenshot({ src, alt, fallback }: { src?: string; alt: string; fallback: ReactNode }) {
    const [available, setAvailable] = useState(true);

    if (!src || !available) return <>{fallback}</>;

    return (
        <>
            <div className="sm:hidden">{fallback}</div>
            <div className="hidden overflow-hidden rounded-[1.35rem] sm:block">
                <img src={src} alt={alt} width="1908" height="942" loading="lazy" decoding="async" onError={() => setAvailable(false)} className="h-auto w-full object-contain" />
            </div>
        </>
    );
}

function Metric({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: ReactNode }) {
    return (
        <div className="border-t border-slate-200/80 py-4 sm:border-l sm:border-t-0 sm:py-1 sm:pl-5">
            <div className="flex items-center justify-between gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-700">{icon}</span>
                <ArrowUpRight size={14} className="text-slate-300" />
            </div>
            <p className="mt-4 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
            <p className="mt-1.5 text-[clamp(1.35rem,2.5vw,2rem)] font-black tracking-[-0.055em] text-slate-950">{value}</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">{detail}</p>
        </div>
    );
}

function StatusRow({ title, detail, status, tone = "blue" }: { title: string; detail: string; status: string; tone?: "blue" | "amber" | "emerald" }) {
    const toneClass = tone === "amber" ? "bg-amber-50 text-amber-700" : tone === "emerald" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700";
    return (
        <div className="grid gap-3 border-t border-slate-200/80 py-3.5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div><p className="text-sm font-bold text-slate-900">{title}</p><p className="mt-1 text-[11px] leading-5 text-slate-500">{detail}</p></div>
            <span className={`w-fit rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${toneClass}`}>{status}</span>
        </div>
    );
}

const slides: Slide[] = [
    {
        id: "dashboard", label: "Mapa operacional", eyebrow: "Dashboard atual", icon: LayoutDashboard, screenshot: getProductScreen("dashboard.webp"),
        title: "A operação começa pelo que exige decisão.",
        description: "Indicadores reais, período, metas e prioridades convivem em uma leitura aberta — sem transformar a gestão em uma grade de cards.",
        content: <div>
            <div className="grid gap-4 sm:grid-cols-[1.25fr_0.75fr]">
                <div className="rounded-[1.35rem] border border-slate-200 bg-white p-5">
                    <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 pb-4">
                        <div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-700">Leitura financeira</p><p className="mt-2 text-lg font-black tracking-[-0.04em] text-slate-950">Receita e base no mesmo contexto</p></div>
                        <span className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-bold text-slate-500">Agosto 2026</span>
                    </div>
                    <div className="grid sm:grid-cols-2"><Metric label="Receita recebida" value="R$ 89,2 mil" detail="Período selecionado" icon={<CircleDollarSign size={17} />} /><Metric label="Alunos ativos" value="1.248" detail="Base operacional atual" icon={<Users size={17} />} /></div>
                </div>
                <div className="relative overflow-hidden rounded-[1.35rem] border border-blue-200 bg-[#eef5ff] p-5">
                    <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-cyan-300/30 blur-3xl" />
                    <div className="relative"><div className="flex items-center justify-between"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-700">Foco operacional</p><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /></div><p className="mt-5 text-4xl font-black tracking-[-0.06em] text-slate-950">06</p><p className="mt-2 text-sm font-bold text-slate-800">itens pedem atenção</p><p className="mt-2 text-xs leading-5 text-slate-500">A prioridade vem antes do volume de informação.</p></div>
                </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 border-y border-slate-200/80 py-4 text-center">{[["94%", "meta financeira"], ["352", "check-ins hoje"], ["+8%", "evolução mensal"]].map(([value, label]) => <div key={label}><p className="text-lg font-black tracking-[-0.04em] text-slate-950">{value}</p><p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-slate-500">{label}</p></div>)}</div>
        </div>,
    },
    {
        id: "operations", label: "Central operacional", eyebrow: "Fila diária", icon: ListChecks, screenshot: getProductScreen("operations.webp"),
        title: "Pendências com origem, responsável e próxima ação.",
        description: "Financeiro, acesso, retenção, agenda e automações chegam a uma fila única, explicável e auditável.",
        content: <div className="rounded-[1.35rem] border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4"><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-700">Requer atenção</p><p className="mt-2 text-lg font-black tracking-[-0.04em] text-slate-950">Prioridades da operação</p></div><div className="flex gap-2"><span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-bold text-slate-600"><strong className="text-slate-950">6</strong> abertas</span><span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-bold text-slate-600"><strong className="text-slate-950">2</strong> SLA vencido</span></div></div>
            <StatusRow title="Cobranças vencidas aguardam ação" detail="Financeiro · responsável definido · vence hoje" status="Alta" tone="amber" /><StatusRow title="Equipamento sem comunicação" detail="Acesso · diagnóstico disponível · há 18 min" status="Em análise" /><StatusRow title="Automação processada com sucesso" detail="Relacionamento · histórico preservado" status="Resolvida" tone="emerald" />
        </div>,
    },
    {
        id: "schedule", label: "Agenda e turmas", eyebrow: "Operação sincronizada", icon: CalendarDays, screenshot: getProductScreen("schedule.webp"),
        title: "Agenda, capacidade e chamada na mesma linha do tempo.",
        description: "Aulas e eventos compartilham contexto, conflitos, ocupação, lista de espera e histórico de alterações.",
        content: <div className="grid gap-4 sm:grid-cols-[0.32fr_0.68fr]">
            <div className="rounded-[1.35rem] border border-slate-200 bg-white p-5"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-700">Hoje</p><p className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950">27</p><p className="text-sm font-bold text-slate-600">Agosto</p><div className="mt-6 space-y-3 border-t border-slate-200 pt-4"><p className="flex items-center gap-2 text-xs font-semibold text-slate-600"><Clock3 size={14} className="text-blue-600" /> 06h às 22h</p><p className="flex items-center gap-2 text-xs font-semibold text-slate-600"><Users size={14} className="text-blue-600" /> 4 profissionais</p></div></div>
            <div className="rounded-[1.35rem] border border-slate-200 bg-white p-5"><div className="grid grid-cols-[3rem_1fr] gap-4">{["08:00", "10:00", "18:30"].map((time, index) => <div className="contents" key={time}><p className="pt-1 text-[10px] font-bold text-slate-400">{time}</p><div className={`mb-3 rounded-xl border-l-4 p-3 ${index === 1 ? "border-cyan-500 bg-cyan-50" : "border-blue-600 bg-blue-50"}`}><div className="flex items-center justify-between gap-3"><p className="text-xs font-black text-slate-900">{index === 0 ? "Funcional" : index === 1 ? "Avaliação física" : "Spinning"}</p><span className="text-[9px] font-bold text-slate-500">{index === 1 ? "Confirmada" : "12 / 16"}</span></div><p className="mt-1 text-[10px] text-slate-500">{index === 1 ? "Sala de avaliação" : "Unidade Centro · Turma ativa"}</p></div></div>)}</div></div>
        </div>,
    },
    {
        id: "student", label: "Aluno 360º", eyebrow: "Jornada conectada", icon: Users, screenshot: getProductScreen("student-360.webp"),
        title: "O aluno deixa de ser cadastro e vira contexto operacional.",
        description: "Plano, financeiro, frequência, treino, avaliação e histórico aparecem juntos para orientar a próxima ação.",
        content: <div className="rounded-[1.35rem] border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">CM</span><div><p className="text-lg font-black tracking-[-0.03em] text-slate-950">Contexto do aluno</p><p className="mt-1 text-[11px] text-slate-500">Jornada completa em uma única ficha</p></div></div><span className="flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700"><CheckCircle2 size={13} /> Regular</span></div>
            <div className="grid gap-x-5 sm:grid-cols-3"><Metric label="Plano atual" value="Premium" detail="Renovação automática" icon={<Gauge size={17} />} /><Metric label="Frequência" value="12 / 30" detail="Últimos trinta dias" icon={<Dumbbell size={17} />} /><Metric label="Próxima ação" value="Revisão" detail="Treino em cinco dias" icon={<CalendarDays size={17} />} /></div>
        </div>,
    },
];

export default function HomeSystem() {
    const [activeSlide, setActiveSlide] = useState(0);
    const [incomingSlide, setIncomingSlide] = useState<number | null>(null);
    const [direction, setDirection] = useState<SlideDirection>(1);
    const [userPaused, setUserPaused] = useState(false);
    const [interactionPaused, setInteractionPaused] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(false);
    const isTransitioning = incomingSlide !== null;

    const startTransition = useCallback((targetIndex: number, requestedDirection?: SlideDirection) => {
        if (targetIndex === activeSlide || isTransitioning) return;
        setDirection(requestedDirection ?? (targetIndex > activeSlide ? 1 : -1));
        if (reducedMotion) {
            setActiveSlide(targetIndex);
            return;
        }
        setIncomingSlide(targetIndex);
    }, [activeSlide, isTransitioning, reducedMotion]);

    useEffect(() => {
        const media = window.matchMedia("(prefers-reduced-motion: reduce)");
        const updatePreference = () => setReducedMotion(media.matches);
        updatePreference();
        media.addEventListener("change", updatePreference);
        return () => media.removeEventListener("change", updatePreference);
    }, []);

    useEffect(() => {
        if (isTransitioning || userPaused || interactionPaused || reducedMotion) return;
        const timer = window.setTimeout(() => startTransition(activeSlide === slides.length - 1 ? 0 : activeSlide + 1, 1), 6000);
        return () => window.clearTimeout(timer);
    }, [activeSlide, interactionPaused, isTransitioning, reducedMotion, startTransition, userPaused]);

    useEffect(() => {
        if (incomingSlide === null) return;
        const transitionTimer = window.setTimeout(() => { setActiveSlide(incomingSlide); setIncomingSlide(null); }, 700);
        return () => window.clearTimeout(transitionTimer);
    }, [incomingSlide]);

    function handleTabsKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
        if (!keys.includes(event.key)) return;
        event.preventDefault();
        setUserPaused(true);
        const target = event.key === "Home" ? 0 : event.key === "End" ? slides.length - 1 : event.key === "ArrowLeft" ? (shownSlide + slides.length - 1) % slides.length : (shownSlide + 1) % slides.length;
        startTransition(target, event.key === "ArrowLeft" ? -1 : 1);
        window.requestAnimationFrame(() => document.getElementById(`system-tab-${slides[target].id}`)?.focus());
    }

    function renderPanel(index: number) {
        const slide = slides[index];
        const Icon = slide.icon;
        return <div className="grid h-full gap-5 lg:grid-cols-[0.25fr_0.75fr] lg:items-center">
            <div><span className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-300/25 bg-blue-400/10 text-cyan-300"><Icon size={18} /></span><p className="mt-4 text-[9px] font-black uppercase tracking-[0.22em] text-cyan-300">{slide.eyebrow}</p><div className="mt-2.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300"><CheckCircle2 size={14} className="text-emerald-400" />Representação demonstrativa</div><h3 className="mt-2.5 max-w-md text-3xl font-black leading-[1.02] tracking-[-0.05em] text-white sm:text-[2.1rem]">{slide.title}</h3><p className="mt-3 max-w-md text-sm leading-6 text-slate-300">{slide.description}</p></div>
            <div className="overflow-hidden rounded-[1.35rem] shadow-[0_28px_80px_-40px_rgba(0,0,0,0.9)]">
                <ProductScreenshot key={slide.id} src={slide.screenshot} alt={`Captura anonimizada de ${slide.label} no Cfit`} fallback={slide.content} />
            </div>
        </div>;
    }

    const shownSlide = incomingSlide ?? activeSlide;
    return <section id="sistema" className="relative overflow-hidden bg-[#06101f] py-11 text-white md:py-12 lg:py-10" onMouseEnter={() => setInteractionPaused(true)} onMouseLeave={() => setInteractionPaused(false)} onFocusCapture={() => setInteractionPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setInteractionPaused(false); }} onClickCapture={(event) => { if ((event.target as HTMLElement).closest('[role="tab"], button[aria-label^="Tela"]')) setUserPaused(true); }}>
        <div className="pointer-events-none absolute inset-0"><div className="absolute -right-48 -top-48 h-[34rem] w-[34rem] rounded-full bg-cyan-400/[0.09] blur-[130px]" /><div className="absolute -bottom-56 left-[12%] h-[34rem] w-[34rem] rounded-full bg-blue-600/[0.12] blur-[140px]" /><div className="absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,0.25)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.25)_1px,transparent_1px)] [background-size:48px_48px]" /></div>
        <div className="relative mx-auto w-full max-w-[1600px] px-6 lg:px-10">
            <div data-scroll-focus className="grid gap-5 border-b border-white/10 pb-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end"><div><div className="flex items-center gap-3"><span className="h-px w-8 bg-gradient-to-r from-blue-500 to-cyan-400" /><span className="text-[10px] font-black uppercase tracking-[0.21em] text-cyan-300">O sistema por dentro</span></div><h2 className="mt-3 max-w-xl text-[2.5rem] font-black leading-[1] tracking-[-0.052em] sm:text-5xl">A mesma linguagem da sua operação.</h2></div><p className="max-w-2xl text-[15px] leading-6 text-slate-300 lg:justify-self-end">Contexto primeiro, prioridade visível e ação próxima do dado.</p></div>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Áreas do sistema" onKeyDown={handleTabsKeyDown}>{slides.map((slide, index) => { const Icon = slide.icon; const selected = index === shownSlide; return <button id={`system-tab-${slide.id}`} key={slide.id} type="button" role="tab" aria-selected={selected} aria-controls="system-demo-panel" tabIndex={selected ? 0 : -1} onClick={() => { setUserPaused(true); startTransition(index); }} disabled={isTransitioning} className={`flex min-h-11 min-w-fit items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${selected ? "border-blue-400/40 bg-blue-500 text-white" : "border-white/10 bg-white/[0.035] text-slate-300 hover:border-white/20 hover:text-white"}`}><Icon size={13} aria-hidden="true" /> {slide.label}</button>; })}</div>
            <div id="system-demo-panel" role="tabpanel" aria-labelledby={`system-tab-${slides[shownSlide].id}`} tabIndex={0} className="relative mt-4 min-h-[580px] overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#0b1729]/90 p-5 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:min-h-[520px] sm:p-6 lg:min-h-[410px] lg:p-7"><div key={`active-${activeSlide}`} className={incomingSlide === null ? "h-full" : `h-full ${direction === 1 ? "animate-[cfit-slide-out-left_700ms_ease_both]" : "animate-[cfit-slide-out-right_700ms_ease_both]"}`}>{renderPanel(activeSlide)}</div>{incomingSlide !== null && <div key={`incoming-${incomingSlide}`} className={`absolute inset-5 sm:inset-6 lg:inset-7 ${direction === 1 ? "animate-[cfit-slide-in-right_700ms_ease_both]" : "animate-[cfit-slide-in-left_700ms_ease_both]"}`}>{renderPanel(incomingSlide)}</div>}</div>
            <div className="mt-6 flex items-center justify-between gap-5 lg:mt-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400"><span className="text-white">0{shownSlide + 1}</span> / 0{slides.length}</p><div className="flex gap-2"><button type="button" onClick={() => setUserPaused((current) => !current)} aria-label={userPaused ? "Retomar reprodução automática" : "Pausar reprodução automática"} aria-pressed={userPaused} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-slate-300 transition hover:border-blue-400/40 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300">{userPaused ? <Play size={16} /> : <Pause size={16} />}</button><button type="button" onClick={() => startTransition(activeSlide === 0 ? slides.length - 1 : activeSlide - 1, -1)} disabled={isTransitioning} aria-label="Tela anterior" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-slate-300 transition hover:border-blue-400/40 hover:bg-blue-500 hover:text-white disabled:opacity-50"><ArrowLeft size={17} /></button><button type="button" onClick={() => startTransition(activeSlide === slides.length - 1 ? 0 : activeSlide + 1, 1)} disabled={isTransitioning} aria-label="Próxima tela" className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"><ArrowRight size={17} /></button></div></div>
        </div>
    </section>;
}
