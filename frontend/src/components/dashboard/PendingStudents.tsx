import {
    AlertTriangle,
    ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";

import type { Charge } from "@/features/students/services/financial.service";


type PendingStudentsProps = {
    charges: Charge[];
    loading: boolean;
    error: boolean;
    onRetry: () => void;
    variant?: "card" | "canvas";
};


function formatMoney(value: string) {
    return Number(value).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}


function getDaysLate(dueDate: string) {
    const due = new Date(`${dueDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Math.max(
        1,
        Math.floor((today.getTime() - due.getTime()) / 86_400_000),
    );
}

export default function PendingStudents({
    charges,
    loading,
    error,
    onRetry,
    variant = "card",
}: PendingStudentsProps) {
    return (
        <div className={variant === "canvas" ? "min-w-0 overflow-hidden border-y border-slate-200/80 px-5 py-7 sm:px-7 lg:px-8 2xl:border-l" : "min-w-0 overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.28)] sm:p-6"}>
            <div className="mb-5 flex items-start justify-between">
                <div>
                    <h2 className="text-base font-bold text-slate-950">
                        Cobranças vencidas
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                        Prioridade por maior tempo de atraso
                    </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <AlertTriangle size={20} />
                </div>
            </div>

            {loading ? (
                <div className="space-y-3" aria-label="Carregando cobranças vencidas">
                    {[1, 2, 3].map((item) => (
                        <div key={item} className="h-14 animate-pulse rounded-xl bg-slate-100" />
                    ))}
                </div>
            ) : error ? (
                <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                    <p>Não foi possível carregar as cobranças vencidas.</p>
                    <button
                        type="button"
                        onClick={onRetry}
                        className="mt-2 font-semibold underline underline-offset-4"
                    >
                        Tentar novamente
                    </button>
                </div>
            ) : charges.length === 0 ? (
                <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
                    Nenhuma cobrança vencida requer atenção agora.
                </div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {charges.map((charge) => {
                        const daysLate = getDaysLate(charge.due_date);

                        return (
                            <Link
                                key={charge.id}
                                to={`/finance?charge=${charge.id}#charges`}
                                className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0 hover:text-blue-600"
                            >
                                <div className="min-w-0">
                                    <p className="truncate font-semibold text-slate-900">
                                        {charge.student_name}
                                    </p>

                                    <p className="text-sm text-slate-500">
                                        {charge.plan_name} • {daysLate} {daysLate === 1 ? "dia" : "dias"}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="whitespace-nowrap font-semibold text-slate-900">
                                        {formatMoney(charge.amount)}
                                    </span>

                                    <ChevronRight
                                        size={18}
                                        className="text-slate-400"
                                    />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
