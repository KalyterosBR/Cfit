import { useCallback, useEffect, useState } from "react";
import { Activity, AlertTriangle, DollarSign, Users } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import DashboardLayout from "@/layouts/DashboardLayout";
import { getDashboardCheckInSummary } from "@/features/students/services/checkin.service";
import { getDashboardFinancialSummary } from "@/features/students/services/financial.service";
import { getDashboardStudentSummary, getStudentHealthSummary } from "@/features/students/services/student.service";

function period() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }
type ReportData = { revenue: string; checkins: number; active: number; risk: number; attention: number; growth: string | null };

export default function Reports() {
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const load = useCallback(async () => { try { setLoading(true); setError(false); const [financial, checkins, students, health] = await Promise.all([getDashboardFinancialSummary(period()), getDashboardCheckInSummary(period()), getDashboardStudentSummary(period()), getStudentHealthSummary()]); setData({ revenue: financial.monthly_revenue, growth: financial.growth_percentage, checkins: checkins.period_count, active: students.active_count, risk: health.risk_count, attention: health.attention_count }); } catch (requestError) { console.error(requestError); setError(true); } finally { setLoading(false); } }, []);
    useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);
    const reports = data ? [
        { question: "Qual é a receita do mês?", value: Number(data.revenue).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), detail: data.growth === null ? "Sem período comparável" : `${Number(data.growth) > 0 ? "+" : ""}${Number(data.growth).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% sobre o período anterior`, icon: DollarSign, color: "text-emerald-600 bg-emerald-50" },
        { question: "Quantos alunos estão ativos?", value: data.active.toLocaleString("pt-BR"), detail: "Base ativa no fechamento do mês", icon: Users, color: "text-blue-600 bg-blue-50" },
        { question: "Qual foi a frequência no mês?", value: `${data.checkins.toLocaleString("pt-BR")} check-ins`, detail: "Acessos reais registrados", icon: Activity, color: "text-cyan-700 bg-cyan-50" },
        { question: "Quantos alunos exigem retenção?", value: `${data.risk} em risco`, detail: `${data.attention} aluno(s) requerem atenção`, icon: AlertTriangle, color: "text-orange-600 bg-orange-50" },
    ] : [];
    return <DashboardLayout><PageHeader title="Relatórios" subtitle="Respostas gerenciais calculadas a partir dos dados operacionais reais." />{loading ? <div className="grid gap-5 md:grid-cols-2">{[1,2,3,4].map(i => <div key={i} className="h-44 animate-pulse rounded-2xl bg-white" />)}</div> : error ? <div className="rounded-2xl border border-red-200 bg-white p-10 text-center text-red-700"><p>Não foi possível calcular os relatórios.</p><button type="button" onClick={load} className="mt-3 font-bold underline">Tentar novamente</button></div> : <div className="grid gap-5 md:grid-cols-2">{reports.map(({ icon: Icon, ...item }) => <article key={item.question} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.color}`}><Icon size={20} /></div><p className="mt-5 text-sm font-bold text-slate-500">{item.question}</p><p className="mt-2 text-3xl font-black text-slate-950">{item.value}</p><p className="mt-2 text-sm text-slate-500">{item.detail}</p></article>)}</div>}</DashboardLayout>;
}
