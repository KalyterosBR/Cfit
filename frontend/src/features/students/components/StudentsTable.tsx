import {
    Pencil,
    Power,
    RotateCcw,
    User,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import type { Student } from "../types/student";

interface StudentsTableProps {
    students: Student[];
    onEdit: (student: Student) => void;
    onToggleActive: (student: Student) => void;
}

export default function StudentsTable({
    students,
    onEdit,
    onToggleActive,
}: StudentsTableProps) {
    const navigate = useNavigate();

    if (students.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                    <User size={22} />
                </div>

                <h3 className="font-semibold text-slate-900">
                    Nenhum aluno encontrado
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                    Tente alterar a busca ou cadastre um novo aluno.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50">
                        <tr className="border-b border-slate-200">
                            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Aluno
                            </th>

                            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                CPF
                            </th>

                            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Telefone
                            </th>

                            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Status
                            </th>

                            <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Ações
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                        {students.map((student) => (
                            <tr
                                key={student.id}
                                className="transition-colors hover:bg-slate-50/80"
                            >
                                <td className="px-5 py-4">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            navigate(
                                                `/students/${student.id}`,
                                            )
                                        }
                                        className="flex items-center gap-3 text-left"
                                    >
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-semibold text-blue-600">
                                            {student.name
                                                .trim()
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>

                                        <div>
                                            <p className="font-semibold text-slate-900 transition hover:text-blue-600">
                                                {student.name}
                                            </p>

                                            <p className="text-xs text-slate-500">
                                                #{student.id}
                                            </p>
                                        </div>
                                    </button>
                                </td>

                                <td className="px-5 py-4 text-sm text-slate-600">
                                    {student.cpf ?? "-"}
                                </td>

                                <td className="px-5 py-4 text-sm text-slate-600">
                                    {student.phone ?? "-"}
                                </td>

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

                                <td className="px-5 py-4">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onEdit(student)
                                            }
                                            title="Editar aluno"
                                            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                                        >
                                            <Pencil size={17} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                onToggleActive(
                                                    student,
                                                )
                                            }
                                            title={
                                                student.active
                                                    ? "Inativar aluno"
                                                    : "Reativar aluno"
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
                                                <RotateCcw
                                                    size={17}
                                                />
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