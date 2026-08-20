import {
    Bell,
    ChevronDown,
    Menu,
    Search,
} from "lucide-react";

import { useLocation } from "react-router-dom";


type TopbarProps = {
    onOpenSidebar: () => void;
};


const routeLabels: Record<string, string> = {
    "/dashboard": "Visão geral",
    "/students": "Gestão de alunos",
    "/plans": "Planos e contratos",
    "/finance": "Gestão financeira",
    "/workouts": "Treinos",
    "/schedule": "Agenda",
    "/reports": "Relatórios",
    "/settings": "Configurações",
};


export default function Topbar({
    onOpenSidebar,
}: TopbarProps) {
    const location = useLocation();

    const sectionLabel = location.pathname.startsWith(
        "/students/",
    )
        ? "Detalhes do aluno"
        : routeLabels[location.pathname] ?? "Ambiente Cfit";

    return (
        <header className="relative z-30 flex h-[76px] shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
                <button
                    type="button"
                    onClick={onOpenSidebar}
                    aria-label="Abrir navegação"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-600 lg:hidden"
                >
                    <Menu size={19} />
                </button>

                <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-blue-600">
                        Área do gestor
                    </p>

                    <p className="truncate text-sm font-semibold text-slate-800">
                        {sectionLabel}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative hidden w-[min(24vw,320px)] md:block">
                    <Search
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                        type="text"
                        placeholder="Buscar no Cfit..."
                        className="h-10 w-full rounded-xl border border-slate-200/90 bg-slate-50/80 pl-10 pr-4 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-400 hover:bg-white focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                    />
                </div>

                <button
                    type="button"
                    aria-label="Notificações"
                    className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                >
                    <Bell size={18} />

                    <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-cyan-500 ring-2 ring-white" />
                </button>

                <div className="hidden h-7 w-px bg-slate-200 sm:block" />

                <button
                    type="button"
                    className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-100 sm:gap-3"
                >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-xs font-bold text-white shadow-[0_8px_20px_-10px_rgba(37,99,235,0.8)]">
                        JM
                    </div>

                    <div className="hidden text-left sm:block">
                        <p className="text-xs font-semibold text-slate-900">
                            Administrador
                        </p>

                        <p className="text-[10px] font-medium text-slate-500">
                            Cfit
                        </p>
                    </div>

                    <ChevronDown
                        size={16}
                        className="hidden text-slate-400 sm:block"
                    />
                </button>
            </div>
        </header>
    );
}
