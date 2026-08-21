import {
    Bell,
    ChevronDown,
    LogOut,
    Menu,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import UniversalSearch from "./UniversalSearch";
import { clearTokens } from "@/features/auth/services/token.service";


type TopbarProps = {
    onOpenSidebar: () => void;
};


const routeLabels: Record<string, string> = {
    "/dashboard": "Visão geral",
    "/students": "Gestão de alunos",
    "/plans": "Planos e contratos",
    "/finance": "Gestão financeira",
    "/checkins": "Monitor de acessos",
    "/workouts": "Treinos",
    "/schedule": "Agenda",
    "/reports": "Relatórios",
    "/settings": "Configurações",
};


export default function Topbar({
    onOpenSidebar,
}: TopbarProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const profileRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);
    const [profileOpen, setProfileOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    useEffect(() => {
        function handleOutsideClick(event: MouseEvent) {
            if (!profileRef.current?.contains(event.target as Node)) {
                setProfileOpen(false);
            }
            if (!notificationsRef.current?.contains(event.target as Node)) {
                setNotificationsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    function handleLogout() {
        clearTokens();
        setProfileOpen(false);
        navigate("/", { replace: true });
    }

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
                <UniversalSearch />

                <div ref={notificationsRef} className="relative">
                    <button
                        type="button"
                        aria-label="Notificações"
                        aria-expanded={notificationsOpen}
                        aria-haspopup="dialog"
                        onClick={() => {
                            setNotificationsOpen((current) => !current);
                            setProfileOpen(false);
                        }}
                        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                    >
                        <Bell size={18} />

                        <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-cyan-500 ring-2 ring-white" />
                    </button>

                    {notificationsOpen && (
                        <div role="dialog" aria-label="Notificações" className="absolute right-0 top-[calc(100%+0.65rem)] w-72 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_22px_55px_-28px_rgba(15,23,42,0.45)]">
                            <p className="text-sm font-semibold text-slate-700">
                                Notificações serão exibidas aqui
                            </p>
                        </div>
                    )}
                </div>

                <div className="hidden h-7 w-px bg-slate-200 sm:block" />

                <div ref={profileRef} className="relative">
                <button
                    type="button"
                    aria-expanded={profileOpen}
                    aria-haspopup="menu"
                    onClick={() => {
                        setProfileOpen((current) => !current);
                        setNotificationsOpen(false);
                    }}
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
                        className={`hidden text-slate-400 transition-transform sm:block ${profileOpen ? "rotate-180" : ""}`}
                    />
                </button>
                {profileOpen && (
                    <div role="menu" className="absolute right-0 top-[calc(100%+0.65rem)] w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_22px_55px_-28px_rgba(15,23,42,0.45)]">
                        <div className="border-b border-slate-100 px-3 py-2.5 sm:hidden">
                            <p className="text-xs font-bold text-slate-900">Administrador</p>
                            <p className="mt-0.5 text-[10px] text-slate-500">Cfit</p>
                        </div>
                        <button type="button" role="menuitem" onClick={handleLogout} className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                            <LogOut size={17} />
                            Sair da conta
                        </button>
                    </div>
                )}
                </div>
            </div>
        </header>
    );
}
