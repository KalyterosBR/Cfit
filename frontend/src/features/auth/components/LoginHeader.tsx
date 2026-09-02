import { ShieldCheck } from "lucide-react";


export default function LoginHeader() {
    return (
        <div>
            {/* TOPO CLEAN */}
            <div className="flex min-w-0 items-center justify-between gap-4 px-0.5">
                <div className="min-w-0 pr-2">
                    <p className="whitespace-nowrap text-[9px] font-bold uppercase leading-4 tracking-[0.2em] text-slate-400">
                        Ambiente Cfit
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-200">
                        Gestão da sua academia
                    </p>
                </div>


                <div className="mr-px flex shrink-0 items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/[0.08] px-3 py-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.65)]" />

                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-300">
                        Seguro
                    </span>
                </div>
            </div>


            {/* IDENTIDADE */}
            <div className="mt-5 flex items-center max-[339px]:mt-3 sm:mt-6">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                    Área do gestor
                </span>
            </div>


            {/* TÍTULO */}
            <h2 className="mt-3 text-[1.7rem] font-black tracking-[-0.035em] text-white max-[339px]:mt-2 max-[339px]:text-2xl sm:text-3xl">
                Bem-vindo de volta.
            </h2>


            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-300 max-[339px]:leading-5 sm:text-[15px]">
                Acesse sua operação e continue acompanhando a
                performance da sua academia.
            </p>


            {/* SEGURANÇA */}
            <div className="mt-4 flex items-center gap-2.5 max-[339px]:mt-3">
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
