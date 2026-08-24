import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Download,
  DollarSign,
  Star,
  Users,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import DashboardLayout from "@/layouts/DashboardLayout";
import { getDashboardCheckInSummary } from "@/features/students/services/checkin.service";
import { getDashboardFinancialSummary } from "@/features/students/services/financial.service";
import {
  getDashboardStudentSummary,
  getStudentHealthSummary,
} from "@/features/students/services/student.service";
import { Api } from "@/services/http";

function period() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
type ReportData = {
  revenue: string;
  checkins: number;
  active: number;
  risk: number;
  attention: number;
  growth: string | null;
};
type ManagementData = {
  period: string;
  scope: { unit_name: string; basis: string };
  revenue_by_plan: Array<{
    enrollment__plan__name: string;
    total: string;
    payments: number;
  }>;
  overdue_by_plan: Array<{
    enrollment__plan__name: string;
    total: string;
    charges: number;
  }>;
  average_checkins_per_student: number;
  students_with_checkins: number;
  cancellations: number;
  active_enrollments: number;
  renewal_rate: number;
  average_stay_days: number;
  cancellation_reasons: Array<{ cancellation_reason: string; total: number }>;
  lead_conversion_rate: number;
  class_occupancy_rate: number;
};
type RetentionItem = {
  student: string;
  student_name: string;
  phone: string | null;
  score: number;
  status: string;
  factors: Array<{ label: string }>;
  latest_interaction: { next_action: string; status: string } | null;
};

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState(period());
  const [favorites, setFavorites] = useState<string[]>(() =>
    JSON.parse(localStorage.getItem("cfit_report_favorites") ?? "[]"),
  );
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [management, setManagement] = useState<ManagementData | null>(null);
  const [retention, setRetention] = useState<RetentionItem[]>([]);
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const [
        financial,
        checkins,
        students,
        health,
        managementResponse,
        retentionResponse,
      ] = await Promise.all([
        getDashboardFinancialSummary(selectedPeriod),
        getDashboardCheckInSummary(selectedPeriod),
        getDashboardStudentSummary(selectedPeriod),
        getStudentHealthSummary(),
        Api.get<ManagementData>("/reports/management/", {
          params: { period: selectedPeriod },
        }),
        Api.get<RetentionItem[]>("/students/retention-queue/"),
      ]);
      setData({
        revenue: financial.monthly_revenue,
        growth: financial.growth_percentage,
        checkins: checkins.period_count,
        active: students.active_count,
        risk: health.risk_count,
        attention: health.attention_count,
      });
      setManagement(managementResponse.data);
      setRetention(retentionResponse.data);
    } catch (requestError) {
      console.error(requestError);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const reports = data
    ? [
        {
          question: "Qual é a receita do mês?",
          value: Number(data.revenue).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          }),
        detail:
            data.growth === null
              ? "Sem período comparável"
            : `${Number(data.growth) > 0 ? "+" : ""}${Number(data.growth).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% sobre o período anterior`,
        formula: "Soma das cobranças pagas pela data de recebimento",
        source: "Financeiro · caixa",
          icon: DollarSign,
          color: "text-emerald-600 bg-emerald-50",
        },
        {
          question: "Quantos alunos estão ativos?",
          value: data.active.toLocaleString("pt-BR"),
        detail: "Base ativa no fechamento do mês",
        formula: "Cadastros ativos na data final do período",
        source: "Alunos",
          icon: Users,
          color: "text-blue-600 bg-blue-50",
        },
        {
          question: "Qual foi a frequência no mês?",
          value: `${data.checkins.toLocaleString("pt-BR")} check-ins`,
        detail: "Acessos reais registrados",
        formula: "Contagem de acessos liberados no período",
        source: "Check-ins",
          icon: Activity,
          color: "text-cyan-700 bg-cyan-50",
        },
        {
          question: "Quantos alunos exigem retenção?",
          value: `${data.risk} em risco`,
        detail: `${data.attention} aluno(s) requerem atenção`,
        formula: "Health Score abaixo de 40; atenção entre 40 e 69",
        source: "Health Score compartilhado",
          icon: AlertTriangle,
          color: "text-orange-600 bg-orange-50",
        },
      ]
    : [];
  function toggleFavorite(question: string) {
    const next = favorites.includes(question)
      ? favorites.filter((item) => item !== question)
      : [...favorites, question];
    setFavorites(next);
    localStorage.setItem("cfit_report_favorites", JSON.stringify(next));
  }
  function exportCsv() {
    const rows = [
      ["Pergunta", "Valor", "Detalhe"],
      ...reports.map((item) => [item.question, item.value, item.detail]),
    ];
    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(";"),
      )
      .join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" }),
    );
    link.download = `cfit-relatorios-${selectedPeriod}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
  async function registerContact(item: RetentionItem) {
    const notes = window.prompt(`Registre o contato com ${item.student_name}:`);
    if (!notes) return;
    const nextAction = window.prompt(
      "Qual é a próxima ação?",
      "Acompanhar retorno",
    );
    await Api.post(`/students/${item.student}/interactions/`, {
      interaction_type: "whatsapp",
      status: "completed",
      notes,
      next_action: nextAction || "",
    });
    await load();
  }
  return (
    <DashboardLayout>
      <PageHeader
        title="Relatórios"
        subtitle="Respostas gerenciais calculadas a partir dos dados operacionais reais."
      />
      <div className="mb-5 flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <label className="text-xs font-bold text-slate-600">
          Período
          <input
            type="month"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="ml-3 h-10 rounded-xl border border-slate-200 px-3"
          />
        </label>
        <button
          type="button"
          disabled={!data}
          onClick={exportCsv}
          className="ml-auto flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 disabled:opacity-50"
        >
          <Download size={16} /> Exportar CSV
        </button>
      </div>
      {loading ? (
        <div className="grid gap-5 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-white p-10 text-center text-red-700">
          <p>Não foi possível calcular os relatórios.</p>
          <button
            type="button"
            onClick={load}
            className="mt-3 font-bold underline"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2">
            {reports
              .sort(
                (a, b) =>
                  Number(favorites.includes(b.question)) -
                  Number(favorites.includes(a.question)),
              )
              .map(({ icon: Icon, ...item }) => (
                <article
                  key={item.question}
                  className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => toggleFavorite(item.question)}
                    aria-label="Favoritar relatório"
                    className={`absolute right-5 top-5 ${favorites.includes(item.question) ? "text-amber-500" : "text-slate-300"}`}
                  >
                    <Star
                      size={18}
                      fill={
                        favorites.includes(item.question)
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.color}`}
                  >
                    <Icon size={20} />
                  </div>
                  <p className="mt-5 text-sm font-bold text-slate-500">
                    {item.question}
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {item.value}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">{item.detail}</p>
                  <details className="mt-4 text-xs text-slate-500"><summary className="cursor-pointer font-bold text-blue-600">Como é calculado</summary><p className="mt-2">Fórmula: {item.formula}</p><p>Fonte: {item.source} · período {selectedPeriod}</p></details>
                </article>
              ))}
          </div>
          {management && (
            <div className="mt-6 grid gap-5 xl:grid-cols-2">
              <section className="rounded-2xl border bg-white p-6">
                <h2 className="font-black">Receita por plano</h2>
                <div className="mt-4 divide-y">
                  {management.revenue_by_plan.map((item) => (
                    <div
                      key={item.enrollment__plan__name}
                      className="flex justify-between py-3 text-sm"
                    >
                      <span>{item.enrollment__plan__name}</span>
                      <strong>
                        {Number(item.total).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </strong>
                    </div>
                  ))}
                </div>
              </section>
              <section className="rounded-2xl border bg-white p-6">
                <h2 className="font-black">Inadimplência por plano</h2>
                <div className="mt-4 divide-y">
                  {management.overdue_by_plan.map((item) => (
                    <div
                      key={item.enrollment__plan__name}
                      className="flex justify-between py-3 text-sm"
                    >
                      <span>
                        {item.enrollment__plan__name} · {item.charges}{" "}
                        cobrança(s)
                      </span>
                      <strong className="text-red-600">
                        {Number(item.total).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </strong>
                    </div>
                  ))}
                </div>
              </section>
              <section className="rounded-2xl border bg-white p-6 xl:col-span-2">
                <h2 className="font-black">Operação no período</h2>
                <dl className="mt-4 grid gap-4 sm:grid-cols-4">
                  <div>
                    <dt className="text-xs text-slate-500">Frequência média</dt>
                    <dd className="text-2xl font-black">
                      {management.average_checkins_per_student}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">
                      Alunos com acesso
                    </dt>
                    <dd className="text-2xl font-black">
                      {management.students_with_checkins}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">
                      Matrículas ativas
                    </dt>
                    <dd className="text-2xl font-black">
                      {management.active_enrollments}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Cancelamentos</dt>
                    <dd className="text-2xl font-black">
                      {management.cancellations}
                    </dd>
                  </div>
                  <div><dt className="text-xs text-slate-500">Taxa de renovação</dt><dd className="text-2xl font-black">{management.renewal_rate}%</dd></div>
                  <div><dt className="text-xs text-slate-500">Permanência média</dt><dd className="text-2xl font-black">{management.average_stay_days} dias</dd></div>
                  <div><dt className="text-xs text-slate-500">Ocupação de turmas</dt><dd className="text-2xl font-black">{management.class_occupancy_rate}%</dd></div>
                  <div><dt className="text-xs text-slate-500">Conversão comercial</dt><dd className="text-2xl font-black">{management.lead_conversion_rate}%</dd></div>
                </dl>
              </section>
            </div>
          )}
          <section className="mt-6 rounded-2xl border bg-white p-6">
            <h2 className="font-black">Fila de retenção e relacionamento</h2>
            <p className="mt-1 text-sm text-slate-500">
              Alunos em risco ou atenção, com fatores explicáveis e próxima
              ação.
            </p>
            <div className="mt-4 divide-y">
              {retention.map((item) => (
                <article
                  key={item.student}
                  className="flex flex-col gap-3 py-4 md:flex-row md:items-center"
                >
                  <div className="flex-1">
                    <p className="font-bold">
                      {item.student_name} · score {item.score}
                    </p>
                    <p className="text-sm text-slate-500">
                      {item.factors.map((factor) => factor.label).join(" · ")}
                    </p>
                    {item.latest_interaction?.next_action && (
                      <p className="mt-1 text-xs font-bold text-blue-600">
                        Próxima ação: {item.latest_interaction.next_action}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => registerContact(item)}
                    className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white"
                  >
                    Registrar contato
                  </button>
                </article>
              ))}
              {retention.length === 0 && (
                <p className="py-6 text-sm text-slate-500">
                  Nenhum aluno na fila de retenção.
                </p>
              )}
            </div>
          </section>
        </>
      )}
    </DashboardLayout>
  );
}
