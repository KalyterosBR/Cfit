import {
    Bell,
    ChevronDown,
    LogOut,
    Menu,
    RotateCcw,
    X,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import UniversalSearch from "./UniversalSearch";
import { clearTokens } from "@/features/auth/services/token.service";
import { Api } from "@/services/http";
import { hasAccess, routeAccess, useSession } from "@/features/auth/access-control";
import ThemeToggle from "@/components/theme/ThemeToggle";


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
    "/units": "Academia e unidades",
    "/automations": "Automações",
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
    const profile = useSession();
    const [notifications, setNotifications] = useState<Array<{ id: string; title: string; detail: string; href: string; severity: string; read: boolean; archived: boolean }>>([]);
    const [showArchivedNotifications, setShowArchivedNotifications] = useState(false);

    useEffect(() => {
        Api.get<{ results: Array<{ id: string; title: string; detail: string; href: string; severity: string; read: boolean; archived: boolean }> }>("/users/notifications/", { params: { include_archived: showArchivedNotifications || undefined } }).then(alerts => setNotifications(alerts.data.results.filter(item => hasAccess(profile.capabilities, routeAccess[`/${item.href.split("/")[1]}`])))).catch(() => undefined);
    }, [location.pathname, profile.capabilities, showArchivedNotifications]);

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

    function openNotifications() {
        const opening = !notificationsOpen;
        setNotificationsOpen(opening);
        setProfileOpen(false);
        if (opening) {
            notifications.filter((item) => !item.read).forEach((item) => void Api.patch("/users/notifications/", { id: item.id, action: "read" }));
            setNotifications((current) => current.map((item) => ({ ...item, read: true })));
        }
    }

    function archiveNotification(id: string) {
        void Api.patch("/users/notifications/", { id, action: "archive" });
        setNotifications((current) => current.filter((item) => item.id !== id));
    }

    function restoreNotification(id: string) {
        void Api.patch("/users/notifications/", { id, action: "restore" });
        setNotifications((current) => current.map((item) => item.id === id ? { ...item, archived: false } : item));
    }

    const sectionLabel = location.pathname.startsWith(
        "/students/",
    )
        ? "Detalhes do aluno"
        : routeLabels[location.pathname] ?? "Ambiente Cfit";

    return (
        <header className="relative z-30 flex h-[72px] shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
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

                <ThemeToggle className="border-0 bg-transparent" />

                <div ref={notificationsRef} className="relative">
                    <button
                        type="button"
                        aria-label={notifications.length > 0 ? `${notifications.length} notificações` : "Notificações"}
                        title="Notificações"
                        aria-expanded={notificationsOpen}
                        aria-haspopup="dialog"
                        onClick={openNotifications}
                        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                    >
                        <Bell size={18} />

                        {notifications.some((item) => !item.read) && <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-cyan-500 ring-2 ring-white" />}
                    </button>

                    {notificationsOpen && (
                        <div role="dialog" aria-label="Notificações" className="cfit-floating-panel absolute right-0 top-[calc(100%+0.65rem)] w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-[var(--cfit-shadow-elevated)]"><div className="flex items-center justify-between px-2 py-2"><p className="text-xs font-black uppercase tracking-wider text-slate-500">{showArchivedNotifications ? "Histórico arquivado" : "Requer atenção"}</p><button type="button" onClick={() => setShowArchivedNotifications((current) => !current)} className="text-xs font-bold text-blue-600">{showArchivedNotifications ? "Ativas" : "Histórico"}</button></div>{notifications.length === 0 ? <p className="p-3 text-sm text-slate-500">Nenhuma pendência operacional.</p> : notifications.map(item => <div key={item.id} className="group relative rounded-xl hover:bg-slate-50"><button type="button" onClick={() => { setNotificationsOpen(false); navigate(item.href); }} className="block w-full p-3 pr-10 text-left"><span className="block text-sm font-bold text-slate-800">{item.title}</span><span className="mt-1 block text-xs text-slate-500">{item.detail}</span></button><button type="button" onClick={() => item.archived ? restoreNotification(item.id) : archiveNotification(item.id)} aria-label={`${item.archived ? "Restaurar" : "Arquivar"} ${item.title}`} title={item.archived ? "Restaurar" : "Arquivar"} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-red-600">{item.archived ? <RotateCcw size={14} /> : <X size={14} />}</button></div>)}</div>
                    )}
                </div>

                <div className="hidden h-7 w-px bg-slate-200 sm:block" />

                <div ref={profileRef} className="relative">
                <button
                    type="button"
                    aria-expanded={profileOpen}
                    aria-haspopup="menu"
                    title="Abrir menu do usuário"
                    onClick={() => {
                        setProfileOpen((current) => !current);
                        setNotificationsOpen(false);
                    }}
                    className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-100 sm:gap-3"
                >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-xs font-bold text-white shadow-[0_8px_20px_-10px_rgba(37,99,235,0.8)]">
                        {profile.name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase()}
                    </div>

                    <div className="hidden min-w-0 max-w-48 text-left sm:block">
                        <p className="truncate text-xs font-semibold text-slate-900" title={profile.name}>
                            {profile.name}
                        </p>

                        <p className="truncate text-[10px] font-medium text-slate-500" title={`${profile.academy?.name ?? "Cfit"}${profile.active_unit?.name ? ` · ${profile.active_unit.name}` : ""}`}>
                            {profile.academy?.name ?? "Cfit"}{profile.active_unit?.name ? ` · ${profile.active_unit.name}` : ""}
                        </p>
                    </div>

                    <ChevronDown
                        size={16}
                        className={`hidden text-slate-400 transition-transform sm:block ${profileOpen ? "rotate-180" : ""}`}
                    />
                </button>
                {profileOpen && (
                    <div role="menu" className="cfit-floating-panel absolute right-0 top-[calc(100%+0.65rem)] w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-[var(--cfit-shadow-elevated)]">
                        <div className="border-b border-slate-100 px-3 py-2.5 sm:hidden">
                            <p className="text-xs font-bold text-slate-900">{profile.name}</p>
                            <p className="mt-0.5 text-[10px] text-slate-500">{profile.role_label}</p>
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
