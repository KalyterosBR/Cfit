import {
    CheckCircle2,
    Clock3,
    AlertCircle,
} from "lucide-react";

const payments = [
    {
        name: "Carlos Henrique",
        plan: "Plano Mensal",
        value: "R$ 119,90",
        status: "Pago",
    },
    {
        name: "Mariana Souza",
        plan: "Plano Trimestral",
        value: "R$ 299,90",
        status: "Pago",
    },
    {
        name: "Lucas Almeida",
        plan: "Plano Mensal",
        value: "R$ 119,90",
        status: "Pendente",
    },
    {
        name: "Fernanda Lima",
        plan: "Plano Semestral",
        value: "R$ 549,90",
        status: "Atrasado",
    },
];

function Status({ status }: { status: string }) {
    if (status === "Pago") {
        return (
            <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <CheckCircle2 size={16} />
                Pago
            </span>
        );
    }

    if (status === "Pendente") {
        return (
            <span className="flex items-center gap-1.5 text-sm font-medium text-amber-600">
                <Clock3 size={16} />
                Pendente
            </span>
        );
    }

    return (
        <span className="flex items-center gap-1.5 text-sm font-medium text-red-600">
            <AlertCircle size={16} />
            Atrasado
        </span>
    );
}

export default function RecentPayments() {
    return (
        <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.28)] sm:p-6">
            <div className="mb-5">
                <h2 className="text-base font-bold text-slate-950">
                    Pagamentos recentes
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                    Últimas movimentações registradas
                </p>
            </div>

            <div className="divide-y divide-slate-100">
                {payments.map((payment) => (
                    <div
                        key={payment.name}
                        className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                    >
                        <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                                {payment.name}
                            </p>

                            <p className="text-sm text-slate-500">
                                {payment.plan}
                            </p>
                        </div>

                        <div className="text-right">
                            <p className="font-semibold text-slate-900">
                                {payment.value}
                            </p>

                            <Status status={payment.status} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
