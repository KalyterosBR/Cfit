import { useCallback, useEffect, useState } from "react";

import { ChevronLeft, ChevronRight, Clock, Footprints } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import PageHeader from "@/components/PageHeader";
import {
  getAccessSummary,
  getCheckIns,
  type AccessSummary,
  type CheckIn,
} from "@/features/students/services/checkin.service";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Api } from "@/services/http";
import toast from "react-hot-toast";

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function CheckIns() {
  const [searchParams] = useSearchParams();
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [from, setFrom] = useState(() => searchParams.get("from") ?? today());
  const [to, setTo] = useState(() => searchParams.get("to") ?? today());
  const [source, setSource] = useState<"all" | CheckIn["source"]>("all");
  const [accessResult, setAccessResult] = useState<
    "all" | CheckIn["access_result"]
  >("all");
  const [summary, setSummary] = useState<AccessSummary | null>(null);
  const [page, setPage] = useState(1);
  const [next, setNext] = useState<string | null>(null);
  const [previous, setPrevious] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [policy, setPolicy] = useState<{
    require_active_enrollment: boolean;
    block_defaulting_students: boolean;
    allow_manual_contingency: boolean;
    instructions: string;
  } | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    Api.get("/checkins/access-policy/")
      .then((response) => setPolicy(response.data))
      .catch(() => undefined);
  }, []);
  async function savePolicy() {
    if (!policy) return;
    try {
      setPolicy(
        (
          await Api.patch("/checkins/access-policy/", {
            ...policy,
            reason: "Atualização da política de acesso",
          })
        ).data,
      );
      toast.success("Política de acesso atualizada.");
    } catch {
      toast.error("Não foi possível atualizar a política de acesso.");
    }
  }

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const [data, summaryData] = await Promise.all([
        getCheckIns({
          page,
          checkedInFrom: from,
          checkedInTo: to,
          source,
          accessResult,
        }),
        getAccessSummary({
          checkedInFrom: from,
          checkedInTo: to,
          source,
          accessResult,
        }),
      ]);
      setCheckins(data.results);
      setNext(data.next);
      setPrevious(data.previous);
      setSummary(summaryData);
    } catch (requestError) {
      console.error(requestError);
      setCheckins([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [accessResult, from, page, source, to]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    if (!live) return;
    const refresh = () => {
      Api.get("/operations/devices/monitor/")
        .then((response) => setCheckins(response.data.events))
        .catch(() => setLive(false));
    };
    refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => window.clearInterval(timer);
  }, [live]);

  return (
    <DashboardLayout>
      <PageHeader
        title="Check-ins"
        subtitle="Consulte os acessos reais registrados na academia."
        eyebrow="Controle de acesso"
        context="Movimento, decisão e contingência"
        actions={
          <button
            type="button"
            onClick={() => setLive((value) => !value)}
            className={`h-10 rounded-xl px-4 text-sm font-bold ${live ? "bg-emerald-600 text-white" : "border bg-white text-slate-700"}`}
          >
            {live ? "Monitor ao vivo ligado" : "Abrir monitor ao vivo"}
          </button>
        }
      />
      {policy && (
        <details className="mb-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
          <summary className="cursor-pointer font-black text-slate-900">Configurar política da unidade ativa <span className="ml-2 text-xs font-medium text-slate-500">Área administrativa separada da consulta operacional</span></summary>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <label className="flex items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={policy.require_active_enrollment}
                onChange={(e) =>
                  setPolicy(
                    (current) =>
                      current && {
                        ...current,
                        require_active_enrollment: e.target.checked,
                      },
                  )
                }
              />{" "}
              Exigir matrícula ativa
            </label>
            <label className="flex items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={policy.block_defaulting_students}
                onChange={(e) =>
                  setPolicy(
                    (current) =>
                      current && {
                        ...current,
                        block_defaulting_students: e.target.checked,
                      },
                  )
                }
              />{" "}
              Bloquear inadimplentes
            </label>
            <label className="flex items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={policy.allow_manual_contingency}
                onChange={(e) =>
                  setPolicy(
                    (current) =>
                      current && {
                        ...current,
                        allow_manual_contingency: e.target.checked,
                      },
                  )
                }
              />{" "}
              Permitir contingência manual
            </label>
            <input
              value={policy.instructions}
              onChange={(e) =>
                setPolicy(
                  (current) =>
                    current && { ...current, instructions: e.target.value },
                )
              }
              placeholder="Orientação exibida à recepção"
              className="h-10 rounded-xl border px-3 md:col-span-2"
            />
            <button
              type="button"
              onClick={savePolicy}
              className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white"
            >
              Salvar política
            </button>
          </div>
        </details>
      )}
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Acessos no período",
            value: summary?.total_count ?? 0,
            className: "text-blue-700",
          },
          {
            label: "Liberados",
            value: summary?.allowed_count ?? 0,
            className: "text-emerald-700",
          },
          {
            label: "Bloqueados",
            value: summary?.blocked_count ?? 0,
            className: "text-red-700",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              {item.label}
            </p>
            <p className={`mt-2 text-3xl font-black ${item.className}`}>
              {item.value.toLocaleString("pt-BR")}
            </p>
          </div>
        ))}
      </div>
      <div className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-200 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
          <label className="text-xs font-semibold text-slate-600">
            De
            <input
              type="date"
              value={from}
              onChange={(event) => {
                setFrom(event.target.value);
                setPage(1);
              }}
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3"
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Até
            <input
              type="date"
              value={to}
              min={from}
              onChange={(event) => {
                setTo(event.target.value);
                setPage(1);
              }}
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3"
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Origem
            <select
              value={source}
              onChange={(event) => {
                setSource(event.target.value as "all" | CheckIn["source"]);
                setPage(1);
              }}
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3"
            >
              <option value="all">Todas</option>
              <option value="manual">Manual</option>
              <option value="access_control">Controle de acesso</option>
              <option value="facial_recognition">Reconhecimento facial</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Resultado
            <select
              value={accessResult}
              onChange={(event) => {
                setAccessResult(
                  event.target.value as "all" | CheckIn["access_result"],
                );
                setPage(1);
              }}
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3"
            >
              <option value="all">Todos</option>
              <option value="allowed">Liberados</option>
              <option value="blocked">Bloqueados</option>
            </select>
          </label>
        </div>
        {loading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-10 text-center text-red-700">
            <p>Não foi possível carregar os check-ins.</p>
            <button
              type="button"
              onClick={load}
              className="mt-3 font-bold underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : checkins.length === 0 ? (
          <div className="p-10 text-center">
            <Footprints className="mx-auto text-slate-300" />
            <p className="mt-3 font-semibold text-slate-800">
              Nenhum acesso neste período
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Ajuste as datas ou a origem para ampliar a consulta.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {checkins.map((checkin) => (
              <Link
                key={checkin.id}
                to={`/students/${checkin.student}`}
                className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50 sm:px-6"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900">
                      {checkin.student_name}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${checkin.access_result === "blocked" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
                    >
                      {checkin.access_result_label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {checkin.source_label}
                    {checkin.equipment ? ` · ${checkin.equipment}` : ""}
                    {checkin.location ? ` · ${checkin.location}` : ""}
                    {checkin.block_reason ? ` · ${checkin.block_reason}` : ""}
                  </p>
                  {checkin.device_response && (
                    <p className="mt-1 text-xs text-slate-400">
                      Resposta do equipamento: {checkin.device_response}
                    </p>
                  )}
                </div>
                <span className="flex items-center gap-2 text-sm text-slate-500">
                  <Clock size={15} />
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(new Date(checkin.checked_in_at))}
                </span>
              </Link>
            ))}
          </div>
        )}
        {(previous || next) && (
          <div className="flex justify-end gap-2 border-t border-slate-200 p-4">
            <button
              type="button"
              disabled={!previous}
              onClick={() => setPage((value) => value - 1)}
              className="h-9 rounded-lg border px-3 disabled:opacity-40"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              disabled={!next}
              onClick={() => setPage((value) => value + 1)}
              className="h-9 rounded-lg bg-blue-600 px-3 text-white disabled:opacity-40"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
