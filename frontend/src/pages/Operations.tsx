import { useCallback, useEffect, useState } from "react";
import { Activity, ClipboardCheck, Mail, Radio, Scale } from "lucide-react";
import toast from "react-hot-toast";

import PageHeader from "@/components/PageHeader";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Api } from "@/services/http";
import { ErrorState, LoadingState } from "@/components/AsyncState";

type Device = {
  id: string;
  name: string;
  identifier: string;
  kind: string;
  unit_name: string;
  active: boolean;
  last_seen_at: string | null;
  status: string;
  status_label: string;
  health: { label: string; detail: string };
  last_latency_ms: number | null;
  firmware_version: string;
  last_error: string;
  provider: string;
};
type Campaign = {
  id: string;
  name: string;
  channel: string;
  segment: string;
  status: string;
  message: string;
};
type Assessment = {
  id: string;
  student: string;
  assessed_at: string;
  weight_kg: string | null;
  height_cm: string | null;
  body_fat_percentage: string | null;
  goal: string;
  blood_pressure: string;
  resting_heart_rate: number | null;
};
type Step = {
  step: string;
  completed: boolean;
  automatic: boolean;
  href: string | null;
};
type Unit = { id: string; name: string };

const labels: Record<string, string> = {
  complete_academy: "Completar dados da academia",
  create_unit: "Cadastrar uma unidade",
  invite_team: "Convidar a equipe",
  create_plan: "Criar o primeiro plano",
  review_dashboard: "Revisar o Dashboard",
  review_permissions: "Revisar permissões",
  configure_access: "Configurar acessos",
  configure_finance: "Configurar financeiro",
  review_automations: "Revisar automações",
  review_retention: "Revisar retenção",
  review_schedule: "Revisar agenda",
  create_student: "Cadastrar aluno",
  create_enrollment: "Matricular aluno",
  register_checkin: "Registrar check-in",
  review_students: "Revisar alunos",
  create_workout: "Criar treino",
  create_assessment: "Criar avaliação",
  review_overdue: "Revisar inadimplentes",
  register_payment: "Registrar pagamento",
  review_cashflow: "Revisar fluxo de caixa",
};

export default function Operations() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [device, setDevice] = useState({
    name: "",
    identifier: "",
    kind: "simulator",
    unit: "",
  });
  const [campaign, setCampaign] = useState({
    name: "",
    channel: "whatsapp",
    segment: "at_risk",
    message: "",
    template_name: "",
    scheduled_at: "",
  });
  const [deliveryProvider, setDeliveryProvider] = useState("sandbox");
  const [assessment, setAssessment] = useState({
    student: "",
    assessed_at: new Date().toISOString().slice(0, 10),
    next_assessment_at: "",
    weight_kg: "",
    height_cm: "",
    body_fat_percentage: "",
    goal: "",
    notes: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const [d, c, a, o, u] = await Promise.all([
        Api.get("/operations/devices/"),
        Api.get("/operations/campaigns/"),
        Api.get("/operations/assessments/"),
        Api.get("/operations/onboarding/"),
        Api.get("/academies/units/"),
      ]);
      setDevices(d.data.results ?? d.data);
      setCampaigns(c.data.results ?? c.data);
      setAssessments(a.data.results ?? a.data);
      setSteps(o.data.steps);
      setUnits(u.data.results ?? u.data);
    } catch {
      setError(true);
      toast.error("Não foi possível carregar a Central operacional.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function createDevice(e: React.FormEvent) {
    e.preventDefault();
    await Api.post("/operations/devices/", device);
    setDevice({ name: "", identifier: "", kind: "simulator", unit: "" });
    toast.success("Dispositivo cadastrado.");
    await load();
  }
  async function createCampaign(e: React.FormEvent) {
    e.preventDefault();
    await Api.post("/operations/campaigns/", {
      ...campaign,
      scheduled_at: campaign.scheduled_at
        ? new Date(campaign.scheduled_at).toISOString()
        : null,
    });
    setCampaign({
      name: "",
      channel: "whatsapp",
      segment: "at_risk",
      message: "",
      template_name: "",
      scheduled_at: "",
    });
    toast.success("Campanha salva sem realizar envios.");
    await load();
  }
  async function prepare(id: string) {
    const response = await Api.post(`/operations/campaigns/${id}/prepare/`, {
      provider: deliveryProvider,
    });
    toast.success(
      `${response.data.audience_count} destinatário(s) preparados; nenhum envio realizado.`,
    );
    await load();
  }
  async function simulate(id: string) {
    const student = window.prompt("ID do aluno desta unidade:");
    if (!student) return;
    const blocked = window.confirm(
      "Simular acesso bloqueado? Clique em Cancelar para liberar.",
    );
    await Api.post(`/operations/devices/${id}/simulate/`, {
      student,
      access_result: blocked ? "blocked" : "allowed",
      block_reason: blocked ? "Bloqueio simulado para validação" : "",
    });
    toast.success("Evento enviado ao monitor de acessos.");
    await load();
  }
  async function diagnose(id: string) {
    const response = await Api.post(`/operations/devices/${id}/diagnose/`);
    toast[response.data.success ? "success" : "error"](response.data.message);
    await load();
  }
  async function dispatch(id: string) {
    const response = await Api.post(`/operations/campaigns/${id}/dispatch/`);
    toast.success(
      `${response.data.deliveries.filter((item: { status: string }) => item.status === "sent").length} entrega(s) processadas.`,
    );
    await load();
  }
  async function createAssessment(e: React.FormEvent) {
    e.preventDefault();
    await Api.post("/operations/assessments/", assessment);
    toast.success("Avaliação registrada.");
    await load();
  }
  async function toggleStep(item: Step) {
    if (item.automatic) return;
    await Api.post("/operations/onboarding/complete/", {
      step: item.step,
      completed: !item.completed,
    });
    await load();
  }
  return (
    <DashboardLayout>
      <PageHeader
        title="Central operacional"
        subtitle="Dispositivos, relacionamento, avaliações e onboarding em fluxos auditáveis."
      />
      {loading ? (
        <LoadingState label="Carregando a Central operacional..." />
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          <section className="rounded-2xl border bg-white p-6">
            <h2 className="flex items-center gap-2 font-black">
              <Radio size={19} className="text-blue-600" /> Dispositivos de
              acesso
            </h2>
            <form
              onSubmit={createDevice}
              className="mt-4 grid gap-3 sm:grid-cols-2"
            >
              <input
                required
                placeholder="Nome do equipamento"
                value={device.name}
                onChange={(e) => setDevice({ ...device, name: e.target.value })}
                className="h-10 rounded-xl border px-3"
              />
              <input
                required
                placeholder="Identificador"
                value={device.identifier}
                onChange={(e) =>
                  setDevice({ ...device, identifier: e.target.value })
                }
                className="h-10 rounded-xl border px-3"
              />
              <select
                value={device.kind}
                onChange={(e) => setDevice({ ...device, kind: e.target.value })}
                className="h-10 rounded-xl border px-3"
              >
                <option value="simulator">Simulador</option>
                <option value="turnstile">Catraca</option>
                <option value="reader">Leitor</option>
                <option value="facial">Reconhecimento facial</option>
              </select>
              <select
                required
                value={device.unit}
                onChange={(e) => setDevice({ ...device, unit: e.target.value })}
                className="h-10 rounded-xl border px-3"
              >
                <option value="">Selecione a unidade</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <button className="h-10 rounded-xl bg-blue-600 font-bold text-white sm:col-span-2">
                Cadastrar dispositivo
              </button>
            </form>
            <div className="mt-4 divide-y">
              {devices.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <span>
                    <strong>{d.name}</strong> · {d.unit_name} · {d.health.label}
                    {d.last_latency_ms !== null ? ` · ${d.last_latency_ms} ms` : ""}
                    <small className="mt-1 block text-slate-500">{d.health.detail}{d.last_seen_at ? ` · último contato ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(d.last_seen_at))}` : ""}</small>
                  </span>
                  <span className="flex shrink-0 gap-2">
                    <button
                      onClick={() => diagnose(d.id)}
                      className="font-bold text-slate-600"
                    >
                      Diagnosticar
                    </button>
                    {d.kind === "simulator" && (
                      <button
                        onClick={() => simulate(d.id)}
                        className="font-bold text-blue-600"
                      >
                        Simular
                      </button>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-2xl border bg-white p-6">
            <h2 className="flex items-center gap-2 font-black">
              <Mail size={19} className="text-blue-600" /> Campanhas e segmentos
            </h2>
            <form
              onSubmit={createCampaign}
              className="mt-4 grid gap-3 sm:grid-cols-2"
            >
              <input
                required
                placeholder="Nome da campanha"
                value={campaign.name}
                onChange={(e) =>
                  setCampaign({ ...campaign, name: e.target.value })
                }
                className="h-10 rounded-xl border px-3"
              />
              <select
                value={campaign.channel}
                onChange={(e) =>
                  setCampaign({ ...campaign, channel: e.target.value })
                }
                className="h-10 rounded-xl border px-3"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="email">E-mail</option>
              </select>
              <select
                value={campaign.segment}
                onChange={(e) =>
                  setCampaign({ ...campaign, segment: e.target.value })
                }
                className="h-10 rounded-xl border px-3"
              >
                <option value="at_risk">Em risco</option>
                <option value="defaulting">Inadimplentes</option>
                <option value="inactive">Inativos</option>
                <option value="all_active">Todos ativos</option>
              </select>
              <input
                required
                placeholder="Mensagem"
                value={campaign.message}
                onChange={(e) =>
                  setCampaign({ ...campaign, message: e.target.value })
                }
                className="h-10 rounded-xl border px-3"
              />
              <select
                value={deliveryProvider}
                onChange={(e) => setDeliveryProvider(e.target.value)}
                className="h-10 rounded-xl border px-3 sm:col-span-2"
              >
                <option value="sandbox">
                  Sandbox (não envia externamente)
                </option>
                <option value="django_email">
                  E-mail configurado no Django
                </option>
                <option value="whatsapp_http">
                  WhatsApp HTTP configurado no ambiente
                </option>
              </select>
              <button className="h-10 rounded-xl bg-blue-600 font-bold text-white sm:col-span-2">
                Salvar rascunho
              </button>
            </form>
            <div className="mt-4 divide-y">
              {campaigns.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <span>
                    <strong>{c.name}</strong> · {c.channel} · {c.status}
                  </span>
                  <span className="flex gap-2">
                    <button
                      onClick={() => prepare(c.id)}
                      className="font-bold text-blue-600"
                    >
                      Preparar fila
                    </button>
                    {c.status === "ready" && (
                      <button
                        onClick={() => dispatch(c.id)}
                        className="font-bold text-emerald-600"
                      >
                        Processar
                      </button>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-2xl border bg-white p-6">
            <h2 className="flex items-center gap-2 font-black">
              <Scale size={19} className="text-blue-600" /> Avaliações físicas
            </h2>
            <form
              onSubmit={createAssessment}
              className="mt-4 grid gap-3 sm:grid-cols-2"
            >
              <input
                required
                placeholder="ID do aluno"
                value={assessment.student}
                onChange={(e) =>
                  setAssessment({ ...assessment, student: e.target.value })
                }
                className="h-10 rounded-xl border px-3"
              />
              <input
                required
                type="date"
                value={assessment.assessed_at}
                onChange={(e) =>
                  setAssessment({ ...assessment, assessed_at: e.target.value })
                }
                className="h-10 rounded-xl border px-3"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Peso (kg)"
                value={assessment.weight_kg}
                onChange={(e) =>
                  setAssessment({ ...assessment, weight_kg: e.target.value })
                }
                className="h-10 rounded-xl border px-3"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Gordura corporal (%)"
                value={assessment.body_fat_percentage}
                onChange={(e) =>
                  setAssessment({
                    ...assessment,
                    body_fat_percentage: e.target.value,
                  })
                }
                className="h-10 rounded-xl border px-3"
              />
              <input
                placeholder="Objetivo"
                value={assessment.goal}
                onChange={(e) =>
                  setAssessment({ ...assessment, goal: e.target.value })
                }
                className="h-10 rounded-xl border px-3 sm:col-span-2"
              />
              <button className="h-10 rounded-xl bg-blue-600 font-bold text-white sm:col-span-2">
                Registrar avaliação
              </button>
            </form>
            <p className="mt-4 text-sm text-slate-500">
              {assessments.length} avaliação(ões) no contexto ativo.
            </p>
          </section>
          <section className="rounded-2xl border bg-white p-6">
            <h2 className="flex items-center gap-2 font-black">
              <ClipboardCheck size={19} className="text-blue-600" /> Meu
              onboarding
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Checklist adaptado ao seu perfil e calculado a partir dos dados
              reais.
            </p>
            <div className="mt-4 space-y-2">
              {steps.map((s) => (
                <div
                  key={s.step}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold"
                >
                  <input
                    type="checkbox"
                    checked={s.completed}
                    disabled={s.automatic}
                    onChange={() => toggleStep(s)}
                  />
                  <span className="flex-1">
                    {labels[s.step] ?? s.step}
                    {s.automatic && (
                      <small className="ml-2 font-medium text-slate-400">
                        automático
                      </small>
                    )}
                  </span>
                  {s.href && !s.completed && (
                    <a
                      href={s.href}
                      className="text-xs font-bold text-blue-600"
                    >
                      Abrir
                    </a>
                  )}
                </div>
              ))}
            </div>
            {steps.length > 0 && (
              <p className="mt-4 flex items-center gap-2 text-sm font-bold text-blue-700">
                <Activity size={16} />
                {steps.filter((s) => s.completed).length} de {steps.length}{" "}
                concluídos
              </p>
            )}
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}
