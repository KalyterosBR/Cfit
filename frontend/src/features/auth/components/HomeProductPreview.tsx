import { ArrowUpRight, CircleDollarSign, Gauge, Users } from "lucide-react";

export default function HomeProductPreview() {
    return (
        <figure className="relative w-full max-w-[620px]" aria-labelledby="hero-preview-caption">
            <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[#f4f7fb] shadow-[0_30px_80px_-45px_rgba(15,23,42,0.55)]">
                <div className="grid min-h-[390px] grid-cols-[3.5rem_1fr] sm:grid-cols-[4.5rem_1fr]">
                    <div className="flex flex-col items-center gap-3 bg-[#081426] py-5" aria-hidden="true">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[9px] font-black text-blue-700">CF</span>
                        {[Gauge, Users, CircleDollarSign].map((Icon, index) => <span key={index} className={`flex h-9 w-9 items-center justify-center rounded-lg ${index === 0 ? "bg-blue-600 text-white" : "text-slate-500"}`}><Icon size={15} /></span>)}
                    </div>
                    <div className="min-w-0">
                        <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4"><span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">Mapa Operacional Cfit</span><span className="h-7 w-7 rounded-full bg-slate-200" /></div>
                        <div className="p-4 sm:p-5">
                            <div className="flex items-start justify-between gap-4"><div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-700">Performance da operação</p><h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-950">Visão de hoje</h2></div><span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[9px] font-bold text-slate-500">Demonstração</span></div>
                            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
                                <div className="border-t border-slate-300 pt-4"><CircleDollarSign size={18} className="text-blue-700" /><p className="mt-4 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">Receita recebida</p><p className="mt-1 text-2xl font-black tracking-[-0.05em] text-slate-950">R$ 89,2 mil</p><p className="mt-1 text-[10px] text-slate-500">Dados fictícios do período</p></div>
                                <div className="border-t border-slate-300 pt-4"><Users size={18} className="text-cyan-600" /><p className="mt-4 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">Base ativa</p><p className="mt-1 text-2xl font-black tracking-[-0.05em] text-slate-950">1.248</p><p className="mt-1 text-[10px] text-slate-500">Exemplo demonstrativo</p></div>
                            </div>
                            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4"><div className="flex items-center justify-between"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-700">Foco operacional</p><ArrowUpRight size={14} className="text-blue-500" /></div><p className="mt-2 text-sm font-black text-slate-900">Prioridades conectadas à origem</p><p className="mt-1 text-[11px] leading-5 text-slate-600">Cobranças, frequência e rotina organizadas para leitura gerencial.</p></div>
                        </div>
                    </div>
                </div>
            </div>
            <figcaption id="hero-preview-caption" className="mt-3 text-center text-[10px] font-medium text-slate-500">Representação demonstrativa com dados fictícios — nenhuma informação de cliente é exibida.</figcaption>
        </figure>
    );
}
