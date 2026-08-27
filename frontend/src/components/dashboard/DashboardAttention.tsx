import { useCallback, useEffect, useState } from "react";

import {
    AlertTriangle,
    ArrowUpRight,
    CreditCard,
    RefreshCw,
    ShieldAlert,
    ShieldCheck,
    UserMinus,
    UserRoundX,
    HeartPulse,
} from "lucide-react";
import { Link } from "react-router-dom";
import { SkeletonBlock } from "@/components/AsyncState";

import { getRecurringAttemptSummary } from "@/features/students/services/recurring-attempt.service";
import {
    getDashboardOverdueSummary,
    getFinancialInconsistencies,
} from "@/features/students/services/financial.service";
import { getRequestErrorKind } from "@/services/http/request-error";
import { getActiveStudentSegmentCount, getStudentHealthSummary } from "@/features/students/services/student.service";


type AttentionSummary = {
    overdueCount: number;
    overdueTotal: string;
    unresolvedRecurringCount: number;
    rejectedAttemptCount: number;
    inconsistencyCount: number;
    criticalInconsistencyCount: number;
    highInconsistencyCount: number;
    studentsWithoutPlanCount: number;
    studentsWithoutRecentCheckInCount: number;
    studentsAtRiskCount: number;
};

export type DashboardRole = "manager" | "reception" | "finance" | "instructor" | "commercial";


const emptySummary: AttentionSummary = {
    overdueCount: 0,
    overdueTotal: "0",
    unresolvedRecurringCount: 0,
    rejectedAttemptCount: 0,
    inconsistencyCount: 0,
    criticalInconsistencyCount: 0,
    highInconsistencyCount: 0,
    studentsWithoutPlanCount: 0,
    studentsWithoutRecentCheckInCount: 0,
    studentsAtRiskCount: 0,
};


function formatMoney(value: string) {
    return Number(value).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}


async function getAttentionSummary(role: DashboardRole): Promise<AttentionSummary> {
    const includesFinancial = role === "manager" || role === "finance";
    const includesStudents = role === "manager" || role === "reception" || role === "instructor" || role === "commercial";
    const [
        overdue,
        recurring,
        inconsistencies,
        studentsWithoutPlanCount,
        studentsWithoutRecentCheckInCount,
        healthSummary,
    ] = await Promise.all([
        includesFinancial ? getDashboardOverdueSummary() : Promise.resolve({ overdue_count: 0, overdue_total: "0" }),
        includesFinancial ? getRecurringAttemptSummary("all", "") : Promise.resolve({ unresolved_charge_count: 0, rejected_count: 0 }),
        includesFinancial ? getFinancialInconsistencies("all", "", 1) : Promise.resolve({ summary: { total_count: 0, critical_count: 0, high_count: 0 } }),
        includesStudents ? getActiveStudentSegmentCount("without_plan") : Promise.resolve(0),
        includesStudents ? getActiveStudentSegmentCount("without_recent_checkin") : Promise.resolve(0),
        includesStudents ? getStudentHealthSummary() : Promise.resolve({ risk_count: 0 }),
    ]);

    return {
        overdueCount: overdue.overdue_count,
        overdueTotal: overdue.overdue_total,
        unresolvedRecurringCount: recurring.unresolved_charge_count,
        rejectedAttemptCount: recurring.rejected_count,
        inconsistencyCount: inconsistencies.summary.total_count,
        criticalInconsistencyCount: inconsistencies.summary.critical_count,
        highInconsistencyCount: inconsistencies.summary.high_count,
        studentsWithoutPlanCount,
        studentsWithoutRecentCheckInCount,
        studentsAtRiskCount: healthSummary.risk_count,
    };
}


export default function DashboardAttention({ role = "manager", variant = "card" }: { role?: DashboardRole; variant?: "card" | "canvas" }) {
    const [summary, setSummary] = useState<AttentionSummary>(emptySummary);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);

    const loadAttention = useCallback(async () => {
        try {
            setLoading(true);
            setError(false);
            setPermissionDenied(false);

            setSummary(await getAttentionSummary(role));
        } catch (requestError) {
            console.error(requestError);
            setSummary(emptySummary);
            setError(true);
            setPermissionDenied(
                getRequestErrorKind(requestError) === "forbidden",
            );
        } finally {
            setLoading(false);
        }
    }, [role]);

    useEffect(() => {
        let current = true;

        getAttentionSummary(role)
            .then((data) => {
                if (!current) return;

                setSummary(data);
                setError(false);
                setPermissionDenied(false);
            })
            .catch((requestError) => {
                console.error(requestError);

                if (!current) return;

                setSummary(emptySummary);
                setError(true);
                setPermissionDenied(
                    getRequestErrorKind(requestError) === "forbidden",
                );
            })
            .finally(() => {
                if (current) setLoading(false);
            });

        return () => {
            current = false;
        };
    }, [role]);

    const totalAttention = (role === "manager" || role === "finance"
        ? summary.overdueCount + summary.unresolvedRecurringCount + summary.inconsistencyCount
        : 0)
        + (role === "manager" || role === "reception" || role === "commercial" ? summary.studentsWithoutPlanCount : 0)
        + (role === "manager" || role === "reception" || role === "instructor" || role === "commercial"
            ? summary.studentsWithoutRecentCheckInCount + summary.studentsAtRiskCount
            : 0);

    const items = [
        {
            title: "Cobranças vencidas",
            value: summary.overdueCount,
            detail: `${formatMoney(summary.overdueTotal)} aguardando recebimento`,
            action: "Priorizar a recuperação das cobranças mais antigas",
            href: "/finance?category=overdue#charges",
            icon: AlertTriangle,
            iconClass: "bg-red-50 text-red-600",
            valueClass: "text-red-700",
            roles: ["manager", "finance"],
        },
        {
            title: "Recorrências com falha",
            value: summary.unresolvedRecurringCount,
            detail: `${summary.rejectedAttemptCount} tentativa(s) rejeitada(s)`,
            action: "Revisar a causa e programar a próxima tentativa",
            href: "/finance#recurring-failures",
            icon: CreditCard,
            iconClass: "bg-orange-50 text-orange-600",
            valueClass: "text-orange-700",
            roles: ["manager", "finance"],
        },
        {
            title: "Inconsistências financeiras",
            value: summary.inconsistencyCount,
            detail: `${summary.criticalInconsistencyCount} crítica(s) e ${summary.highInconsistencyCount} alta(s)`,
            action: "Corrigir as ocorrências de maior prioridade",
            href: "/finance#financial-inconsistencies",
            icon: ShieldAlert,
            iconClass: "bg-violet-50 text-violet-600",
            valueClass: "text-violet-700",
            roles: ["manager", "finance"],
        },
        {
            title: "Alunos sem plano",
            value: summary.studentsWithoutPlanCount,
            detail: "Alunos ativos sem matrícula ativa",
            action: "Revisar a situação e oferecer uma nova matrícula",
            href: "/students?status=active&segment=without_plan",
            icon: UserMinus,
            iconClass: "bg-blue-50 text-blue-600",
            valueClass: "text-blue-700",
            roles: ["manager", "reception", "commercial"],
        },
        {
            title: "Sem check-in recente",
            value: summary.studentsWithoutRecentCheckInCount,
            detail: "Nenhum acesso registrado nos últimos 30 dias",
            action: "Identificar ausência e iniciar contato preventivo",
            href: "/students?status=active&segment=without_recent_checkin",
            icon: UserRoundX,
            iconClass: "bg-cyan-50 text-cyan-700",
            valueClass: "text-cyan-800",
            roles: ["manager", "reception", "instructor", "commercial"],
        },
        {
            title: "Saúde do aluno em risco",
            value: summary.studentsAtRiskCount,
            detail: "Score abaixo de 40 com fatores explicáveis",
            action: "Abrir segmento e tratar os fatores de risco",
            href: "/students?status=active&segment=at_risk",
            icon: HeartPulse,
            iconClass: "bg-rose-50 text-rose-600",
            valueClass: "text-rose-700",
            roles: ["manager", "reception", "instructor", "commercial"],
        },
    ];

    return (
        <section className={variant === "canvas" ? "mt-12 border-y border-slate-200/80 py-8" : "mt-6 overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-white shadow-[0_18px_45px_-32px_rgba(15,23,42,0.3)]"}>
            <div className={variant === "canvas" ? "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between" : "flex flex-col gap-4 border-b border-slate-200/80 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"}>
                <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-orange-600">
                        Prioridades operacionais
                    </p>
                    <h2 className="mt-2 text-lg font-black text-slate-950">
                        Requer atenção
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Pendências reais com causa conhecida e próxima ação definida.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadAttention}
                    disabled={loading}
                    className="flex h-10 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    Atualizar
                </button>
            </div>

            {loading ? (
                <div className="grid gap-4 p-5 md:grid-cols-3 sm:p-6" aria-label="Carregando prioridades operacionais" aria-busy="true">
                    {[1, 2, 3].map((item) => (
                        <div key={item} className="h-44 rounded-2xl border border-slate-200 p-5">
                            <div className="flex justify-between"><SkeletonBlock className="h-9 w-9 rounded-xl" /><SkeletonBlock className="h-6 w-16 rounded-full" /></div>
                            <SkeletonBlock className="mt-5 h-3 w-28" />
                            <SkeletonBlock className="mt-3 h-5 w-36 max-w-full" />
                            <SkeletonBlock className="mt-3 h-3 w-full" />
                            <SkeletonBlock className="mt-2 h-3 w-4/5" />
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="p-8 text-center">
                    <AlertTriangle className="mx-auto text-red-400" />
                    <p className="mt-3 font-semibold text-red-700">
                        {permissionDenied
                            ? "Seu usuário não possui permissão para consultar estas prioridades."
                            : "Não foi possível carregar as prioridades operacionais."}
                    </p>
                    {!permissionDenied && (
                        <button
                            type="button"
                            onClick={loadAttention}
                            className="mt-3 text-sm font-bold text-red-600 underline underline-offset-4"
                        >
                            Tentar novamente
                        </button>
                    )}
                </div>
            ) : (
                <div className={variant === "canvas" ? "pt-7" : "p-5 sm:p-6"}>
                    {totalAttention === 0 && (
                        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm font-semibold text-emerald-800">
                            <ShieldCheck size={20} />
                            Nenhuma prioridade disponível para esta visão requer ação agora.
                        </div>
                    )}

                    <div className={variant === "canvas" ? "grid border-t border-slate-200/80 md:grid-cols-2 lg:grid-cols-3" : "grid gap-4 md:grid-cols-2 lg:grid-cols-3"}>
                        {items.filter((item) => item.roles.includes(role)).map((item) => {
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.title}
                                    to={item.href}
                                    className={variant === "canvas" ? "group flex h-full min-h-[250px] min-w-0 flex-col border-b border-slate-200/80 px-6 py-7 transition hover:bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-500 md:border-r md:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(3n)]:border-r-0" : "group flex h-full min-h-[250px] min-w-0 flex-col rounded-2xl border border-slate-200 bg-slate-50/60 p-6 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.iconClass}`}>
                                            <Icon size={19} />
                                        </div>
                                        <ArrowUpRight size={17} className="text-slate-400 transition group-hover:text-blue-600" />
                                    </div>
                                    <p className="mt-4 flex min-h-8 items-start text-xs font-bold uppercase leading-4 tracking-[0.08em] text-slate-500">
                                        {item.title}
                                    </p>
                                    <p className={`mt-2 text-2xl font-black ${item.valueClass}`}>
                                        {item.value.toLocaleString("pt-BR")}
                                    </p>
                                    <p className="mt-1 min-h-10 pb-4 text-xs font-medium leading-5 text-slate-500">
                                        {item.detail}
                                    </p>
                                    <p className="mt-auto border-t border-slate-200 pt-4 text-sm font-semibold leading-5 text-slate-700 group-hover:text-blue-700">
                                        {item.action}
                                    </p>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </section>
    );
}
