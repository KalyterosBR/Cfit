import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Download,
  DollarSign,
  Save,
  Star,
  Trash2,
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
import { Link, useSearchParams } from "react-router-dom";
import { useSession } from "@/features/auth/access-control";
import { getReportsDataAccess } from "@/features/auth/access-policy";
import { useAppDialog } from "@/components/AppDialog";

function period() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthRange(value: string) {
  const [year, month] = value.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();

  return {
    from: `${value}-01`,
    to: `${value}-${String(lastDay).padStart(2, "0")}`,
  };
}
type ReportData = {
  revenue: string | null;
  checkins: number | null;
  active: number | null;
  risk: number | null;
  attention: number | null;
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
  schedule_completion_rate:number;
  workout_adherence:number;
  workout_sessions_completed:number;
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
type SavedReportView = {
  id: string;
  name: string;
  period: string;
  favorite_questions: string[];
  is_default: boolean;
  scope: "personal" | "unit" | "academy";
  owner_name: string;
  editable: boolean;
};

export default function Reports() {
  const dialog = useAppDialog();
  const session = useSession();
  const reportAccess = getReportsDataAccess(session.capabilities);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPeriod, setSelectedPeriod] = useState(() => searchParams.get("period") || period());
  const [favorites, setFavorites] = useState<string[]>([]);
  const [savedViews, setSavedViews] = useState<SavedReportView[]>([]);
  const [selectedView, setSelectedView] = useState("");
  const [viewScope, setViewScope] = useState<SavedReportView["scope"]>("personal");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [managementLoading, setManagementLoading] = useState(true);
  const [managementError, setManagementError] = useState(false);
  const [retentionLoading, setRetentionLoading] = useState(true);
  const [retentionError, setRetentionError] = useState(false);
  const [management, setManagement] = useState<ManagementData | null>(null);
  const [retention, setRetention] = useState<RetentionItem[]>([]);
  useEffect(() => {
    const next = new URLSearchParams(searchParams); next.set("period", selectedPeriod);
    if (next.toString() !== searchParams.toString()) setSearchParams(next, { replace: true });
  }, [searchParams, selectedPeriod, setSearchParams]);
  useEffect(() => {
    Api.get<SavedReportView[]>("/users/report-views/").then(({ data: views }) => {
      setSavedViews(views);
      const defaultView = views.find((view) => view.is_default && view.editable);
      if (defaultView) {
        setSelectedView(defaultView.id);
        setSelectedPeriod(defaultView.period);
        setFavorites(defaultView.favorite_questions);
        setViewScope(defaultView.scope);
      }
    }).catch(() => undefined);
  }, []);
  const loadSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const [financial, checkins, students, health] = await Promise.all([
        reportAccess.finance ? getDashboardFinancialSummary(selectedPeriod) : Promise.resolve(null),
        reportAccess.checkins ? getDashboardCheckInSummary(selectedPeriod) : Promise.resolve(null),
        reportAccess.students ? getDashboardStudentSummary(selectedPeriod) : Promise.resolve(null),
        reportAccess.students ? getStudentHealthSummary() : Promise.resolve(null),
      ]);
      setData({
        revenue: financial?.monthly_revenue ?? null,
        growth: financial?.growth_percentage ?? null,
        checkins: checkins?.period_count ?? null,
        active: students?.active_count ?? null,
        risk: health?.risk_count ?? null,
        attention: health?.attention_count ?? null,
      });
    } catch (requestError) {
      console.error(requestError);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [reportAccess.checkins, reportAccess.finance, reportAccess.students, selectedPeriod]);
  const loadManagement = useCallback(async () => {
    try {
      setManagementLoading(true); setManagementError(false);
      setManagement((await Api.get<ManagementData>("/reports/management/", { params: { period: selectedPeriod } })).data);
    } catch { setManagementError(true); } finally { setManagementLoading(false); }
  }, [selectedPeriod]);
  const loadRetention = useCallback(async () => {
    try {
      setRetentionLoading(true); setRetentionError(false);
      setRetention((await Api.get<RetentionItem[]>("/students/retention-queue/")).data);
    } catch { setRetentionError(true); } finally { setRetentionLoading(false); }
  }, []);
  const load = useCallback(async () => { await Promise.allSettled([loadSummary(), loadManagement(), loadRetention()]); }, [loadManagement, loadRetention, loadSummary]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const reports = data
    ? (() => {
      const range = monthRange(selectedPeriod);
      return [
        ...(data.revenue !== null ? [{
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
        scope: `Período ${selectedPeriod}`,
          originPath: `/finance?paid_date_from=${range.from}&paid_date_to=${range.to}`,
          originLabel: "Abrir recebimentos do período",
          icon: DollarSign,
          color: "text-emerald-600 bg-emerald-50",
        }] : []),
        ...(data.active !== null ? [{
          question: "Quantos alunos estão ativos?",
          value: data.active.toLocaleString("pt-BR"),
        detail: "Base ativa no fechamento do mês",
        formula: "Cadastros ativos na data final do período",
        source: "Alunos",
        scope: `Fechamento de ${selectedPeriod}`,
          originPath: "/students?status=active",
          originLabel: "Abrir base ativa atual",
          icon: Users,
          color: "text-blue-600 bg-blue-50",
        }] : []),
        ...(data.checkins !== null ? [{
          question: "Qual foi a frequência no mês?",
          value: `${data.checkins.toLocaleString("pt-BR")} check-ins`,
        detail: "Acessos reais registrados",
        formula: "Contagem de acessos liberados no período",
        source: "Check-ins",
        scope: `Período ${selectedPeriod}`,
          originPath: `/checkins?from=${range.from}&to=${range.to}`,
          originLabel: "Abrir acessos do período",
          icon: Activity,
          color: "text-cyan-700 bg-cyan-50",
        }] : []),
        ...(data.risk !== null && data.attention !== null ? [{
          question: "Quantos alunos exigem retenção?",
          value: `${data.risk} em risco`,
        detail: `${data.attention} aluno(s) requerem atenção · estado atual`,
        formula: "Health Score abaixo de 40; atenção entre 40 e 69",
        source: "Health Score compartilhado",
        scope: "Estado atual da base, independente do período histórico",
          originPath: "/students?segment=at_risk",
          originLabel: "Abrir alunos em risco",
          icon: AlertTriangle,
          color: "text-orange-600 bg-orange-50",
        }] : []),
      ];
    })()
    : [];
  function toggleFavorite(question: string) {
    const next = favorites.includes(question)
      ? favorites.filter((item) => item !== question)
      : [...favorites, question];
    setFavorites(next);
  }
  async function saveCurrentView() {
    const name = await dialog.prompt({ title: "Salvar visão gerencial", description: "Dê um nome que ajude a identificar este conjunto de período, escopo e indicadores.", label: "Nome da visão", confirmLabel: "Continuar" });
    if (!name?.trim()) return;
    const makeDefault = await dialog.confirm({ title: "Usar como visão padrão?", description: "Esta visão será aplicada automaticamente quando você abrir Relatórios.", confirmLabel: "Usar como padrão", cancelLabel: "Salvar sem definir" });
    const { data: view } = await Api.post<SavedReportView>("/users/report-views/", {
      name: name.trim(),
      period: selectedPeriod,
      favorite_questions: favorites,
      is_default: makeDefault,
      scope: viewScope,
    });
    setSavedViews((current) => [...current.map((item) => ({ ...item, is_default: makeDefault && item.editable ? false : item.is_default })), view]);
    setSelectedView(view.id);
  }
  function applyView(id: string) {
    setSelectedView(id);
    const view = savedViews.find((item) => item.id === id);
    if (!view) return;
    setSelectedPeriod(view.period);
    setFavorites(view.favorite_questions);
    setViewScope(view.scope);
  }
  async function removeSelectedView() {
    if (!selectedView) return;
    const view = savedViews.find((item) => item.id === selectedView);
    if (!view?.editable || !await dialog.confirm({ title: "Excluir visão gerencial", description: `A visão “${view.name}” será removida. Os dados dos relatórios não serão alterados.`, confirmLabel: "Excluir visão", tone: "danger" })) return;
    await Api.delete(`/users/report-views/${view.id}/`);
    setSavedViews((current) => current.filter((item) => item.id !== selectedView));
    setSelectedView("");
  }
  function exportCsv() {
    const managementRows = management ? [
      ["Receita por plano", "Plano", "Total", "Pagamentos"],
      ...management.revenue_by_plan.map(item => ["Receita por plano", item.enrollment__plan__name, item.total, item.payments]),
      ["Inadimplência por plano", "Plano", "Total", "Cobranças"],
      ...management.overdue_by_plan.map(item => ["Inadimplência por plano", item.enrollment__plan__name, item.total, item.charges]),
    ] : [];
    const rows = [
      ["Relatório Cfit", `Período ${selectedPeriod}`, management?.scope.unit_name ?? "Escopo da sessão", management?.scope.basis ?? ""],
      ["Pergunta", "Valor", "Detalhe", "Fórmula", "Fonte", "Escopo"],
      ...reports.map((item) => [item.question, item.value, item.detail, item.formula, item.source, item.scope]),
      ...managementRows,
      ["Fila de retenção", "Aluno", "Score", "Situação"],
      ...retention.map(item => ["Fila de retenção", item.student_name, item.score, item.status]),
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
    const notes = await dialog.prompt({ title: "Registrar contato", description: `Registre o resultado do contato com ${item.student_name}.`, label: "Resumo do contato", confirmLabel: "Continuar" });
    if (!notes) return;
    const nextAction = await dialog.prompt({ title: "Próxima ação", description: "Defina o próximo passo para manter a tratativa clara.", label: "Próxima ação", initialValue: "Acompanhar retorno", required: false, confirmLabel: "Registrar contato" });
    if (nextAction === null) return;
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
        eyebrow="Inteligência gerencial"
        context="Perguntas, evidências e decisão"
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
        <label className="text-xs font-bold text-slate-600">
          Visão salva
          <select
            value={selectedView}
            onChange={(event) => applyView(event.target.value)}
            className="ml-3 h-10 min-w-44 rounded-xl border border-slate-200 px-3"
          >
            <option value="">Visão atual</option>
            {savedViews.map((view) => (
              <option key={view.id} value={view.id}>
                {view.name}{view.is_default ? " · padrão" : ""}{!view.editable ? ` · ${view.owner_name}` : ""}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={saveCurrentView}
          className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700"
        >
          <Save size={16} /> Salvar visão
        </button>
        <label className="text-xs font-bold text-slate-600">
          Compartilhar
          <select value={viewScope} onChange={(event) => setViewScope(event.target.value as SavedReportView["scope"])} className="ml-3 h-10 rounded-xl border border-slate-200 px-3">
            <option value="personal">Somente comigo</option>
            <option value="unit">Unidade atual</option>
            <option value="academy">Toda a academia</option>
          </select>
        </label>
        <button
          type="button"
          disabled={!savedViews.find((view) => view.id === selectedView)?.editable}
          onClick={removeSelectedView}
          aria-label="Excluir visão selecionada"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 disabled:opacity-40"
        >
          <Trash2 size={16} />
        </button>
        <button
          type="button"
          disabled={!data || !management || managementLoading || retentionLoading || managementError || retentionError}
          onClick={exportCsv}
          className="ml-auto flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 disabled:opacity-50"
        >
          <Download size={16} /> Exportar CSV
        </button>
        {management && (
          <p className="w-full text-xs font-semibold text-slate-500">
            Escopo: {management.scope.unit_name} · {management.scope.basis}
            {selectedView ? ` · visão ${viewScope === "personal" ? "pessoal" : viewScope === "unit" ? "da unidade" : "da academia"}` : ""}
          </p>
        )}
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
                  {reportAccess.retentionManage && <button
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
                  </button>}
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
                  <details className="mt-4 text-xs text-slate-500"><summary className="cursor-pointer font-bold text-blue-600">Como é calculado</summary><p className="mt-2">Fórmula: {item.formula}</p><p>Fonte: {item.source}</p><p>Escopo: {item.scope}</p></details>
                  <Link to={item.originPath} className="mt-4 inline-flex text-xs font-bold text-blue-600">{item.originLabel} →</Link>
                </article>
              ))}
          </div>
      )}
          {managementLoading ? <div className="mt-6 h-56 animate-pulse rounded-2xl bg-white" /> : managementError ? <section className="mt-6 rounded-2xl border border-red-200 bg-white p-6"><p className="text-red-700">Não foi possível carregar os indicadores operacionais.</p><button type="button" onClick={loadManagement} className="mt-3 font-bold text-blue-600">Tentar novamente</button></section> : management && (
            <div className="mt-6 grid gap-5 xl:grid-cols-2">
              <section className="rounded-2xl border bg-white p-6">
                <h2 className="font-black">Receita por plano</h2>
                <div className="cfit-record-list mt-4">
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
                <div className="cfit-record-list mt-4">
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
                  <div><dt className="text-xs text-slate-500">Agenda concluída</dt><dd className="text-2xl font-black">{management.schedule_completion_rate}%</dd></div>
                  <div><dt className="text-xs text-slate-500">Aderência aos treinos</dt><dd className="text-2xl font-black">{management.workout_adherence}%</dd></div>
                  <div><dt className="text-xs text-slate-500">Treinos concluídos</dt><dd className="text-2xl font-black">{management.workout_sessions_completed}</dd></div>
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
            {retentionLoading ? <div className="mt-4 h-28 animate-pulse rounded-xl bg-slate-100" /> : retentionError ? <div className="mt-4 text-sm text-red-700">Não foi possível carregar a retenção. <button type="button" onClick={loadRetention} className="font-bold underline">Tentar novamente</button></div> : <div className="cfit-record-list mt-4">
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
            </div>}
          </section>
    </DashboardLayout>
  );
}
