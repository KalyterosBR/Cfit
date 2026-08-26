import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CreditCard,
  Search,
  Settings2,
  Shield,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "@/components/PageHeader";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Api } from "@/services/http";

type Academy = {
  name: string;
  trade_name: string;
  phone: string;
  email: string;
};
type Me = {
  role: string;
  role_label: string | null;
  capabilities: string[];
  units: Array<{ id: string; name: string }>;
  two_factor_enabled: boolean;
};
type Member = {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  active_unit: string | null;
};
type Audit = {
  id: string;
  actor_email: string;
  action: string;
  action_label: string;
  entity_label: string;
  entity_id: string;
  previous_state: object;
  new_state: object;
  changes: Array<{ field: string; previous: unknown; current: unknown }>;
  reason: string;
  created_at: string;
};
type Page<T> = { results: T[] };
type OperationalSettings = {
  payment_grace_days: number;
  cancellation_reasons: string;
  access_block_reasons: string;
  opening_hours: Record<string, string>;
  automations_enabled: boolean;
};
type LoginSession = {
  id: string;
  browser: string;
  operating_system: string;
  device_label: string;
  is_current: boolean;
  known_device: boolean;
  last_seen_at: string;
  revoked_at: string | null;
  technical: { user_agent: string; ip_address: string | null };
  user_agent?: string;
  ip_address?: string | null;
};
const roles = [
  ["OWNER", "Proprietário"],
  ["ADMIN", "Administrador"],
  ["MANAGER", "Gerente"],
  ["RECEPTION", "Recepção"],
  ["TRAINER", "Professor"],
  ["FINANCIAL", "Financeiro"],
];
const categories = [
  {
    id: "academy",
    title: "Academia e unidades",
    description: "Dados cadastrais e estrutura operacional.",
    icon: Building2,
    keywords: "academia unidade cnpj endereço",
  },
  {
    id: "users",
    title: "Usuários e permissões",
    description: "Perfis, acessos e responsabilidades.",
    icon: Users,
    keywords: "usuário perfil permissão equipe",
  },
  {
    id: "plans",
    title: "Planos e contratos",
    description: "Regras comerciais, contratos e matrículas.",
    icon: Settings2,
    keywords: "plano contrato matrícula",
  },
  {
    id: "finance",
    title: "Financeiro",
    description: "Cobranças, tolerância, recorrência e conciliação.",
    icon: CreditCard,
    keywords: "financeiro cobrança pagamento",
  },
  {
    id: "security",
    title: "Auditoria e segurança",
    description: "Histórico de alterações e proteção do ambiente.",
    icon: Shield,
    keywords: "auditoria segurança histórico",
  },
];

export default function Settings() {
  const [search, setSearch] = useState("");
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const canAdmin = Boolean(
    me?.capabilities.includes("*") || me?.capabilities.includes("users.manage"),
  );
  const [savingAcademy, setSavingAcademy] = useState(false);
  const [invite, setInvite] = useState({
    name: "",
    email: "",
    password: "",
    role: "RECEPTION",
    active_unit: "",
  });
  const [operational, setOperational] = useState<OperationalSettings | null>(
    null,
  );
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  useEffect(() => {
    Promise.all([
      Api.get<Academy[]>("/academies/"),
      Api.get<Me>("/users/me/"),
      Api.get<OperationalSettings>("/academies/settings/"),
      Api.get<LoginSession[]>("/users/me/sessions/"),
    ])
      .then(([a, m, settings, sessionData]) => {
        setAcademies(a.data);
        setMe(m.data);
        setOperational(settings.data);
        setSessions(sessionData.data);
      })
      .catch(() => toast.error("Não foi possível carregar as configurações."));
  }, []);
  useEffect(() => {
    if (!canAdmin) return;
    Promise.all([
      Api.get<Page<Member>>("/users/members/"),
      Api.get<Page<Audit>>("/users/audits/"),
    ])
      .then(([m, a]) => {
        setMembers(m.data.results);
        setAudits(a.data.results);
      })
      .catch(() =>
        toast.error("Não foi possível carregar permissões e auditoria."),
      );
  }, [canAdmin]);
  const filtered = useMemo(
    () =>
      categories.filter((item) =>
        `${item.title} ${item.description} ${item.keywords}`
          .toLowerCase()
          .includes(search.toLowerCase().trim()),
      ),
    [search],
  );
  async function updateMember(member: Member, changes: Partial<Member>) {
    try {
      const response = await Api.patch<Member>(`/users/members/${member.id}/`, {
        ...changes,
        reason: "Ajuste administrativo de acesso",
      });
      setMembers((current) =>
        current.map((item) => (item.id === member.id ? response.data : item)),
      );
      setAudits((await Api.get<Page<Audit>>("/users/audits/")).data.results);
      toast.success("Permissão atualizada e auditada.");
    } catch {
      toast.error("Não foi possível atualizar a permissão.");
    }
  }
  async function saveAcademy() {
    if (!academies[0]) return;
    try {
      setSavingAcademy(true);
      const response = await Api.patch<Academy>("/academies/", {
        ...academies[0],
        reason: "Atualização das configurações da academia",
      });
      setAcademies([response.data]);
      toast.success("Dados da academia atualizados e auditados.");
    } catch {
      toast.error("Não foi possível atualizar a academia.");
    } finally {
      setSavingAcademy(false);
    }
  }
  async function inviteMember() {
    try {
      await Api.post("/users/members/", {
        ...invite,
        active_unit: invite.active_unit || null,
      });
      setInvite({
        name: "",
        email: "",
        password: "",
        role: "RECEPTION",
        active_unit: "",
      });
      setMembers((await Api.get<Page<Member>>("/users/members/")).data.results);
      toast.success("Usuário criado e vinculado à academia.");
    } catch {
      toast.error(
        "Não foi possível criar o usuário. Verifique o e-mail e a senha.",
      );
    }
  }
  async function saveOperationalSettings() {
    if (!operational) return;
    try {
      setOperational(
        (
          await Api.patch<OperationalSettings>("/academies/settings/", {
            ...operational,
            reason: "Atualização de regras operacionais",
          })
        ).data,
      );
      toast.success("Regras operacionais atualizadas e auditadas.");
    } catch {
      toast.error("Não foi possível salvar as regras operacionais.");
    }
  }
  async function toggleTwoFactor() {
    if (!me) return;
    const password = prompt("Confirme sua senha atual:");
    if (!password) return;
    try {
      const response = await Api.post("/users/me/two-factor/", {
        enabled: !me.two_factor_enabled,
        password,
      });
      setMe({ ...me, two_factor_enabled: response.data.two_factor_enabled });
      toast.success(
        response.data.two_factor_enabled
          ? "Verificação em duas etapas ativada."
          : "Verificação em duas etapas desativada.",
      );
    } catch {
      toast.error("Não foi possível alterar a verificação. Confira a senha.");
    }
  }
  async function revokeSession(id: string) {
    if (
      !confirm(
        "Encerrar esta sessão? Será necessário entrar novamente nesse dispositivo.",
      )
    )
      return;
    await Api.delete("/users/me/sessions/", { data: { session: id } });
    setSessions((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, revoked_at: new Date().toISOString() }
          : item,
      ),
    );
    toast.success("Sessão encerrada e auditada.");
  }
  async function transferOwnership(member: Member) {
    if (
      !confirm(
        `Transferir definitivamente a propriedade para ${member.email}? Sua conta passará a Administrador.`,
      )
    )
      return;
    const password = prompt("Confirme sua senha atual:");
    if (!password) return;
    try {
      await Api.post("/users/ownership/transfer/", {
        membership: member.id,
        password,
        reason: "Transferência confirmada nas configurações",
      });
      toast.success("Propriedade transferida. Recarregando permissões...");
      location.reload();
    } catch {
      toast.error("Não foi possível transferir a propriedade.");
    }
  }
  return (
    <DashboardLayout>
      <PageHeader
        title="Configurações"
        subtitle={`Parâmetros organizados por área e impacto operacional${me?.role_label ? ` · ${me.role_label}` : ""}.`}
        eyebrow="Estrutura da operação"
        context="Regras, acesso e governança"
      />
      <div className="sticky top-0 z-20 mb-5 bg-[#f4f7fb]/90 py-2 backdrop-blur-md dark:bg-[#07101f]/90">
        <Search
          size={17}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar configuração..."
          className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 shadow-sm"
        />
      </div>
      {academies[0] && (
        <section id="academy" className="mb-5 scroll-mt-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
            Academia atual
          </p>
          {canAdmin ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-xs font-bold text-slate-700">
                Nome da academia
                <input
                  value={academies[0].name}
                  onChange={(e) =>
                    setAcademies([{ ...academies[0], name: e.target.value }])
                  }
                  placeholder="Razão social ou nome oficial"
                  className="mt-2 h-11 w-full rounded-xl border border-blue-100 bg-white px-3 font-normal text-slate-900"
                />
              </label>
              <label className="text-xs font-bold text-slate-700">
                Nome fantasia
                <input
                  value={academies[0].trade_name}
                  onChange={(e) =>
                    setAcademies([
                      { ...academies[0], trade_name: e.target.value },
                    ])
                  }
                  placeholder="Nome exibido no Cfit"
                  className="mt-2 h-11 w-full rounded-xl border border-blue-100 bg-white px-3 font-normal text-slate-900"
                />
              </label>
              <label className="text-xs font-bold text-slate-700">
                E-mail da academia
                <input
                  type="email"
                  value={academies[0].email}
                  onChange={(e) =>
                    setAcademies([{ ...academies[0], email: e.target.value }])
                  }
                  placeholder="contato@academia.com"
                  className="mt-2 h-11 w-full rounded-xl border border-blue-100 bg-white px-3 font-normal text-slate-900"
                />
              </label>
              <label className="text-xs font-bold text-slate-700">
                Telefone da academia
                <input
                  type="tel"
                  value={academies[0].phone}
                  onChange={(e) =>
                    setAcademies([{ ...academies[0], phone: e.target.value }])
                  }
                  placeholder="(00) 00000-0000"
                  className="mt-2 h-11 w-full rounded-xl border border-blue-100 bg-white px-3 font-normal text-slate-900"
                />
              </label>
              <button
                type="button"
                disabled={savingAcademy}
                onClick={saveAcademy}
                className="h-11 rounded-xl bg-blue-600 px-5 font-bold text-white disabled:opacity-60 md:col-span-2 md:justify-self-end"
              >
                {savingAcademy ? "Salvando..." : "Salvar dados da academia"}
              </button>
            </div>
          ) : (
            <>
              <p className="mt-2 font-black text-slate-950">
                {academies[0].trade_name || academies[0].name}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {academies[0].email || "E-mail não informado"} ·{" "}
                {academies[0].phone || "Telefone não informado"}
              </p>
            </>
          )}
        </section>
      )}
      <nav
        aria-label="Seções das configurações"
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {filtered.map(({ icon: Icon, ...item }) => (
          <a
            href={item.id === "plans" ? "/plans" : `#${item.id}`}
            key={item.title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[var(--cfit-shadow-card)] transition hover:-translate-y-0.5 hover:border-blue-300"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Icon size={20} />
            </div>
            <h2 className="mt-5 font-black text-slate-950">{item.title}</h2>
            <p className="mt-2 text-sm text-slate-500">{item.description}</p>
            <p className="mt-3 text-xs font-bold text-blue-600">Abrir seção</p>
          </a>
        ))}
      </nav>
      {filtered.length === 0 && (
        <p className="rounded-2xl bg-white p-10 text-center text-slate-500">
          Nenhuma configuração corresponde à busca.
        </p>
      )}
      {canAdmin && operational && (
        <section id="finance" className="mt-6 scroll-mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-black">Regras operacionais</h2>
          <p className="mt-1 text-sm text-slate-500">
            Parâmetros usados por financeiro, acessos e automações.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-xs font-bold text-slate-700">
              Tolerância financeira (dias)
              <input
                type="number"
                min={0}
                max={90}
                value={operational.payment_grace_days}
                onChange={(e) =>
                  setOperational(
                    (current) =>
                      current && {
                        ...current,
                        payment_grace_days: Number(e.target.value),
                      },
                  )
                }
                className="mt-2 h-11 w-full rounded-xl border px-3 font-normal"
              />
            </label>
            <label className="flex items-center gap-3 self-end rounded-xl bg-slate-50 p-3 text-sm font-bold">
              <input
                type="checkbox"
                checked={operational.automations_enabled}
                onChange={(e) =>
                  setOperational(
                    (current) =>
                      current && {
                        ...current,
                        automations_enabled: e.target.checked,
                      },
                  )
                }
              />{" "}
              Automações operacionais habilitadas
            </label>
            <label className="text-xs font-bold text-slate-700">
              Motivos de cancelamento
              <textarea
                value={operational.cancellation_reasons}
                onChange={(e) =>
                  setOperational(
                    (current) =>
                      current && {
                        ...current,
                        cancellation_reasons: e.target.value,
                      },
                  )
                }
                placeholder="Um motivo por linha"
                className="mt-2 min-h-24 w-full rounded-xl border p-3 font-normal"
              />
            </label>
            <label className="text-xs font-bold text-slate-700">
              Motivos de bloqueio de acesso
              <textarea
                value={operational.access_block_reasons}
                onChange={(e) =>
                  setOperational(
                    (current) =>
                      current && {
                        ...current,
                        access_block_reasons: e.target.value,
                      },
                  )
                }
                placeholder="Um motivo por linha"
                className="mt-2 min-h-24 w-full rounded-xl border p-3 font-normal"
              />
            </label>
            <button
              type="button"
              onClick={saveOperationalSettings}
              className="h-11 rounded-xl bg-blue-600 px-5 font-bold text-white md:col-span-2 md:justify-self-end"
            >
              Salvar regras operacionais
            </button>
          </div>
        </section>
      )}
      {canAdmin && (
        <section id="users" className="mt-6 scroll-mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-black text-slate-950">Usuários e permissões</h2>
          <p className="mt-1 text-sm text-slate-500">
            Crie acessos, defina o perfil e a unidade operacional de cada
            pessoa.
          </p>
          <div className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-5">
            <input
              value={invite.name}
              onChange={(e) =>
                setInvite((current) => ({ ...current, name: e.target.value }))
              }
              placeholder="Nome completo"
              className="h-10 rounded-xl border px-3 text-sm"
            />
            <input
              type="email"
              value={invite.email}
              onChange={(e) =>
                setInvite((current) => ({ ...current, email: e.target.value }))
              }
              placeholder="E-mail"
              className="h-10 rounded-xl border px-3 text-sm"
            />
            <input
              type="password"
              value={invite.password}
              onChange={(e) =>
                setInvite((current) => ({
                  ...current,
                  password: e.target.value,
                }))
              }
              placeholder="Senha inicial (8+ caracteres)"
              className="h-10 rounded-xl border px-3 text-sm"
            />
            <select
              value={invite.role}
              onChange={(e) =>
                setInvite((current) => ({ ...current, role: e.target.value }))
              }
              className="h-10 rounded-xl border px-3 text-sm"
            >
              {roles.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={invite.active_unit}
              onChange={(e) =>
                setInvite((current) => ({
                  ...current,
                  active_unit: e.target.value,
                }))
              }
              className="h-10 rounded-xl border px-3 text-sm"
            >
              <option value="">Sem unidade definida</option>
              {me?.units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={inviteMember}
              disabled={
                !invite.name || !invite.email || invite.password.length < 8
              }
              className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white disabled:opacity-50 xl:col-span-5 xl:justify-self-end"
            >
              Criar acesso
            </button>
          </div>
          <div className="cfit-record-list mt-5">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-slate-900">
                    {member.name}
                  </p>
                  <p className="truncate text-sm text-slate-500">
                    {member.email}
                  </p>
                </div>
                <select
                  value={member.active_unit ?? ""}
                  onChange={(e) =>
                    updateMember(member, {
                      active_unit: e.target.value || null,
                    })
                  }
                  className="h-10 rounded-xl border px-3 text-sm"
                >
                  <option value="">Sem unidade definida</option>
                  {me?.units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
                <select
                  value={member.role}
                  onChange={(e) =>
                    updateMember(member, { role: e.target.value })
                  }
                  className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
                >
                  {roles.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() =>
                    updateMember(member, { active: !member.active })
                  }
                  className={`h-10 rounded-xl px-4 text-sm font-bold ${member.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                >
                  {member.active ? "Ativo" : "Inativo"}
                </button>
              </div>
            ))}
          </div>
          {members.length === 0 && (
            <p className="mt-5 text-sm text-slate-500">
              Nenhum usuário vinculado à academia.
            </p>
          )}
        </section>
      )}
      {canAdmin && (
        <section id="audit" className="mt-6 scroll-mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-black text-slate-950">
            Auditoria administrativa
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Quem alterou, quando e os valores anterior e posterior.
          </p>
          <div className="mt-5 space-y-3">
            {audits.map((audit) => (
              <article
                key={audit.id}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="text-sm font-bold text-slate-800">
                    {audit.actor_email} · {audit.action_label}
                  </p>
                  <time className="text-xs text-slate-500">
                    {new Date(audit.created_at).toLocaleString("pt-BR")}
                  </time>
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-500">{audit.entity_label} · {audit.entity_id}</p>
                <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                  {audit.changes.map((change) => (
                    <div key={change.field} className="rounded-lg bg-white p-2">
                      <dt className="font-bold text-slate-600">{change.field}</dt>
                      <dd className="mt-1 text-slate-500">{String(change.previous ?? "—")} → {String(change.current ?? "—")}</dd>
                    </div>
                  ))}
                </dl>
                {audit.reason && (
                  <p className="mt-1 text-xs text-slate-500">
                    Motivo: {audit.reason}
                  </p>
                )}
              </article>
            ))}
          </div>
          {audits.length === 0 && (
            <p className="mt-5 text-sm text-slate-500">
              Nenhuma alteração administrativa registrada.
            </p>
          )}
        </section>
      )}
      <section id="security" className="mt-6 scroll-mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-black text-slate-950">Segurança da conta</h2>
            <p className="mt-1 text-sm text-slate-500">
              Verificação por e-mail e sessões autenticadas recentemente.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleTwoFactor}
            className={`h-10 rounded-xl px-4 text-sm font-bold ${me?.two_factor_enabled ? "bg-emerald-50 text-emerald-700" : "bg-blue-600 text-white"}`}
          >
            {me?.two_factor_enabled ? "2FA ativado" : "Ativar 2FA"}
          </button>
        </div>
        <div className="cfit-record-list mt-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
            >
              <span>
                <strong>{session.device_label}</strong>{session.is_current ? " · Sessão atual" : ""} · {session.known_device ? "Dispositivo conhecido" : "Dispositivo novo"}
                <br />
                <small className="text-slate-500">
                  Última atividade:{" "}
                  {new Date(session.last_seen_at).toLocaleString("pt-BR")}
                </small>
                <details className="mt-1 text-xs text-slate-400"><summary className="cursor-pointer">Detalhes técnicos</summary><span>{session.technical.ip_address || "IP não identificado"} · {session.technical.user_agent || "Agente não identificado"}</span></details>
              </span>
              {session.revoked_at ? (
                <span className="font-bold text-slate-400">Encerrada</span>
              ) : (
                <button
                  type="button"
                  onClick={() => revokeSession(session.id)}
                  className="font-bold text-red-600"
                >
                  Encerrar sessão
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
      {me?.role === "OWNER" && (
        <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-6">
          <h2 className="font-black text-slate-950">
            Transferência de propriedade
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            A transferência exige sua senha, é auditada e altera sua função para
            Administrador.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {members
              .filter((member) => member.active && member.role !== "OWNER")
              .map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => transferOwnership(member)}
                  className="rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-bold text-amber-800"
                >
                  Transferir para {member.name}
                </button>
              ))}
          </div>
        </section>
      )}
    </DashboardLayout>
  );
}
