import { ShieldCheck } from "lucide-react";


export default function LoginHeader() {
    return (
        <div>
            {/* TOPO CLEAN */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                        Ambiente Cfit
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-200">
                        Gestão da sua academia
                    </p>
                </div>


                <div className="flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/[0.08] px-3 py-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.65)]" />

                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-300">
                        Seguro
                    </span>
                </div>
            </div>


            {/* IDENTIDADE */}
            <div className="mt-9 flex items-center gap-3">
                <span className="h-px w-8 bg-gradient-to-r from-blue-500 to-cyan-400" />

                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                    Área do gestor
                </span>
            </div>


            {/* TÍTULO */}
            <h2 className="mt-4 text-3xl font-black tracking-[-0.035em] text-white">
                Bem-vindo de volta.
            </h2>


            <p className="mt-3 max-w-sm text-[15px] leading-7 text-slate-300">
                Acesse sua operação e continue acompanhando a
                performance da sua academia.
            </p>


            {/* SEGURANÇA */}
            <div className="mt-6 flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/[0.10] text-blue-300">
                    <ShieldCheck className="h-4 w-4" />
                </div>

                <span className="text-xs font-medium text-slate-400">
                    Acesso protegido ao ambiente Cfit
                </span>
            </div>
        </div>
    );
}