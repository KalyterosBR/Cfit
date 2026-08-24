import { Pencil, Power, RotateCcw, User } from "lucide-react";

import { useNavigate } from "react-router-dom";

import type { Student } from "../types/student";

interface StudentsTableProps {
  students: Student[];
  emptyTitle?: string;
  emptyDescription?: string;
  onEdit: (student: Student) => void;
  onToggleActive: (student: Student) => void;
  visibleColumns?: string[];
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
      className: "bg-emerald-50 text-emerald-700",
    },
    attention: {
      label: "Atenção",
      className: "bg-amber-50 text-amber-700",
    },
    pending: { label: "Pendente", className: "bg-orange-50 text-orange-700" },
    defaulting: {
      label: "Inadimplente",
      className: "bg-red-50 text-red-700",
    },
    inconsistency: {
      label: "Inconsistência",
      className: "bg-purple-50 text-purple-700",
    },
    no_financial_link: {
      label: "Sem vínculo financeiro",
      className: "bg-slate-100 text-slate-600",
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
    <div className="overflow-hidden rounded-[1.15rem] border border-slate-200/90">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#f8fafc]">
            <tr className="border-b border-slate-200">
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Aluno
              </th>

              {visibleColumns.includes("plan") && (
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Plano atual
                </th>
              )}

              {visibleColumns.includes("financial") && (
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Financeiro
                </th>
              )}

              {visibleColumns.includes("health") && (
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Health Score
                </th>
              )}

              {visibleColumns.includes("due") && (
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Próximo vencimento
                </th>
              )}

              {visibleColumns.includes("frequency") && (
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Frequência
                </th>
              )}

              {visibleColumns.includes("status") && (
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
              )}

              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Ações
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {students.map((student) => (
              <tr
                key={student.id}
                className="transition-colors hover:bg-blue-50/35"
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
                      <p className="mt-0.5 whitespace-nowrap text-xs text-slate-400">
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
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${financialStatus[student.financial_status].className}`}
                    >
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
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${student.health_status === "risk" ? "bg-red-50 text-red-700" : student.health_status === "attention" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}
                    >
                      {student.health_score}/100
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
                    <p className="mt-0.5 whitespace-nowrap text-xs text-slate-400">
                      Último: {formatDateTime(student.last_checkin_at)}
                    </p>
                  </td>
                )}

                {visibleColumns.includes("status") && (
                  <td className="px-5 py-4">
                    {student.active ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
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
