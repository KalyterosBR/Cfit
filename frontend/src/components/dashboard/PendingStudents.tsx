import {
    AlertTriangle,
    ChevronRight,
} from "lucide-react";

const students = [
    {
        name: "Pedro Henrique",
        plan: "Plano Mensal",
        daysLate: 2,
        value: "R$ 119,90",
    },
    {
        name: "Juliana Costa",
        plan: "Plano Mensal",
        daysLate: 4,
        value: "R$ 119,90",
    },
    {
        name: "Bruno Oliveira",
        plan: "Plano Trimestral",
        daysLate: 6,
        value: "R$ 299,90",
    },
    {
        name: "Larissa Mendes",
        plan: "Plano Mensal",
        daysLate: 7,
        value: "R$ 119,90",
    },
];

export default function PendingStudents() {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">
                        Pagamentos pendentes
                    </h2>

                    <p className="text-sm text-slate-500">
                        Alunos que precisam de atenção
                    </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <AlertTriangle size={20} />
                </div>
            </div>

            <div className="divide-y divide-slate-100">
                {students.map((student) => (
                    <div
                        key={student.name}
                        className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                    >
                        <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                                {student.name}
                            </p>

                            <p className="text-sm text-slate-500">
                                {student.plan} • {student.daysLate} dias
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="whitespace-nowrap font-semibold text-slate-900">
                                {student.value}
                            </span>

                            <ChevronRight
                                size={18}
                                className="text-slate-400"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}