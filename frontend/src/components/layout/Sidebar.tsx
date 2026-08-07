import {
    LayoutDashboard,
    Users,
    Dumbbell,
    CreditCard,
    Calendar,
    BarChart3,
    Settings,
} from "lucide-react";

import Logo from "@/components/branding/Logo";

const menu = [
    { title: "Dashboard", icon: LayoutDashboard },
    { title: "Alunos", icon: Users },
    { title: "Treinos", icon: Dumbbell },
    { title: "Financeiro", icon: CreditCard },
    { title: "Agenda", icon: Calendar },
    { title: "Relatórios", icon: BarChart3 },
    { title: "Configurações", icon: Settings },
];

export default function Sidebar() {
    return (
        <aside className="flex h-screen w-72 flex-col border-r border-slate-800 bg-slate-950 text-white">
            <div className="border-b border-slate-800 p-6">
                <Logo width={150} />
            </div>

            <nav className="flex-1 space-y-2 p-4">
                {menu.map((item) => {
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.title}
                            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition hover:bg-slate-800"
                        >
                            <Icon size={20} />
                            <span>{item.title}</span>
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
}