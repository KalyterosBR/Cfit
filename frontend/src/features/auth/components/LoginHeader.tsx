import { ShieldCheck } from "lucide-react";

import Logo from "@/components/branding/Logo";


export default function LoginHeader() {
    return (
        <div>
            {/* TOPO */}
            <div className="flex items-start justify-between gap-4">
                <Logo width={150} />

                <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-400">
                        Seguro
                    </span>
                </div>
            </div>


            {/* IDENTIDADE */}
            <div className="mt-10 flex items-center gap-3">
                <span className="h-px w-8 bg-gradient-to-r from-blue-500 to-cyan-400" />

                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
                    Área do gestor
                </span>
            </div>


            {/* TÍTULO */}
            <h2 className="mt-4 text-3xl font-black tracking-[-0.035em] text-white">
                Bem-vindo de volta.
            </h2>

            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">
                Acesse sua operação e continue acompanhando a
                performance da sua academia.
            </p>


            {/* SEGURANÇA */}
            <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="h-4 w-4 text-blue-400" />

                <span>
                    Acesso protegido ao ambiente Cfit
                </span>
            </div>
        </div>
    );
}