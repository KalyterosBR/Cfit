import { BarChart3, CalendarDays, CreditCard, Dumbbell, Users } from "lucide-react";

const steps = [
    { number: "01", icon: Users, title: "Aluno", detail: "Cadastro, situação e histórico formam a origem da jornada." },
    { number: "02", icon: Dumbbell, title: "Plano e matrícula", detail: "Condições comerciais e regras acompanham cada vínculo." },
    { number: "03", icon: CreditCard, title: "Financeiro", detail: "Cobranças, pagamentos e inconsistências preservam o contexto." },
    { number: "04", icon: BarChart3, title: "Gestão", detail: "A operação vira prioridade, análise e próxima ação." },
];

export default function HomeFeatures() {
    return (
        <section id="recursos" className="relative scroll-mt-[78px] overflow-hidden bg-white py-12 md:py-14">
            <div className="absolute inset-x-0 top-0 h-px bg-slate-200" />
            <div className="relative mx-auto max-w-[1600px] px-6 lg:px-10">
                <div data-scroll-focus className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                    <div>
                        <div className="flex items-center gap-3"><span className="h-px w-8 bg-gradient-to-r from-blue-600 to-cyan-400" /><span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">Mapa da operação</span></div>
                        <h2 className="mt-4 max-w-xl text-[2.5rem] font-black leading-[1] tracking-[-0.052em] text-slate-950 sm:text-5xl">Tudo conversa dentro do Cfit.</h2>
                    </div>
                    <p className="max-w-2xl text-sm leading-7 text-slate-600 lg:justify-self-end">Em vez de módulos isolados, cada decisão permanece ligada ao aluno, ao vínculo, ao financeiro e à rotina da academia.</p>
                </div>

                <div className="mt-6 border-y border-slate-200">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        return <div key={step.number} className={`group grid gap-3 py-4 transition hover:bg-slate-50/70 md:grid-cols-[4rem_0.8fr_1.2fr] md:items-center md:px-4 ${index > 0 ? "border-t border-slate-200" : ""}`}>
                            <span className="text-xs font-black tracking-[0.18em] text-slate-300">{step.number}</span>
                            <div className="flex items-center gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-full border ${index === steps.length - 1 ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-blue-700"}`}><Icon size={17} /></span><h3 className="text-lg font-black tracking-[-0.03em] text-slate-950">{step.title}</h3></div>
                            <p className="max-w-xl text-[13px] leading-5 text-slate-500">{step.detail}</p>
                        </div>;
                    })}
                </div>

                <div className="mt-6 grid overflow-hidden rounded-[1.2rem] bg-[#06101f] text-white lg:grid-cols-[0.42fr_0.58fr]">
                    <div className="relative border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
                        <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-blue-600/20 blur-[100px]" />
                        <div className="relative"><p className="text-[9px] font-black uppercase tracking-[0.21em] text-cyan-300">Núcleo Cfit</p><h3 className="mt-3 max-w-md text-2xl font-black leading-[1.06] tracking-[-0.045em]">Uma leitura para a operação inteira.</h3><p className="mt-3 max-w-md text-[13px] leading-6 text-slate-400">Dados reais alimentam Dashboard, Central e relatórios.</p></div>
                    </div>
                    <div className="grid grid-cols-3 divide-x divide-white/10">
                        {[
                            [CalendarDays, "Agenda", "Tempo e capacidade"],
                            [CreditCard, "Financeiro", "Receita e risco"],
                            [Users, "Relacionamento", "Histórico e retenção"],
                        ].map(([Icon, title, detail]) => <div key={String(title)} className="min-w-0 p-3.5 sm:p-5"><Icon size={17} className="text-cyan-300" /><p className="mt-2 text-[11px] font-bold sm:mt-3 sm:text-sm">{String(title)}</p><p className="mt-1 text-[9px] leading-4 text-slate-300 sm:text-[11px] sm:leading-5">{String(detail)}</p></div>)}
                    </div>
                </div>
            </div>
        </section>
    );
}
