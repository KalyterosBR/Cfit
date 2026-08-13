import {
    ArrowRight,
    Activity,
    TrendingUp,
} from "lucide-react";


export default function HomeHero() {
    return (
        <div className="relative max-w-2xl">
            {/* IDENTIDADE / EYEBROW */}
            <div className="mb-7 flex items-center gap-3">
                <span className="h-px w-10 bg-gradient-to-r from-blue-600 to-cyan-400" />

                <span className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
                    Performance para sua gestão
                </span>
            </div>


            {/* TÍTULO */}
            <h1 className="text-5xl font-black leading-[1.02] tracking-[-0.045em] text-slate-950 lg:text-7xl">
                Gestão que acompanha
                <br />

                <span className="relative inline-block">
                    o ritmo da sua
                    <span className="ml-3 bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                        academia.
                    </span>

                    <span className="absolute -bottom-3 left-0 h-[3px] w-24 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" />
                </span>
            </h1>


            {/* TEXTO */}
            <p className="mt-10 max-w-xl text-lg leading-8 text-slate-600">
                Controle sua operação, acompanhe seus números e
                transforme informação em decisões melhores para
                sua academia.
            </p>


            {/* INDICADORES */}
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-cyan-400">
                        <Activity size={19} />
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                            Operação
                        </p>

                        <p className="text-sm font-bold text-slate-900">
                            Tudo sob controle
                        </p>
                    </div>
                </div>


                <div className="hidden h-9 w-px bg-slate-200 sm:block" />


                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                        <TrendingUp size={19} />
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                            Performance
                        </p>

                        <p className="text-sm font-bold text-slate-900">
                            Decisões mais claras
                        </p>
                    </div>
                </div>
            </div>


            {/* CTA */}
            <button
                type="button"
                onClick={() => {
                    document
                        .getElementById("sistema")
                        ?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                        });
                }}
                className="group mt-10 inline-flex items-center gap-4 font-bold text-slate-950"
            >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-white transition duration-300 group-hover:bg-blue-600">
                    <ArrowRight
                        size={19}
                        className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                </span>

                <span className="border-b border-slate-300 pb-1 transition group-hover:border-blue-600 group-hover:text-blue-600">
                    Explore o Cfit
                </span>
            </button>
        </div>
    );
}