import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Activity, Copy, Download, KeyRound, Plus, Radio } from "lucide-react";
import toast from "react-hot-toast";
import { EmptyState, ErrorState, SkeletonState } from "@/components/AsyncState";
import Modal from "@/components/Modal";
import { useAppDialog } from "@/components/AppDialog";
import { Api } from "@/services/http";

type Device = {
  id: string;
  unit: string;
  unit_name: string;
  name: string;
  identifier: string;
  kind: string;
  provider: string;
  connection_mode: string;
  connector: string | null;
  local_address: string;
  local_port: number | null;
  model_name: string;
  active: boolean;
  status: string;
  status_label: string;
  last_seen_at: string | null;
  last_latency_ms: number | null;
  firmware_version: string;
  health: { detail: string };
};
type Connector = {
  id: string;
  unit: string;
  unit_name: string;
  name: string;
  identifier: string;
  active: boolean;
  status: string;
  status_label: string;
  last_seen_at: string | null;
  version: string;
  device_count: number;
};
type Unit = { id: string; name: string };
type Event = {
  id: string;
  event_type: string;
  success: boolean;
  message: string;
  created_at: string;
};
type Command = {
  id: string;
  command_type: string;
  status: string;
  attempts: number;
  result: Record<string, unknown>;
  last_error: string;
  created_at: string;
};
const field =
  "h-10 rounded-xl border border-[var(--cfit-border)] bg-[var(--cfit-surface-elevated)] px-3 text-sm";

export default function DeviceManagement({
  canManage,
}: {
  canManage: boolean;
}) {
  const dialog = useAppDialog();
  const [items, setItems] = useState<Device[]>([]),
    [units, setUnits] = useState<Unit[]>([]),
    [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(false),
    [open, setOpen] = useState(false),
    [connectorOpen, setConnectorOpen] = useState(false);
  const [editing, setEditing] = useState<Device | null>(null),
    [details, setDetails] = useState<Device | null>(null);
  const [generatedKey, setGeneratedKey] = useState<{
    deviceName: string;
    value: string;
  } | null>(null);
  const [connectorForm, setConnectorForm] = useState({ name: "", identifier: "", unit: "" });
  const [events, setEvents] = useState<Event[]>([]),
    [commands, setCommands] = useState<Command[]>([]);
  const [form, setForm] = useState({
    name: "",
    identifier: "",
    kind: "simulator",
    provider: "simulator",
    unit: "",
    connection_mode: "simulator",
    connector: "",
    local_address: "",
    local_port: "",
    model_name: "",
  });
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const [a, b, c] = await Promise.all([
        Api.get("/operations/devices/"),
        Api.get("/academies/units/"),
        Api.get("/operations/connectors/"),
      ]);
      setItems(a.data.results);
      setUnits(b.data.results);
      setConnectors(c.data.results);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function save(e: FormEvent) {
    e.preventDefault();
    try {
      const payload = { ...form, connector: form.connector || null, local_port: form.local_port ? Number(form.local_port) : null };
      if (editing) await Api.patch(`/operations/devices/${editing.id}/`, payload);
      else await Api.post("/operations/devices/", payload);
      toast.success(
        editing ? "Equipamento atualizado." : "Equipamento cadastrado.",
      );
      setOpen(false);
      setEditing(null);
      await load();
    } catch {
      toast.error("Não foi possível salvar o equipamento.");
    }
  }
  async function saveConnector(e: FormEvent) {
    e.preventDefault();
    try {
      await Api.post("/operations/connectors/", connectorForm);
      toast.success("Conector local cadastrado.");
      setConnectorOpen(false);
      await load();
    } catch {
      toast.error("Não foi possível cadastrar o conector.");
    }
  }
  async function rotateConnectorKey(item: Connector) {
    const confirmed = await dialog.confirm({
      title: "Gerar nova chave do conector",
      description: `Todos os equipamentos ligados a “${item.name}” passarão a usar a nova chave. A anterior será invalidada imediatamente.`,
      confirmLabel: "Gerar nova chave",
      tone: "danger",
    });
    if (!confirmed) return;
    try {
      const response = await Api.post<{ connector_key: string }>(`/operations/connectors/${item.id}/rotate-key/`);
      setGeneratedKey({ deviceName: item.name, value: response.data.connector_key });
    } catch {
      toast.error("Não foi possível gerar a chave do conector.");
    }
  }
  async function detail(item: Device) {
    try {
      const [a, b] = await Promise.all([
        Api.get(`/operations/devices/${item.id}/events/`),
        Api.get(`/operations/devices/${item.id}/commands/`),
      ]);
      setEvents(a.data);
      setCommands(b.data);
      setDetails(item);
    } catch {
      toast.error("Não foi possível carregar o histórico.");
    }
  }
  async function diagnose(item: Device) {
    try {
      const r = await Api.post(`/operations/devices/${item.id}/diagnose/`);
      toast[r.data.success ? "success" : "error"](r.data.message);
      await load();
    } catch {
      toast.error("Diagnóstico indisponível.");
    }
  }
  async function rotateKey(item: Device) {
    const confirmed = await dialog.confirm({
      title: "Gerar nova chave do conector",
      description: `A chave anterior de “${item.name}” deixará de funcionar imediatamente. A nova chave será exibida somente uma vez.`,
      confirmLabel: "Gerar nova chave",
      tone: "danger",
    });
    if (!confirmed) return;
    try {
      const response = await Api.post<{ webhook_key: string }>(
        `/operations/devices/${item.id}/rotate-webhook-key/`,
      );
      setGeneratedKey({ deviceName: item.name, value: response.data.webhook_key });
    } catch {
      toast.error("Não foi possível gerar a chave do conector.");
    }
  }
  async function toggle(item: Device) {
    try {
      await Api.patch(`/operations/devices/${item.id}/`, {
        active: !item.active,
      });
      toast.success(
        item.active ? "Equipamento inativado." : "Equipamento ativado.",
      );
      await load();
    } catch {
      toast.error("Não foi possível alterar o equipamento.");
    }
  }
  return (
    <details className="mb-5 rounded-2xl border border-[var(--cfit-border)] bg-[var(--cfit-surface-primary)] p-5">
      <summary className="cursor-pointer font-black">
        Acesso e equipamentos{" "}
        <span className="ml-2 text-xs font-medium text-[var(--cfit-text-secondary)]">
          Cadastro, saúde e diagnóstico
        </span>
      </summary>
      {canManage && (
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <a
            href="/downloads/CfitConnector-ControlId.zip"
            download
            className="cfit-secondary-button"
          >
            <Download size={16} />
            Baixar conector Control iD
          </a>
          <button
            onClick={() => {
              setConnectorForm({ name: "", identifier: "", unit: units[0]?.id || "" });
              setConnectorOpen(true);
            }}
            className="cfit-secondary-button"
          >
            <Plus size={16} />
            Novo conector
          </button>
          <button
            onClick={() => {
              setEditing(null);
              setForm({
                name: "",
                identifier: "",
                kind: "simulator",
                provider: "simulator",
                unit: units[0]?.id || "",
                connection_mode: "simulator",
                connector: "",
                local_address: "",
                local_port: "",
                model_name: "",
              });
              setOpen(true);
            }}
            className="cfit-primary-button"
          >
            <Plus size={16} />
            Novo equipamento
          </button>
        </div>
      )}
      {connectors.length > 0 && (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {connectors.map((connector) => (
            <article key={connector.id} className="rounded-xl border border-[var(--cfit-border-subtle)] bg-[var(--cfit-surface-subtle)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2"><Radio size={16} /><strong>{connector.name}</strong><span className="cfit-chip" data-tone={connector.status === "online" ? "success" : "warning"}>{connector.status_label}</span></div>
                  <p className="mt-1 text-sm text-[var(--cfit-text-secondary)]">{connector.unit_name} · {connector.identifier} · {connector.device_count} equipamento(s)</p>
                  <p className="mt-1 text-xs text-[var(--cfit-text-tertiary)]">Versão {connector.version || "não informada"} · último contato {connector.last_seen_at ? new Date(connector.last_seen_at).toLocaleString("pt-BR") : "nunca"}</p>
                </div>
                {canManage && <button type="button" onClick={() => void rotateConnectorKey(connector)} className="cfit-secondary-button"><KeyRound size={16} /> Gerar chave</button>}
              </div>
            </article>
          ))}
        </div>
      )}
      {loading ? (
        <SkeletonState rows={3} />
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : items.length === 0 ? (
        <EmptyState
          label="Nenhum equipamento"
          detail="Cadastre um simulador, catraca, leitor ou terminal facial."
        />
      ) : (
        <div className="mt-3 cfit-record-list">
          {items.map((item) => (
            <article
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Radio size={16} />
                  <strong>{item.name}</strong>
                  <span
                    className="cfit-chip"
                    data-tone={
                      item.status === "online"
                        ? "success"
                        : item.status === "error"
                          ? "danger"
                          : "warning"
                    }
                  >
                    {item.status_label}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[var(--cfit-text-secondary)]">
                  {item.unit_name} · {item.identifier} · {item.health.detail}
                </p>
                <p className="mt-1 text-xs font-semibold text-[var(--cfit-text-secondary)]">
                  {item.connection_mode === "direct_cloud" ? "Conexão direta com o Cfit" : item.connection_mode === "local_connector" ? "Conector local" : "Simulação"}
                  {item.local_address ? ` · ${item.local_address}${item.local_port ? `:${item.local_port}` : ""}` : ""}
                </p>
                <p className="mt-1 text-xs text-[var(--cfit-text-tertiary)]">
                  Último contato:{" "}
                  {item.last_seen_at
                    ? new Date(item.last_seen_at).toLocaleString("pt-BR")
                    : "nunca"}{" "}
                  · Latência: {item.last_latency_ms ?? "—"} ms · Firmware:{" "}
                  {item.firmware_version || "não informado"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {canManage && (
                  <>
                    <button
                      onClick={() => void rotateKey(item)}
                      className="cfit-secondary-button"
                    >
                      <KeyRound size={16} />
                      Gerar chave
                    </button>
                    <button
                      onClick={() => void diagnose(item)}
                      className="cfit-secondary-button"
                    >
                      <Activity size={16} />
                      Diagnosticar
                    </button>
                  </>
                )}
                <button
                  onClick={() => void detail(item)}
                  className="cfit-secondary-button"
                >
                  Histórico
                </button>
                {canManage && (
                  <>
                    <button
                      onClick={() => {
                        setEditing(item);
                        setForm({
                          name: item.name,
                          identifier: item.identifier,
                          kind: item.kind,
                          provider: item.provider,
                          unit: item.unit,
                          connection_mode: item.connection_mode,
                          connector: item.connector || "",
                          local_address: item.local_address,
                          local_port: item.local_port ? String(item.local_port) : "",
                          model_name: item.model_name,
                        });
                        setOpen(true);
                      }}
                      className="cfit-secondary-button"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => void toggle(item)}
                      className="cfit-secondary-button"
                    >
                      {item.active ? "Inativar" : "Ativar"}
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      <Modal open={connectorOpen} title="Novo conector local" onClose={() => setConnectorOpen(false)}>
        <form onSubmit={saveConnector} className="grid gap-3 sm:grid-cols-2">
          <input required placeholder="Nome do computador ou conector" value={connectorForm.name} onChange={(e) => setConnectorForm({ ...connectorForm, name: e.target.value })} className={field} />
          <input required placeholder="Identificador único" value={connectorForm.identifier} onChange={(e) => setConnectorForm({ ...connectorForm, identifier: e.target.value })} className={field} />
          <select required value={connectorForm.unit} onChange={(e) => setConnectorForm({ ...connectorForm, unit: e.target.value })} className={`${field} sm:col-span-2`}>
            <option value="">Selecione a unidade</option>
            {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
          </select>
          <p className="text-sm leading-6 text-[var(--cfit-text-secondary)] sm:col-span-2">Um único Cfit Connector pode atender vários equipamentos e marcas acessíveis por este computador.</p>
          <button className="cfit-primary-button sm:col-span-2">Cadastrar conector</button>
        </form>
      </Modal>
      <Modal
        open={Boolean(generatedKey)}
        title="Chave do conector"
        onClose={() => setGeneratedKey(null)}
      >
        {generatedKey && (
          <div>
            <p className="text-sm leading-6 text-[var(--cfit-text-secondary)]">
              Copie e guarde a chave de {generatedKey.deviceName}. Ela não será
              exibida novamente depois que esta janela for fechada.
            </p>
            <label className="mt-5 block text-sm font-bold">
              Chave do dispositivo
              <input
                readOnly
                value={generatedKey.value}
                onFocus={(event) => event.currentTarget.select()}
                className={`${field} mt-2 w-full font-mono`}
              />
            </label>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(generatedKey.value).then(
                  () => toast.success("Chave copiada."),
                  () => toast.error("Selecione a chave e copie manualmente."),
                );
              }}
              className="cfit-primary-button mt-4"
            >
              <Copy size={16} />
              Copiar chave
            </button>
          </div>
        )}
      </Modal>
      <Modal
        open={open}
        title={editing ? "Editar equipamento" : "Novo equipamento"}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
      >
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <input
            required
            placeholder="Nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={field}
          />
          <input
            required
            placeholder="Identificador"
            value={form.identifier}
            onChange={(e) => setForm({ ...form, identifier: e.target.value })}
            className={field}
          />
          <select
            value={form.kind}
            onChange={(e) => setForm({ ...form, kind: e.target.value })}
            className={field}
          >
            <option value="simulator">Simulador</option>
            <option value="turnstile">Catraca</option>
            <option value="reader">Leitor</option>
            <option value="facial">Facial</option>
          </select>
          <select
            value={form.provider}
            onChange={(e) => setForm({ ...form, provider: e.target.value })}
            className={field}
          >
            <option value="simulator">Simulador Cfit</option>
            <option value="control_id">Control iD</option>
            <option value="topdata_inner">Topdata Inner</option>
            <option value="topdata_facial">Topdata Facial</option>
          </select>
          <select
            value={form.connection_mode}
            onChange={(e) => setForm({ ...form, connection_mode: e.target.value, connector: e.target.value === "local_connector" ? form.connector : "" })}
            className={field}
          >
            <option value="simulator">Simulação</option>
            <option value="local_connector">Conector local</option>
            <option value="direct_cloud" disabled={form.provider !== "control_id"}>Direta com o Cfit (Control iD)</option>
          </select>
          <input placeholder="Modelo do equipamento" value={form.model_name} onChange={(e) => setForm({ ...form, model_name: e.target.value })} className={field} />
          <select
            required
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            className={field}
          >
            <option value="">Selecione a unidade</option>
            {units.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
          {form.connection_mode === "local_connector" && (
            <>
              <select required value={form.connector} onChange={(e) => setForm({ ...form, connector: e.target.value })} className={field}>
                <option value="">Selecione o conector</option>
                {connectors.filter((connector) => connector.unit === form.unit).map((connector) => <option key={connector.id} value={connector.id}>{connector.name}</option>)}
              </select>
              <input required placeholder="IP ou endereço local" value={form.local_address} onChange={(e) => setForm({ ...form, local_address: e.target.value })} className={field} />
              <input type="number" min="1" max="65535" placeholder="Porta (ex.: 3570)" value={form.local_port} onChange={(e) => setForm({ ...form, local_port: e.target.value })} className={field} />
            </>
          )}
          {form.connection_mode === "direct_cloud" && <p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-800 sm:col-span-2">Após salvar e gerar a chave, configure o modo Push personalizado da Control iD com o endereço público do Cfit.</p>}
          <button className="cfit-primary-button sm:col-span-2">
            Salvar equipamento
          </button>
        </form>
      </Modal>
      <Modal
        open={Boolean(details)}
        title={details ? `Histórico · ${details.name}` : "Histórico"}
        onClose={() => setDetails(null)}
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <h3 className="font-black">Eventos e diagnósticos</h3>
            {events.length ? (
              events.map((x) => (
                <div
                  key={x.id}
                  className="border-b border-[var(--cfit-table-divider)] py-2 text-sm"
                >
                  <strong>{x.success ? "Concluído" : "Falhou"}</strong> ·{" "}
                  {x.message || x.event_type}
                  <small className="mt-1 block text-[var(--cfit-text-tertiary)]">
                    {new Date(x.created_at).toLocaleString("pt-BR")}
                  </small>
                </div>
              ))
            ) : (
              <p className="mt-2 text-sm">Sem eventos.</p>
            )}
          </div>
          <div>
            <h3 className="font-black">Comandos e sincronizações</h3>
            {commands.length ? (
              commands.map((x) => (
                <div
                  key={x.id}
                  className="border-b border-[var(--cfit-table-divider)] py-2 text-sm"
                >
                  <strong>{x.command_type}</strong> · {x.status} · {x.attempts}{" "}
                  tentativa(s)
                  {x.last_error && (
                    <span className="block text-red-600">{x.last_error}</span>
                  )}
                  <small className="mt-1 block text-[var(--cfit-text-tertiary)]">
                    {Object.keys(x.result || {}).length
                      ? JSON.stringify(x.result)
                      : "Sem resultado informado"}
                  </small>
                </div>
              ))
            ) : (
              <p className="mt-2 text-sm">Sem comandos.</p>
            )}
          </div>
        </div>
      </Modal>
    </details>
  );
}
