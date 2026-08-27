import { ArrowRight, CheckCircle2, CircleAlert, Gauge, Users } from "lucide-react";

function smoothScrollTo(id: string) {
    const element = document.getElementById(id);
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        element.scrollIntoView();
        return;
    }
    const start = window.scrollY;
    const distance = element.getBoundingClientRect().top + window.scrollY - start;
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

export default function HomeHero() {
    return (
        <div className="relative max-w-[780px] lg:pr-8">
            <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-gradient-to-r from-blue-600 to-cyan-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.21em] text-blue-700">Performance para sua gestão</span>
            </div>
            <h1 className="mt-5 max-w-[760px] text-[clamp(3rem,6vw,5.6rem)] font-black leading-[0.91] tracking-[-0.07em] text-slate-950 max-[339px]:text-[2.65rem] max-[339px]:leading-[0.94] max-[339px]:tracking-[-0.06em]">
                Gestão que acompanha o ritmo da sua academia.
            </h1>
            <div className="mt-6 grid gap-5 border-t border-slate-300/70 pt-5 md:grid-cols-[1fr_auto] md:items-end">
                <p className="max-w-xl text-base leading-8 text-slate-600">Controle sua operação, acompanhe seus números e transforme informação em decisões melhores para sua academia.</p>
                <div className="flex gap-2"><span className="h-2 w-2 rounded-full bg-blue-600" /><span className="h-2 w-8 rounded-full bg-cyan-400" /></div>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
                <a href="#sistema" onClick={(event) => { event.preventDefault(); window.history.replaceState(null, "", "#sistema"); smoothScrollTo("sistema"); }} className="group inline-flex h-12 items-center gap-4 rounded-full bg-blue-600 px-6 text-sm font-bold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Explore o Cfit <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></a>
                <a href="#recursos" onClick={(event) => { event.preventDefault(); window.history.replaceState(null, "", "#recursos"); smoothScrollTo("recursos"); }} className="inline-flex h-12 items-center rounded-full border border-slate-300 bg-white/70 px-6 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Entenda a operação</a>
            </div>
            <div className="mt-7 grid max-w-[720px] grid-cols-3 divide-x divide-slate-300/70 border-y border-slate-300/70">
                {[
                    [Gauge, "Operação", "Tudo sob controle"],
                    [CircleAlert, "Prioridade", "O que pede atenção"],
                    [Users, "Jornada", "Aluno em contexto"],
                ].map(([Icon, label, detail], index) => (
                    <div key={String(label)} className={`min-w-0 py-4 ${index === 0 ? "pr-3 sm:pr-5" : index === 1 ? "px-3 sm:px-5" : "pl-3 sm:pl-5"}`}>
                        <Icon size={18} className={index === 1 ? "text-cyan-600" : "text-blue-600"} />
                        <p className="mt-2 text-[9px] font-black uppercase tracking-[0.19em] text-slate-500">{String(label)}</p>
                        <p className="mt-1 text-[11px] font-bold leading-4 text-slate-800 sm:text-sm">{String(detail)}</p>
                    </div>
                ))}
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-500"><CheckCircle2 size={14} className="text-emerald-600" /> Alunos, financeiro, agenda, acesso e treinos conectados.</p>
        </div>
    );
}
