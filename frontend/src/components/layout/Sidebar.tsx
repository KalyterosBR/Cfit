import {
  LayoutDashboard,
  Users,
  Dumbbell,
  CreditCard,
  Calendar,
  BarChart3,
  Settings,
  Layers3,
  Footprints,
  Zap,
  Building2,
  RadioTower,
  TrendingUp,
  FileSignature,
  ChevronDown,
  Star,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";

import { NavLink } from "react-router-dom";

import Logo from "@/components/branding/Logo";
import {
  hasAccess,
  routeAccess,
  useSession,
} from "@/features/auth/access-control";

type MenuItem = {
  title: string;
  path: string;
  icon: LucideIcon;
};

type MenuGroup = {
  label: string;
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    label: "Visão geral",
    items: [
      {
        title: "Dashboard",
        icon: LayoutDashboard,
        path: "/dashboard",
      },
    ],
  },
  {
    label: "Operação",
    items: [
      { title: "Alunos", icon: Users, path: "/students" },
      { title: "Planos", icon: Layers3, path: "/plans" },
      { title: "Check-ins", icon: Footprints, path: "/checkins" },
      { title: "Comercial e turmas", icon: TrendingUp, path: "/growth" },
      { title: "Documentos e portal", icon: FileSignature, path: "/documents" },
    ],
  },
  {
    label: "Gestão",
    items: [
      { title: "Financeiro", icon: CreditCard, path: "/finance" },
      { title: "Relatórios", icon: BarChart3, path: "/reports" },
    ],
  },
  {
    label: "Experiência",
    items: [
      { title: "Treinos", icon: Dumbbell, path: "/workouts" },
      { title: "Agenda", icon: Calendar, path: "/schedule" },
    ],
  },
  {
    label: "Administração",
    items: [
      { title: "Configurações", icon: Settings, path: "/settings" },
      { title: "Unidades", icon: Building2, path: "/units" },
      { title: "Automações", icon: Zap, path: "/automations" },
      { title: "Central operacional", icon: RadioTower, path: "/operations" },
    ],
  },
];

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export default function Sidebar({ open, onClose }: SidebarProps) {
  const profile = useSession();
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});
  const [favorites, setFavorites] = useState<string[]>(() =>
    JSON.parse(localStorage.getItem("cfit_sidebar_favorites") ?? "[]"),
  );
  const visibleGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        hasAccess(profile.capabilities, routeAccess[item.path]),
      ),
    }))
    .filter((group) => group.items.length > 0);
  const visibleItems = useMemo(
    () => visibleGroups.flatMap((group) => group.items),
    [visibleGroups],
  );
  const quickItems = visibleItems.filter((item) =>
    favorites.includes(item.path),
  );

  function toggleFavorite(path: string) {
    setFavorites((current) => {
      const next = current.includes(path)
        ? current.filter((item) => item !== path)
        : [...current, path];
      localStorage.setItem("cfit_sidebar_favorites", JSON.stringify(next));
      return next;
    });
  }

  const renderItem = (item: MenuItem, compact = false) => {
    const Icon = item.icon;
    return (
      <div
        key={`${compact ? "quick" : "menu"}-${item.path}`}
        className="group/item relative"
      >
        <NavLink
          to={item.path}
          onClick={onClose}
          className={({ isActive }) =>
            `group flex h-10 w-full items-center gap-3 overflow-hidden rounded-xl px-3.5 pr-9 text-[13px] font-semibold transition-all duration-200 ${isActive ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_14px_30px_-16px_rgba(37,99,235,0.9)]" : "text-slate-400 hover:bg-white/[0.055] hover:text-slate-100"}`
          }
        >
          <Icon size={18} strokeWidth={2} className="shrink-0" />
          <span>{item.title}</span>
        </NavLink>
        {!compact && (
          <button
            type="button"
            onClick={() => toggleFavorite(item.path)}
            aria-label={`${favorites.includes(item.path) ? "Remover" : "Adicionar"} ${item.title} dos favoritos`}
            className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md transition ${favorites.includes(item.path) ? "text-cyan-300" : "text-slate-600 opacity-0 group-hover/item:opacity-100"}`}
          >
            <Star
              size={13}
              fill={favorites.includes(item.path) ? "currentColor" : "none"}
            />
          </button>
        )}
      </div>
    );
  };
  return (
    <>
      <button
        type="button"
        aria-label="Fechar menu"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity lg:hidden ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-[280px] shrink-0 flex-col overflow-hidden border-r border-white/[0.07] bg-[#050b1c] text-white transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-28 -top-28 h-64 w-64 rounded-full bg-blue-600/15 blur-[90px]" />
          <div className="absolute -bottom-32 -right-32 h-72 w-72 rounded-full bg-cyan-400/[0.08] blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:38px_38px]" />
        </div>

        <div className="relative flex h-[112px] shrink-0 items-center justify-between border-b border-white/[0.07] px-6">
          <NavLink
            to="/dashboard"
            onClick={onClose}
            aria-label="Ir para o Dashboard"
            className="rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-cyan-300/70"
          >
            <Logo width={142} variant="sidebar" />

            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-300/70">
              Gestão em performance
            </p>
          </NavLink>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar navegação"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/[0.07] hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="relative min-h-0 flex-1 overflow-y-auto px-4 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="space-y-4">
            {quickItems.length > 0 && (
              <section>
                <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-300/60">
                  Favoritos
                </p>
                <div className="space-y-1">
                  {quickItems.map((item) => renderItem(item, true))}
                </div>
              </section>
            )}
            {visibleGroups.map((group) => (
              <section key={group.label}>
                <button
                  type="button"
                  onClick={() =>
                    setCollapsedGroups((current) => ({
                      ...current,
                      [group.label]: !current[group.label],
                    }))
                  }
                  className="mb-2 flex w-full items-center justify-between px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-slate-300"
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    size={13}
                    className={`transition-transform ${collapsedGroups[group.label] ? "-rotate-90" : ""}`}
                  />
                </button>
                {!collapsedGroups[group.label] && (
                  <div className="space-y-1">
                    {group.items.map((item) => renderItem(item))}
                  </div>
                )}
              </section>
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}
