import axios from "axios";
import { Building2, CheckCircle2, Pencil, Power } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";

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
};
type UnitForm = Pick<Unit, "name" | "code" | "address" | "phone">;
const emptyForm: UnitForm = { name: "", code: "", address: "", phone: "" };

export default function Units() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<UnitMetric[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [form, setForm] = useState<UnitForm>(emptyForm);
  const [editing, setEditing] = useState<Unit | null>(null);
  const [period, setPeriod] = useState(() =>
    new Date().toISOString().slice(0, 7),
  );

  async function load() {
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
      setMetrics(
        (
          await Api.get<UnitMetric[]>("/academies/units/comparison/", {
            params: { period },
          })
        ).data,
      );
    } catch {
      setMetrics([]);
      toast.error(
        "As unidades foram carregadas, mas a comparação não está disponível.",
      );
    }
  }
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
  }, [period]);

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
                setForm((current) => ({ ...current, phone: e.target.value }))
              }
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
                <dl className="mt-4 grid grid-cols-3 gap-2 border-y py-3 text-center">
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
                  </div>
                </dl>
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
    </DashboardLayout>
  );
}
