import { Pencil, Power, RotateCcw, User } from "lucide-react";

import { useNavigate } from "react-router-dom";
import { SkeletonBlock } from "@/components/AsyncState";

import type { Student } from "../types/student";

interface StudentsTableProps {
  students: Student[];
  emptyTitle?: string;
  emptyDescription?: string;
  onEdit: (student: Student) => void;
  onToggleActive: (student: Student) => void;
  visibleColumns?: string[];
}

export function StudentsTableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-[var(--cfit-radius-card)] border border-slate-200/80 bg-white" aria-label="Carregando alunos" aria-busy="true">
      <div className="overflow-x-auto">
        <table className="cfit-data-table w-full min-w-[980px] text-left">
          <thead className="cfit-table-header bg-[#f8fafc]">
            <tr className="border-b border-slate-200/80">
              {["Aluno", "Plano atual", "Financeiro", "Health Score", "Vencimento", "Frequência", "Status", "Ações"].map((label) => (
                <th key={label} className="px-5 py-3.5 text-xs font-semibold text-slate-500">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, index) => (
              <tr key={index} className="border-b border-[var(--cfit-table-divider)] last:border-b-0">
                <td className="px-5 py-4"><div className="flex items-center gap-3"><SkeletonBlock className="h-10 w-10 rounded-xl" /><div><SkeletonBlock className="h-3 w-32" /><SkeletonBlock className="mt-2 h-2.5 w-40" /></div></div></td>
                {[1, 2, 3, 4, 5, 6].map((cell) => <td key={cell} className="px-5 py-4"><SkeletonBlock className="h-6 w-24 rounded-full" /></td>)}
                <td className="px-5 py-4"><div className="flex justify-end gap-2"><SkeletonBlock className="h-9 w-9 rounded-lg" /><SkeletonBlock className="h-9 w-9 rounded-lg" /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function StudentsTable({
  students,
  emptyTitle = "Nenhum aluno encontrado",
  emptyDescription = "Tente alterar a busca ou cadastre um novo aluno.",
  onEdit,
  onToggleActive,
  visibleColumns = ["plan", "financial", "due", "frequency", "status"],
}: StudentsTableProps) {
  const navigate = useNavigate();

  function formatDate(date: string | null) {
    if (!date) return "—";

    return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");
  }

  function formatDateTime(date: string | null) {
    if (!date) return "Sem check-in";

    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const financialStatus = {
    regular: {
      label: "Regular",
      tone: "success",
    },
    attention: {
      label: "Atenção",
      tone: "warning",
    },
    pending: { label: "Pendente", tone: "info" },
    defaulting: {
      label: "Inadimplente",
      tone: "danger",
    },
    inconsistency: {
      label: "Inconsistência",
      tone: "inconsistency",
    },
    no_financial_link: {
      label: "Sem vínculo financeiro",
      tone: "neutral",
    },
  } as const;

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <User size={22} />
        </div>

        <h3 className="font-semibold text-slate-900">{emptyTitle}</h3>

        <p className="mt-1 text-sm text-slate-500">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--cfit-radius-card)] border border-slate-200/80 bg-white">
      <div className="overflow-x-auto overscroll-x-contain">
        <table className="cfit-data-table w-full text-left">
          <thead className="cfit-table-header bg-[#f8fafc]">
            <tr className="border-b border-slate-200/80">
              <th className="px-5 py-3.5 text-xs font-semibold text-slate-500">
                Aluno
              </th>

              {visibleColumns.includes("plan") && (
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-500">
                  Plano atual
                </th>
              )}

              {visibleColumns.includes("financial") && (
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-500">
                  Financeiro
                </th>
              )}

              {visibleColumns.includes("health") && (
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-500">
                  Health Score
                </th>
              )}

              {visibleColumns.includes("due") && (
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-500">
                  Próximo vencimento
                </th>
              )}

              {visibleColumns.includes("frequency") && (
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-500">
                  Frequência
                </th>
              )}

              {visibleColumns.includes("status") && (
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-500">
                  Status
                </th>
              )}

              <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500">
                Ações
              </th>
            </tr>
          </thead>

          <tbody>
            {students.map((student) => (
              <tr
                key={student.id}
                className="border-b border-[var(--cfit-table-divider)] transition-colors last:border-b-0"
              >
                <td className="px-5 py-4">
                  <button
                    type="button"
                    onClick={() => navigate(`/students/${student.id}`)}
                    className="flex items-center gap-3 text-left"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 font-bold text-white shadow-[0_8px_20px_-12px_rgba(37,99,235,0.75)]">
                      {student.name.trim().charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <p className="font-semibold text-slate-900 transition hover:text-blue-600">
                        {student.name}
                      </p>
                      <p className="mt-0.5 whitespace-nowrap text-xs text-slate-500">
                        {student.cpf ?? "CPF não informado"}
                        {student.phone ? ` · ${student.phone}` : ""}
                      </p>
                    </div>
                  </button>
                </td>

                {visibleColumns.includes("plan") && (
                  <td className="px-5 py-4 text-sm font-medium text-slate-700">
                    {student.current_plan_name ?? "Sem plano ativo"}
                  </td>
                )}

                {visibleColumns.includes("financial") && (
                  <td className="px-5 py-4">
                    <span
                      data-tone={financialStatus[student.financial_status].tone}
                      className="cfit-chip"
                    >
                      <span aria-hidden="true" className="cfit-chip-dot" />
                      {financialStatus[student.financial_status].label}
                    </span>
                  </td>
                )}

                {visibleColumns.includes("health") && (
                  <td className="px-5 py-4">
                    <span
                      title={student.health_factors
                        .map((factor) => factor.label)
                        .join(" · ")}
                      data-tone={student.health_status === "risk" ? "danger" : student.health_status === "attention" ? "warning" : "success"}
                      className="cfit-chip"
                    >
                      <span aria-hidden="true" className="cfit-chip-dot" />
                      {student.health_score} · {student.health_status === "risk" ? "Alto risco" : student.health_status === "attention" ? "Atenção" : "Saudável"}
                    </span>
                  </td>
                )}

                {visibleColumns.includes("due") && (
                  <td className="px-5 py-4 text-sm font-medium text-slate-700">
                    {formatDate(student.next_due_date)}
                  </td>
                )}

                {visibleColumns.includes("frequency") && (
                  <td className="px-5 py-4">
                    <p className="whitespace-nowrap text-sm font-semibold text-slate-700">
                      {student.checkins_last_30_days} em 30 dias
                    </p>
                    <p className="mt-0.5 whitespace-nowrap text-xs text-slate-500">
                      Último: {formatDateTime(student.last_checkin_at)}
                    </p>
                  </td>
                )}

                {visibleColumns.includes("status") && (
                  <td className="px-5 py-4">
                    {student.active ? (
                      <span className="cfit-chip" data-tone="success">
                        <span aria-hidden="true" className="cfit-chip-dot" />
                        Ativo
                      </span>
                    ) : (
                      <span className="cfit-chip" data-tone="danger">
                        <span aria-hidden="true" className="cfit-chip-dot" />
                        Inativo
                      </span>
                    )}
                  </td>
                )}

                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(student)}
                      title="Editar aluno"
                      aria-label={`Editar ${student.name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleActive(student)}
                      title={
                        student.active ? "Inativar aluno" : "Reativar aluno"
                      }
                      aria-label={`${student.active ? "Inativar" : "Reativar"} ${student.name}`}
                      className={
                        student.active
                          ? "flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-amber-50 hover:text-amber-600"
                          : "flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600"
                      }
                    >
                      {student.active ? (
                        <Power size={17} />
                      ) : (
                        <RotateCcw size={17} />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
