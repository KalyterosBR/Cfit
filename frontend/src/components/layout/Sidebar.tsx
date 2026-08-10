import {
    LayoutDashboard,
    Users,
    Dumbbell,
    CreditCard,
    Calendar,
    BarChart3,
    Settings,
} from "lucide-react";

import { NavLink } from "react-router-dom";

import Logo from "@/components/branding/Logo";

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

export default function Sidebar() {
    return (
        <aside className="flex min-h-screen w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-white">
            <div className="flex h-[136px] items-center border-b border-slate-800 px-8">
                <Logo width={110} />
            </div>

            <nav className="flex-1 space-y-2 p-4">
                {menu.map((item) => {
                    const Icon = item.icon;

                    return (
                        <NavLink
                            key={item.title}
                            to={item.path}
                            className={({ isActive }) =>
                                [
                                    "flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all",
                                    isActive
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                                        : "text-slate-300 hover:bg-slate-800 hover:text-white",
                                ].join(" ")
                            }
                        >
                            <Icon size={20} />
                            <span>{item.title}</span>
                        </NavLink>
                    );
                })}
            </nav>
        </aside>
    );
}