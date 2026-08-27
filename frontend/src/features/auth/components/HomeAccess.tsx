import { CheckCircle2, Clock3, CreditCard, DoorOpen, KeyRound, ShieldCheck } from "lucide-react";

const steps = [
    { icon: KeyRound, number: "01", title: "Identificação", detail: "O acesso informa o aluno e a origem da tentativa." },
    { icon: CreditCard, number: "02", title: "Política", detail: "O Cfit verifica vínculo, situação financeira e regras de acesso." },
    { icon: DoorOpen, number: "03", title: "Decisão", detail: "A entrada é liberada ou bloqueada com causa e histórico." },
];

export default function HomeAccess() {
    return (
        <section id="solucoes" className="relative scroll-mt-[78px] overflow-hidden bg-white py-12 md:py-14 lg:py-10">
            <div className="mx-auto max-w-[1600px] px-6 lg:px-10">
                <div data-scroll-focus className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
                    <div><div className="flex items-center gap-3"><span className="h-px w-8 bg-gradient-to-r from-blue-600 to-cyan-400" /><span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">Acesso conectado</span></div><h2 className="mt-4 max-w-xl text-[2.5rem] font-black leading-[1] tracking-[-0.052em] text-slate-950 sm:text-5xl">A experiência começa na entrada.</h2></div>
                    <p className="max-w-2xl text-sm leading-6 text-slate-600 lg:justify-self-end">Política, decisão, histórico e contingência manual no mesmo fluxo. Dispositivos físicos dependem da configuração da academia.</p>
                </div>

                <div className="mt-6 grid overflow-hidden rounded-[1.2rem] border border-slate-200 bg-[#f4f7fb] lg:grid-cols-[0.6fr_0.4fr]">
                    <div className="p-5 sm:p-6">
                        <div className="flex items-center justify-between gap-4 border-b border-slate-300 pb-4"><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-700">Fluxo de acesso</p><h3 className="mt-1.5 text-xl font-black tracking-[-0.04em] text-slate-950">Da tentativa ao registro.</h3></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-700">Disponível</span></div>
                        <div>{steps.map((step, index) => { const Icon = step.icon; return <div key={step.number} className={`grid gap-3 py-3.5 sm:grid-cols-[3rem_1fr] sm:items-center ${index > 0 ? "border-t border-slate-300" : ""}`}><span className={`flex h-10 w-10 items-center justify-center rounded-full ${index === steps.length - 1 ? "bg-blue-600 text-white" : "border border-slate-300 bg-white text-blue-700"}`}><Icon size={17} /></span><div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">{step.number} · Etapa</p><p className="mt-1 text-sm font-black text-slate-950">{step.title}</p><p className="mt-0.5 text-xs leading-5 text-slate-600">{step.detail}</p></div></div>; })}</div>
                    </div>
                    <aside className="relative overflow-hidden bg-[#06101f] p-6 text-white">
                        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-[100px]" />
                        <div className="relative"><ShieldCheck size={21} className="text-cyan-300" /><p className="mt-5 text-[8px] font-black uppercase tracking-[0.21em] text-cyan-300">Resposta operacional</p><h3 className="mt-2 text-2xl font-black leading-[1.05] tracking-[-0.045em]">Acesso explicado, não apenas bloqueado.</h3><p className="mt-2 text-xs leading-5 text-slate-300">A equipe vê a causa e pode seguir o fluxo autorizado de contingência.</p><div className="mt-5 border-y border-white/10 py-3"><p className="flex items-center gap-3 text-[11px] font-bold text-slate-300"><Clock3 size={15} className="text-blue-400" /> Histórico em tempo real</p><p className="mt-2.5 flex items-center gap-3 text-[11px] font-bold text-slate-300"><CheckCircle2 size={15} className="text-emerald-400" /> Decisão auditável</p></div></div>
                    </aside>
                </div>
            </div>
        </section>
    );
}
