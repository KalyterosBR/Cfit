import axios from "axios";
import { ArrowDownRight, ArrowUpRight, Building2, CheckCircle2, Minus, Pencil, Power, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import { phoneMask } from "@/utils/masks";
import { useSearchParams } from "react-router-dom";

import PageHeader from "@/components/PageHeader";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Api } from "@/services/http";

type Unit = {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  active: boolean;
};
type Me = { active_unit: Unit | null; capabilities: string[] };
type Page<T> = { results: T[] };
type UnitMetric = {
  id: string;
  name: string;
  active_students: number;
  checkins: number;
  revenue: string;
  previous_checkins:number;
  previous_revenue:string;
  rank:number;
  alerts:string[];
  revenue_per_student:number;
  revenue_change:number|null;
  checkin_change:number|null;
};
type UnitCoverage = { domains: Array<{key:string;label:string;unassigned:number}>; unassigned_total:number; migration_policy:string };
type UnitForm = Pick<Unit, "name" | "code" | "address" | "phone">;
const emptyForm: UnitForm = { name: "", code: "", address: "", phone: "" };

function Variation({ value }: { value: number | null }) {
  if (value === null) return <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400"><Minus size={13} /> Sem base</span>;
  const positive = value > 0;
  const negative = value < 0;
  const Icon = positive ? ArrowUpRight : negative ? ArrowDownRight : Minus;
  return <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold ${positive ? "bg-emerald-50 text-emerald-700" : negative ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}><Icon size={13} />{positive ? "+" : ""}{value}%</span>;
}

export default function Units() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [units, setUnits] = useState<Unit[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<UnitMetric[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [form, setForm] = useState<UnitForm>(emptyForm);
  const [editing, setEditing] = useState<Unit | null>(null);
  const [period, setPeriod] = useState(() => searchParams.get("period") || new Date().toISOString().slice(0, 7));
  const [coverage, setCoverage] = useState<UnitCoverage | null>(null);
  const [sortBy, setSortBy] = useState<"rank" | "active_students" | "checkins" | "revenue">((searchParams.get("sort") as "rank" | "active_students" | "checkins" | "revenue") || "rank");
  const [density, setDensity] = useState<"comfortable" | "compact">((searchParams.get("density") as "comfortable" | "compact") || "comfortable");
  const [showChanges, setShowChanges] = useState(searchParams.get("changes") !== "hidden");
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set("period", period); next.set("sort", sortBy); next.set("density", density); next.set("changes", showChanges ? "visible" : "hidden");
    if (next.toString() !== searchParams.toString()) setSearchParams(next, { replace: true });
  }, [density, period, searchParams, setSearchParams, showChanges, sortBy]);

  const load=useCallback(async()=> {
    const [unitsResponse, meResponse] = await Promise.all([
      Api.get<Page<Unit>>("/academies/units/"),
      Api.get<Me>("/users/me/"),
    ]);
    setUnits(unitsResponse.data.results);
    setActive(meResponse.data.active_unit?.id ?? null);
    setCanManage(
      meResponse.data.capabilities.includes("*") ||
        meResponse.data.capabilities.includes("units.manage"),
    );
    try {
      const [comparison, coverageResponse] = await Promise.all([
          Api.get<UnitMetric[]>("/academies/units/comparison/", {
            params: { period },
          }),
          Api.get<UnitCoverage>("/academies/units/unit-coverage/"),
      ]);
      setMetrics(comparison.data);
      setCoverage(coverageResponse.data);
    } catch {
      setMetrics([]);
      toast.error(
        "As unidades foram carregadas, mas a comparação não está disponível.",
      );
    }
  },[period]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load().catch((error) => {
        const forbidden =
          axios.isAxiosError(error) && error.response?.status === 403;
        toast.error(
          forbidden
            ? "Seu perfil não possui permissão para visualizar unidades."
            : "Não foi possível carregar as unidades.",
        );
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function save(event: FormEvent) {
    event.preventDefault();
    try {
      const wasEditing = Boolean(editing);
      if (editing)
        await Api.patch(`/academies/units/${editing.id}/`, {
          ...form,
          reason: "Atualização cadastral da unidade",
        });
      else await Api.post("/academies/units/", form);
      setForm(emptyForm);
      setEditing(null);
      await load();
      toast.success(
        wasEditing ? "Unidade atualizada e auditada." : "Unidade criada.",
      );
    } catch (error) {
      const detail = axios.isAxiosError<{ code?: string[] }>(error)
        ? error.response?.data?.code?.[0]
        : null;
      toast.error(detail || "Não foi possível salvar a unidade.");
    }
  }
  function edit(unit: Unit) {
    setEditing(unit);
    setForm({
      name: unit.name,
      code: unit.code,
      address: unit.address,
      phone: unit.phone,
    });
  }
  async function select(unit: Unit) {
    try {
      await Api.post("/users/me/active-unit/", { unit: unit.id });
      setActive(unit.id);
      toast.success("Contexto da unidade atualizado.");
    } catch {
      toast.error("Não foi possível selecionar a unidade.");
    }
  }
  async function toggle(unit: Unit) {
    if (unit.id === active && unit.active) {
      toast.error("Selecione outra unidade antes de inativar a unidade atual.");
      return;
    }
    if (
      !window.confirm(
        `${unit.active ? "Inativar" : "Reativar"} a unidade ${unit.name}?`,
      )
    )
      return;
    try {
      await Api.patch(`/academies/units/${unit.id}/`, {
        active: !unit.active,
        reason: unit.active
          ? "Inativação operacional"
          : "Reativação operacional",
      });
      await load();
      toast.success("Status da unidade atualizado.");
    } catch {
      toast.error("Não foi possível alterar o status da unidade.");
    }
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Academia e unidades"
        subtitle="Cadastre, selecione e compare o contexto operacional de cada unidade."
        eyebrow="Contexto da rede"
        context="Escopo, unidade e comparação"
      />
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
            Escopo da comparação
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Rede consolidada · caixa recebido e check-ins no mês selecionado ·
            alunos ativos na data atual.
          </p>
        </div>
        <label className="text-xs font-bold text-slate-700">
          Período
          <input
            type="month"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className="mt-1 block h-10 rounded-xl border border-blue-200 bg-white px-3 font-normal"
          />
        </label>
      </div>
      {coverage && coverage.unassigned_total > 0 && (
        <section className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 p-4" aria-labelledby="coverage-title">
          <h2 id="coverage-title" className="font-black text-amber-950">Dados históricos aguardando definição de unidade</h2>
          <p className="mt-1 text-sm text-amber-900">{coverage.unassigned_total} registro(s) não foram atribuídos automaticamente. Revise a origem antes de qualquer migração.</p>
          <ul className="mt-2 flex flex-wrap gap-3 text-xs font-bold text-amber-800">{coverage.domains.filter(item => item.unassigned).map(item => <li key={item.key}>{item.label}: {item.unassigned}</li>)}</ul>
        </section>
      )}
      {canManage && (
        <form
          onSubmit={save}
          className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-2"
        >
          <label className="text-xs font-bold text-slate-700">
            Nome
            <input
              required
              value={form.name}
              onChange={(e) =>
                setForm((current) => ({ ...current, name: e.target.value }))
              }
              className="mt-2 h-11 w-full rounded-xl border px-3 font-normal"
            />
          </label>
          <label className="text-xs font-bold text-slate-700">
            Código
            <input
              required
              value={form.code}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  code: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                }))
              }
              className="mt-2 h-11 w-full rounded-xl border px-3 font-normal"
            />
          </label>
          <label className="text-xs font-bold text-slate-700">
            Endereço
            <input
              value={form.address}
              onChange={(e) =>
                setForm((current) => ({ ...current, address: e.target.value }))
              }
              className="mt-2 h-11 w-full rounded-xl border px-3 font-normal"
            />
          </label>
          <label className="text-xs font-bold text-slate-700">
            Telefone
            <input
              value={form.phone}
              onChange={(e) =>
                setForm((current) => ({ ...current, phone: phoneMask(e.target.value) }))
              }
              inputMode="tel"
              maxLength={15}
              className="mt-2 h-11 w-full rounded-xl border px-3 font-normal"
            />
          </label>
          <div className="flex gap-3 md:col-span-2">
            <button className="h-11 rounded-xl bg-blue-600 px-5 font-bold text-white">
              {editing ? "Salvar alterações" : "Adicionar unidade"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setForm(emptyForm);
                }}
                className="h-11 rounded-xl border px-5 font-bold"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {units.map((unit) => {
          const metric = metrics.find((item) => item.id === unit.id);
          return (
            <article
              key={unit.id}
              className={`rounded-2xl border bg-white p-5 shadow-sm ${active === unit.id ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-200"} ${unit.active ? "" : "opacity-65"}`}
            >
              <div className="flex items-start justify-between">
                <Building2 className="text-blue-600" />
                {canManage && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => edit(unit)}
                      aria-label={`Editar ${unit.name}`}
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggle(unit)}
                      aria-label={`${unit.active ? "Inativar" : "Reativar"} ${unit.name}`}
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                    >
                      <Power size={16} />
                    </button>
                  </div>
                )}
              </div>
              <h2 className="mt-4 font-black">{unit.name}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {unit.code} · {unit.active ? "Ativa" : "Inativa"}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {unit.address || "Endereço não informado"}
                <br />
                {unit.phone || "Telefone não informado"}
              </p>
              {metric && (
                <><div className="mt-3 flex items-center justify-between text-xs"><strong className="text-blue-600">#{metric.rank} no período</strong><span className="text-slate-500">comparado ao mês anterior</span></div><dl className="mt-3 grid grid-cols-3 gap-2 border-y py-3 text-center">
                  <div>
                    <dt className="text-[10px] uppercase text-slate-400">
                      Alunos
                    </dt>
                    <dd className="font-black">{metric.active_students}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase text-slate-400">
                      Check-ins
                    </dt>
                    <dd className="font-black">{metric.checkins}</dd>
                    <small className="text-[9px] text-slate-400">antes {metric.previous_checkins}</small>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase text-slate-400">
                      Receita
                    </dt>
                    <dd className="text-xs font-black">
                      {Number(metric.revenue).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </dd>
                    <small className="text-[9px] text-slate-400">antes {Number(metric.previous_revenue).toLocaleString("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0})}</small>
                  </div>
                </dl>{metric.alerts.length>0&&<ul className="mt-3 space-y-1 text-xs font-semibold text-amber-700">{metric.alerts.map(alert=><li key={alert}>{alert}</li>)}</ul>}</>
              )}
              {unit.active && (
                <button
                  onClick={() => select(unit)}
                  className="mt-4 flex items-center gap-2 text-sm font-bold text-blue-600"
                >
                  <CheckCircle2 size={16} />{" "}
                  {active === unit.id ? "Unidade ativa" : "Usar esta unidade"}
                </button>
              )}
            </article>
          );
        })}
      </div>
      {metrics.length > 0 && (
        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white" aria-labelledby="comparison-title">
          <header className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-xl">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-600">Desempenho da rede</p>
                <h2 id="comparison-title" className="mt-1 text-xl font-black tracking-tight text-slate-950">Comparação consolidada</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">Compare base ativa, movimento e resultado financeiro das unidades no período selecionado.</p>
              </div>
              <div className="rounded-2xl bg-slate-950 px-4 py-3 text-right text-white">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Unidades comparadas</span>
                <strong className="mt-1 block text-2xl leading-none">{metrics.length}</strong>
              </div>
            </div>
          </header>

          <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
            <div className="mr-auto flex items-center gap-2 text-sm font-bold text-slate-700"><SlidersHorizontal size={16} className="text-blue-600" /> Ajustar leitura</div>
            <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Ordenar por
              <select value={sortBy} onChange={event => setSortBy(event.target.value as typeof sortBy)} className="mt-1 block h-10 min-w-36 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-800 outline-none focus:border-blue-500">
                <option value="rank">Ranking</option><option value="revenue">Receita</option><option value="checkins">Check-ins</option><option value="active_students">Alunos ativos</option>
              </select>
            </label>
            <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Densidade
              <select value={density} onChange={event => setDensity(event.target.value as typeof density)} className="mt-1 block h-10 min-w-32 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-800 outline-none focus:border-blue-500">
                <option value="comfortable">Confortável</option><option value="compact">Compacta</option>
              </select>
            </label>
            <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={showChanges} onChange={event => setShowChanges(event.target.checked)} className="size-4 accent-blue-600" /> Variações
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className={`w-full min-w-[760px] text-left text-sm ${density === "compact" ? "[&_td]:py-2.5" : "[&_td]:py-4"}`}>
              <thead className="bg-white text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                <tr className="border-b border-slate-100"><th className="px-6 py-3">Posição e unidade</th><th className="px-4 py-3 text-right">Alunos ativos</th><th className="px-4 py-3 text-right">Check-ins</th>{showChanges && <th className="px-4 py-3">Variação dos acessos</th>}<th className="px-4 py-3 text-right">Receita recebida</th>{showChanges && <th className="px-4 py-3">Variação da receita</th>}<th className="px-6 py-3 text-right">Receita por aluno</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...metrics].sort((a,b) => sortBy === "rank" ? a.rank-b.rank : Number(b[sortBy])-Number(a[sortBy])).map(metric => (
                  <tr key={metric.id} className="transition-colors hover:bg-blue-50/40">
                    <td className="px-6"><div className="flex items-center gap-3"><span className={`grid size-9 shrink-0 place-items-center rounded-xl text-xs font-black ${metric.rank === 1 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>{metric.rank}º</span><strong className="text-slate-900">{metric.name}</strong></div></td>
                    <td className="px-4 text-right font-bold tabular-nums text-slate-800">{metric.active_students.toLocaleString("pt-BR")}</td>
                    <td className="px-4 text-right font-bold tabular-nums text-slate-800">{metric.checkins.toLocaleString("pt-BR")}</td>
                    {showChanges && <td className="px-4"><Variation value={metric.checkin_change} /></td>}
                    <td className="px-4 text-right font-black tabular-nums text-slate-950">{Number(metric.revenue).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</td>
                    {showChanges && <td className="px-4"><Variation value={metric.revenue_change} /></td>}
                    <td className="px-6 text-right font-semibold tabular-nums text-slate-600">{metric.revenue_per_student.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer className="border-t border-slate-100 bg-slate-50/50 px-6 py-3 text-xs text-slate-500">Receita considera caixa recebido; check-ins usam o período selecionado; alunos ativos refletem a base atual.</footer>
        </section>
      )}
    </DashboardLayout>
  );
}
