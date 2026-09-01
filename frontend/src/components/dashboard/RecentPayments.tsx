import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { SkeletonBlock } from "@/components/AsyncState";
import RecordList from "@/components/RecordList";

import type { Charge } from "@/features/students/services/financial.service";


type PaymentItem = Pick<
    Charge,
    "id" | "student" | "student_name" | "plan_name" | "amount" | "payment_method"
>;


type RecentPaymentsProps = {
    payments?: PaymentItem[];
    loading?: boolean;
    error?: boolean;
    onRetry?: () => void;
    periodLabel?: string;
    linkToFinance?: boolean;
    variant?: "card" | "canvas";
};


const paymentMethodLabels: Record<string, string> = {
    pix: "Pix",
    cash: "Dinheiro",
    debit_card: "Cartão de débito",
    credit_card: "Cartão de crédito",
    bank_transfer: "Transferência bancária",
};


const demoPayments: PaymentItem[] = [
    {
        id: "demo-1",
        student: "",
        student_name: "Carlos Henrique",
        plan_name: "Plano Mensal",
        amount: "119.90",
        payment_method: "pix",
    },
    {
        id: "demo-2",
        student: "",
        student_name: "Mariana Souza",
        plan_name: "Plano Trimestral",
        amount: "299.90",
        payment_method: "credit_card",
    },
];


function formatMoney(value: string) {
    return Number(value).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}


export default function RecentPayments({
    payments = demoPayments,
    loading = false,
    error = false,
    onRetry = () => undefined,
    periodLabel,
    linkToFinance = false,
    variant = "card",
}: RecentPaymentsProps) {
    return (
        <div className={variant === "canvas" ? "border-l border-slate-200/80 pb-7 pl-6 pt-3 lg:pl-8" : "rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.28)] sm:p-6"}>
            <div className="mb-5">
                <h2 className="text-base font-bold text-slate-950">
                    Pagamentos recentes
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                    {periodLabel
                        ? `Recebimentos em ${periodLabel}`
                        : "Últimos recebimentos registrados"}
                </p>
            </div>

            {loading ? (
                <RecordList aria-label="Carregando pagamentos recentes" aria-busy="true">
                    {[1, 2, 3].map((item) => (
                        <div key={item} className="flex h-[4.5rem] items-center justify-between gap-4">
                            <div className="flex-1"><SkeletonBlock className="h-3 w-32" /><SkeletonBlock className="mt-2 h-2.5 w-24" /></div>
                            <div className="flex flex-col items-end"><SkeletonBlock className="h-3 w-20" /><SkeletonBlock className="mt-2 h-2.5 w-14" /></div>
                        </div>
                    ))}
                </RecordList>
            ) : error ? (
                <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                    <p>Não foi possível carregar os pagamentos recentes.</p>
                    <button
                        type="button"
                        onClick={onRetry}
                        className="mt-2 font-semibold underline underline-offset-4"
                    >
                        Tentar novamente
                    </button>
                </div>
            ) : payments.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                    {periodLabel
                        ? `Nenhum pagamento foi registrado em ${periodLabel}.`
                        : "Nenhum pagamento foi registrado até o momento."}
                </div>
            ) : (
                <RecordList>
                    {payments.map((payment) => (
                        <Link
                            key={payment.id}
                            to={linkToFinance
                                ? `/finance?charge=${payment.id}#charges`
                                : payment.student
                                    ? `/students/${payment.student}`
                                    : "#"}
                            onClick={(event) => {
                                if (!linkToFinance && !payment.student) {
                                    event.preventDefault();
                                }
                            }}
                            className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                        >
                            <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-900">
                                    {payment.student_name}
                                </p>

                                <p className="truncate text-sm text-slate-500">
                                    {payment.plan_name}
                                </p>
                            </div>

                            <div className="text-right">
                                <p className="font-semibold text-slate-900">
                                    {formatMoney(payment.amount)}
                                </p>

                                <span className="flex items-center justify-end gap-1.5 text-xs font-medium text-emerald-600">
                                    <CheckCircle2 size={14} />
                                    {payment.payment_method
                                        ? paymentMethodLabels[payment.payment_method]
                                        : "Pago"}
                                </span>
                            </div>
                        </Link>
                    ))}
                </RecordList>
            )}
        </div>
    );
}
