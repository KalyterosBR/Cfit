import { Building2, FileClock, ShieldCheck, Split } from "lucide-react";

const benefits = [
    { icon: ShieldCheck, eyebrow: "Permissões", title: "Acesso adequado a cada responsabilidade.", detail: "Cada perfil recebe acessos compatíveis com sua função na operação." },
    { icon: FileClock, eyebrow: "Rastreabilidade", title: "Mudanças importantes deixam histórico.", detail: "Ações administrativas registram autoria, motivo e momento da alteração." },
    { icon: Building2, eyebrow: "Unidades", title: "Cada unidade no contexto correto.", detail: "A equipe seleciona a unidade ativa e acompanha sua rotina com segurança." },
    { icon: Split, eyebrow: "Financeiro", title: "Cobranças e inconsistências conectadas.", detail: "Pagamentos, conciliação e correções preservam a origem das informações." },
];

export default function HomeBenefits() {
    return (
        <section className="relative bg-[#f4f7fb] py-11 md:py-12">
            <div className="mx-auto max-w-[1600px] px-6 lg:px-10">
                <div id="confianca" className="grid gap-7 lg:grid-cols-[0.34fr_0.66fr] lg:items-start">
                    <div className="lg:self-start">
                        <div className="flex items-center gap-3"><span className="h-px w-8 bg-gradient-to-r from-blue-600 to-cyan-400" /><span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">Confiança verificável</span></div>
                        <h2 className="mt-4 text-[2.5rem] font-black leading-[1] tracking-[-0.052em] text-slate-950 sm:text-5xl">Controle que deixa histórico.</h2>
                        <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">Recursos reais para organizar acesso, histórico e decisões da gestão.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {benefits.map((benefit, index) => { const Icon = benefit.icon; return <article key={benefit.title} className="min-w-0 rounded-[1.1rem] border border-slate-200 bg-white p-3.5 sm:p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-blue-50 text-blue-700"><Icon size={16} /></span><p className="text-[8px] font-black uppercase tracking-[0.14em] text-blue-700 sm:text-[9px] sm:tracking-[0.18em]">0{index + 1} · {benefit.eyebrow}</p></div><h3 className="mt-2.5 text-base font-black leading-5 tracking-[-0.035em] text-slate-950 sm:text-lg">{benefit.title}</h3><p className="mt-1.5 text-[11px] leading-[1.15rem] text-slate-600 sm:text-[12px] sm:leading-5">{benefit.detail}</p></article>; })}
                    </div>
                </div>
            </div>
        </section>
    );
}
