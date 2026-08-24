import { ShieldX } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import { hasAccess, useSession, type AccessRequirement } from "../access-control";

export default function CapabilityRoute({ requirement, children }: { requirement: AccessRequirement; children: ReactNode }) {
    const profile = useSession();
    if (hasAccess(profile.capabilities, requirement)) return children;
    return <DashboardLayout><div className="mx-auto max-w-xl rounded-3xl border border-amber-200 bg-white p-10 text-center shadow-sm"><ShieldX className="mx-auto text-amber-500" size={42} /><h1 className="mt-5 text-2xl font-black text-slate-950">Você não tem acesso a este módulo</h1><p className="mt-2 text-sm leading-6 text-slate-500">Seu perfil de {profile.role_label.toLowerCase()} não possui as permissões necessárias. Solicite uma alteração ao administrador caso isso impeça seu trabalho.</p><Link to="/dashboard" className="mt-6 inline-flex h-11 items-center rounded-xl bg-blue-600 px-5 text-sm font-bold text-white">Voltar ao Dashboard</Link></div></DashboardLayout>;
}
