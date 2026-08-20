import type { LucideIcon } from "lucide-react";
import { ArrowLeft, Construction } from "lucide-react";
import { Link } from "react-router-dom";

import PageHeader from "@/components/PageHeader";
import DashboardLayout from "@/layouts/DashboardLayout";


type ComingSoonProps = {
    title: string;
    description: string;
    icon?: LucideIcon;
};


export default function ComingSoon({
    title,
    description,
    icon: Icon = Construction,
}: ComingSoonProps) {
    return (
        <DashboardLayout>
            <PageHeader
                title={title}
                subtitle={description}
            />

            <div className="flex min-h-[420px] items-center justify-center rounded-[1.75rem] border border-slate-200/80 bg-white p-6 text-center shadow-[0_18px_45px_-32px_rgba(15,23,42,0.3)]">
                <div className="max-w-lg">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-600">
                        <Icon size={28} />
                    </div>

                    <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
                        Em desenvolvimento
                    </p>

                    <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950">
                        Este módulo ainda não está disponível
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-slate-500">
                        A área está prevista no roadmap do Cfit e será implementada em uma etapa própria, com dados reais e fluxo completo.
                    </p>

                    <Link
                        to="/dashboard"
                        className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        <ArrowLeft size={16} />
                        Voltar ao Dashboard
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    );
}
