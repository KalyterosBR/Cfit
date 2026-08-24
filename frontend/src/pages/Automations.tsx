import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Pause, Play, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { EmptyState, ErrorState, SkeletonState } from "@/components/AsyncState";
import PageHeader from "@/components/PageHeader";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Api } from "@/services/http";

type Rule = {
  id: string;
  name: string;
  event_label: string;
  action_description: string;
  priority: string;
  active: boolean;
  sla_hours: number;
  paused_at: string | null;
};
type Execution = {
  id: string;
  rule: string;
  rule_name: string;
  explanation: string;
  operational_status: string;
  priority: string;
  resolution_notes: string;
  mode: "test" | "simulation" | "real";
  due_at: string | null;
  attempts: number;
  last_error: string;
  created_at: string;
};
type Page<T> = { results: T[] };
const events = [
  ["overdue_charge", "Cobrança vencida"],
  ["recurring_rejected", "Recorrência rejeitada"],
  ["prolonged_absence", "Ausência prolongada"],
  ["plan_ending", "Plano próximo do fim"],
  ["birthday", "Aniversário"],
  ["visit_without_return", "Visita sem retorno"],
];

export default function Automations() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [form, setForm] = useState({
    name: "",
    event_type: events[0][0],
    action_description: "",
    priority: "medium",
    sla_hours: 24,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setError(false);
      const [rulesResponse, executionsResponse] = await Promise.all([
        Api.get<Page<Rule>>("/automations/rules/"),
        Api.get<Page<Execution>>("/automations/executions/"),
      ]);
      setRules(rulesResponse.data.results);
      setExecutions(executionsResponse.data.results);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function create(event: FormEvent) {
    event.preventDefault();
    try {
      await Api.post("/automations/rules/", form);
      setForm({ ...form, name: "", action_description: "" });
      await load();
      toast.success("Automação criada e auditada.");
    } catch {
      toast.error("Não foi possível criar a automação.");
    }
  }
  async function trigger(rule: Rule, mode: "test" | "simulation") {
    try {
      await Api.post(`/automations/rules/${rule.id}/trigger/`, { mode });
      await load();
      toast.success(
        mode === "test"
          ? "Teste registrado sem execução operacional."
          : "Simulação registrada sem efeito externo.",
      );
    } catch {
      toast.error("Não foi possível testar a automação.");
    }
  }
  async function processEvents() {
    try {
      const response = await Api.post<{ created_count: number }>(
        "/automations/rules/process-events/",
        {},
      );
      await load();
      toast.success(
        `${response.data.created_count} nova(s) execução(ões) reais criadas.`,
      );
    } catch {
      toast.error("Não foi possível processar os eventos.");
    }
  }
  async function pause(rule: Rule) {
    await Api.post(`/automations/rules/${rule.id}/pause/`, {
      reason: rule.paused_at ? "Retomada operacional" : "Pausa operacional",
    });
    await load();
  }
  async function updateExecution(item: Execution, operationalStatus: string) {
    const notes =
      operationalStatus === "completed"
        ? window.prompt("Como esta ocorrência foi resolvida?")
        : "";
    if (operationalStatus === "completed" && !notes) return;
    await Api.post(`/automations/rules/${item.rule}/resolve-execution/`, {
      execution: item.id,
      operational_status: operationalStatus,
      resolution_notes: notes,
    });
    await load();
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Automações"
        subtitle="Teste, simulação e execução real separados, com responsável, SLA e histórico."
        actions={
          <button
            type="button"
            onClick={processEvents}
            className="flex h-11 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-700"
          >
            <Play size={16} /> Processar eventos reais
          </button>
        }
      />
      <form
        onSubmit={create}
        className="grid gap-3 rounded-2xl border bg-white p-5 shadow-sm md:grid-cols-5"
      >
        <input
          required
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder="Nome da automação"
          className="h-11 rounded-xl border px-3"
        />
        <select
          value={form.event_type}
          onChange={(event) =>
            setForm({ ...form, event_type: event.target.value })
          }
          className="h-11 rounded-xl border px-3"
        >
          {events.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={form.priority}
          onChange={(event) =>
            setForm({ ...form, priority: event.target.value })
          }
          className="h-11 rounded-xl border px-3"
        >
          <option value="low">Prioridade baixa</option>
          <option value="medium">Prioridade média</option>
          <option value="high">Prioridade alta</option>
          <option value="critical">Prioridade crítica</option>
        </select>
        <input
          required
          value={form.action_description}
          onChange={(event) =>
            setForm({ ...form, action_description: event.target.value })
          }
          placeholder="Próxima ação"
          className="h-11 rounded-xl border px-3"
        />
        <label className="text-xs font-bold text-slate-600">
          SLA (horas)
          <input
            type="number"
            min={1}
            max={720}
            value={form.sla_hours}
            onChange={(event) =>
              setForm({ ...form, sla_hours: Number(event.target.value) })
            }
            className="mt-1 h-8 w-full rounded-lg border px-2"
          />
        </label>
        <button className="h-11 rounded-xl bg-blue-600 font-bold text-white md:col-span-5">
          Criar automação
        </button>
      </form>
      {loading ? (
        <div className="mt-5">
          <SkeletonState />
        </div>
      ) : error ? (
        <div className="mt-5">
          <ErrorState onRetry={load} />
        </div>
      ) : (
        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <section className="rounded-2xl border bg-white p-5">
            <h2 className="flex items-center gap-2 font-black">
              <Zap size={18} /> Regras
            </h2>
            <div className="mt-4 space-y-3">
              {rules.map((rule) => (
                <article
                  key={rule.id}
                  className={`rounded-xl border p-4 ${rule.paused_at ? "bg-slate-50 opacity-70" : "bg-white"}`}
                >
                  <div className="flex justify-between gap-3">
                    <p className="font-bold">{rule.name}</p>
                    <span className="text-xs font-bold text-slate-500">
                      SLA {rule.sla_hours}h
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    Quando: {rule.event_label} · prioridade {rule.priority}
                  </p>
                  <p className="mt-1 text-sm">
                    Então: {rule.action_description}
                  </p>
                  <div className="mt-3 flex gap-3">
                    <button
                      onClick={() => trigger(rule, "test")}
                      className="text-sm font-bold text-blue-600"
                    >
                      Testar
                    </button>
                    <button
                      onClick={() => trigger(rule, "simulation")}
                      className="text-sm font-bold text-violet-600"
                    >
                      Simular
                    </button>
                    <button
                      onClick={() => pause(rule)}
                      className="flex items-center gap-1 text-sm font-bold text-slate-500"
                    >
                      <Pause size={14} />
                      {rule.paused_at ? "Retomar" : "Pausar"}
                    </button>
                  </div>
                </article>
              ))}
              {rules.length === 0 && (
                <EmptyState
                  label="Nenhuma regra"
                  detail="Crie a primeira automação para iniciar."
                />
              )}
            </div>
          </section>
          <section className="rounded-2xl border bg-white p-5">
            <h2 className="font-black">Fila e histórico</h2>
            <div className="mt-4 space-y-3">
              {executions.map((item) => (
                <article key={item.id} className="rounded-xl bg-slate-50 p-4">
                  <div className="flex justify-between gap-2">
                    <p className="text-sm font-bold">{item.rule_name}</p>
                    <span
                      className={`text-[10px] font-black uppercase ${item.mode === "real" ? "text-blue-600" : "text-violet-600"}`}
                    >
                      {item.mode === "real"
                        ? "EXECUÇÃO REAL"
                        : item.mode === "test"
                          ? "TESTE"
                          : "SIMULAÇÃO"}{" "}
                      · {item.operational_status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.explanation}
                  </p>
                  {item.last_error && (
                    <p className="mt-2 text-xs text-red-600">
                      Falha: {item.last_error}
                    </p>
                  )}
                  {item.resolution_notes && (
                    <p className="mt-2 text-xs text-emerald-700">
                      Resolução: {item.resolution_notes}
                    </p>
                  )}
                  <div className="mt-3 flex gap-3">
                    {item.operational_status === "pending" && (
                      <button
                        onClick={() => updateExecution(item, "in_progress")}
                        className="text-xs font-bold text-blue-600"
                      >
                        Assumir
                      </button>
                    )}
                    {item.operational_status !== "completed" && (
                      <button
                        onClick={() => updateExecution(item, "completed")}
                        className="text-xs font-bold text-emerald-700"
                      >
                        Concluir
                      </button>
                    )}
                  </div>
                  <time className="mt-2 block text-xs text-slate-400">
                    Criada {new Date(item.created_at).toLocaleString("pt-BR")}
                    {item.due_at
                      ? ` · prazo ${new Date(item.due_at).toLocaleString("pt-BR")}`
                      : ""}{" "}
                    · {item.attempts} tentativa(s)
                  </time>
                </article>
              ))}
              {executions.length === 0 && (
                <EmptyState
                  label="Fila vazia"
                  detail="Nenhuma execução foi registrada."
                />
              )}
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}
