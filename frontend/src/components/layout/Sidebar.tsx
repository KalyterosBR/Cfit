import {
    LayoutDashboard,
    Users,
    Dumbbell,
    CreditCard,
    Calendar,
    BarChart3,
    LogOut,
    Settings,
    ShieldCheck,
    Layers3,
    X,
} from "lucide-react";

import {
    NavLink,
    useNavigate,
} from "react-router-dom";

import Logo from "@/components/branding/Logo";
import { clearTokens } from "@/features/auth/services/token.service";

const menu = [
    {
        title: "Dashboard",
        icon: LayoutDashboard,
        path: "/dashboard",
    },
    {
        title: "Alunos",
        icon: Users,
        path: "/students",
    },
    {
        title: "Planos",
        icon: Layers3,
        path: "/plans",
    },
    {
        title: "Treinos",
        icon: Dumbbell,
        path: "/workouts",
    },
    {
        title: "Financeiro",
        icon: CreditCard,
        path: "/finance",
    },
    {
        title: "Agenda",
        icon: Calendar,
        path: "/schedule",
    },
    {
        title: "Relatórios",
        icon: BarChart3,
        path: "/reports",
    },
    {
        title: "Configurações",
        icon: Settings,
        path: "/settings",
    },
];

type SidebarProps = {
    open: boolean;
    onClose: () => void;
};


export default function Sidebar({
    open,
    onClose,
}: SidebarProps) {
    const navigate = useNavigate();


    function handleLogout() {
        clearTokens();

        onClose();

        navigate("/", {
            replace: true,
        });
    }


    return (
        <>
            <button
                type="button"
                aria-label="Fechar menu"
                onClick={onClose}
                className={`fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity lg:hidden ${open
                    ? "visible opacity-100"
                    : "invisible opacity-0"
                    }`}
            />

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex h-full w-[280px] shrink-0 flex-col overflow-hidden border-r border-white/[0.07] bg-[#050b1c] text-white shadow-[24px_0_70px_-36px_rgba(15,23,42,0.8)] transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0 ${open
                    ? "translate-x-0"
                    : "-translate-x-full"
                    }`}
            >
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -left-28 -top-28 h-64 w-64 rounded-full bg-blue-600/15 blur-[90px]" />
                    <div className="absolute -bottom-32 -right-32 h-72 w-72 rounded-full bg-cyan-400/[0.08] blur-[100px]" />
                    <div className="absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:38px_38px]" />
                </div>

                <div className="relative flex h-[112px] shrink-0 items-center justify-between border-b border-white/[0.07] px-6">
                    <div>
                        <Logo width={104} />

                        <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-300/70">
                            Gestão em performance
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fechar navegação"
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/[0.07] hover:text-white lg:hidden"
                    >
                        <X size={18} />
                    </button>
                </div>

                <nav className="relative min-h-0 flex-1 overflow-y-auto px-4 py-5">
                    <p className="mb-3 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
                        Operação
                    </p>

                    <div className="space-y-1.5">
                        {menu.map((item) => {
                            const Icon = item.icon;

                            return (
                                <NavLink
                                    key={item.title}
                                    to={item.path}
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                        [
                                            "group relative flex h-11 w-full items-center gap-3 overflow-hidden rounded-xl px-3.5 text-[13px] font-semibold transition-all duration-200",
                                            isActive
                                                ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_14px_30px_-16px_rgba(37,99,235,0.9)]"
                                                : "text-slate-400 hover:bg-white/[0.055] hover:text-slate-100",
                                        ].join(" ")
                                    }
                                >
                                    <Icon
                                        size={18}
                                        strokeWidth={2}
                                        className="shrink-0"
                                    />

                                    <span>{item.title}</span>
                                </NavLink>
                            );
                        })}
                    </div>
                </nav>

                <div className="relative shrink-0 border-t border-white/[0.07] p-4">
                    <div className="mb-3 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.035] px-3 py-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
                            <ShieldCheck size={16} />
                        </div>

                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-slate-200">
                                Ambiente seguro
                            </p>

                            <p className="text-[9px] text-slate-500">
                                Sessão protegida pelo Cfit
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="group flex h-11 w-full items-center gap-3 rounded-xl px-3.5 text-[13px] font-semibold text-slate-400 transition-all hover:bg-red-500/10 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/30"
                    >
                        <LogOut
                            size={18}
                            className="transition-transform group-hover:-translate-x-0.5"
                        />

                        <span>Sair da conta</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
