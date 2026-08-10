import { useEffect, useState } from "react";
import axios from "axios";
import { X } from "lucide-react";

import Button from "../../../components/Button";
import Input from "../../../components/Input";

import {
    createEnrollment,
    type Enrollment,
} from "../services/enrollment.service";

import {
    getPlans,
    type Plan,
} from "../services/plan.service";

interface AddEnrollmentModalProps {
    studentId: string;
    enrollments: Enrollment[];
    onClose: () => void;
    onSuccess: () => void | Promise<void>;
}

export default function AddEnrollmentModal({
    studentId,
    enrollments,
    onClose,
    onSuccess,
}: AddEnrollmentModalProps) {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [planId, setPlanId] = useState("");

    const [contractedPrice, setContractedPrice] =
        useState("");

    const [startDate, setStartDate] = useState("");
    const [dueDate, setDueDate] = useState("");

    const [billingMethod, setBillingMethod] =
        useState<Enrollment["billing_method"]>(
            "monthly",
        );

    const [notes, setNotes] = useState("");

    const [loadingPlans, setLoadingPlans] =
        useState(true);

    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");

    useEffect(() => {
        async function loadPlans() {
            try {
                setLoadingPlans(true);
                setError("");

                const data = await getPlans();

                /*
                 * Planos que o aluno já possui com
                 * matrícula ativa ou congelada.
                 *
                 * Esses planos não poderão ser
                 * contratados novamente enquanto
                 * estiverem nesses status.
                 */
                const unavailablePlanIds = new Set(
                    enrollments
                        .filter(
                            (enrollment) =>
                                enrollment.status ===
                                "active" ||
                                enrollment.status ===
                                "frozen",
                        )
                        .map(
                            (enrollment) =>
                                enrollment.plan,
                        ),
                );

                /*
                 * Mostramos somente:
                 *
                 * 1. Planos ativos no cadastro.
                 * 2. Planos que o aluno ainda pode contratar.
                 */
                const availablePlans = data.filter(
                    (plan) =>
                        plan.active &&
                        !unavailablePlanIds.has(plan.id),
                );

                setPlans(availablePlans);
            } catch (error) {
                console.error(error);

                setError(
                    "Não foi possível carregar os planos.",
                );
            } finally {
                setLoadingPlans(false);
            }
        }

        loadPlans();
    }, [enrollments]);

    function handlePlanChange(id: string) {
        setPlanId(id);
        setError("");

        const selectedPlan = plans.find(
            (plan) => plan.id === id,
        );

        if (!selectedPlan) {
            setContractedPrice("");
            setDueDate("");
            return;
        }

        setContractedPrice(selectedPlan.price);

        if (startDate) {
            calculateDueDate(
                startDate,
                selectedPlan.duration_months,
            );
        }
    }

    function handleStartDateChange(value: string) {
        setStartDate(value);
        setError("");

        const selectedPlan = plans.find(
            (plan) => plan.id === planId,
        );

        if (!selectedPlan || !value) {
            setDueDate("");
            return;
        }

        calculateDueDate(
            value,
            selectedPlan.duration_months,
        );
    }

    function calculateDueDate(
        date: string,
        durationMonths: number,
    ) {
        const [year, month, day] = date
            .split("-")
            .map(Number);

        const due = new Date(
            year,
            month - 1 + durationMonths,
            day,
        );

        const dueYear = due.getFullYear();

        const dueMonth = String(
            due.getMonth() + 1,
        ).padStart(2, "0");

        const dueDay = String(
            due.getDate(),
        ).padStart(2, "0");

        setDueDate(
            `${dueYear}-${dueMonth}-${dueDay}`,
        );
    }

    async function handleSubmit() {
        if (!planId) {
            setError("Selecione um plano.");
            return;
        }

        if (!contractedPrice) {
            setError("Informe o valor contratado.");
            return;
        }

        if (!startDate) {
            setError("Informe a data de início.");
            return;
        }

        if (!dueDate) {
            setError("Informe a data de vencimento.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            await createEnrollment({
                student: studentId,
                plan: planId,

                contracted_price: contractedPrice,

                start_date: startDate,
                due_date: dueDate,

                status: "active",
                billing_method: billingMethod,

                notes,
            });

            await onSuccess();

            onClose();
        } catch (error) {
            console.error(error);

            if (axios.isAxiosError(error)) {
                const planError =
                    error.response?.data?.plan;

                if (
                    Array.isArray(planError) &&
                    planError.length > 0
                ) {
                    setError(String(planError[0]));
                    return;
                }

                if (typeof planError === "string") {
                    setError(planError);
                    return;
                }

                const detailError =
                    error.response?.data?.detail;

                if (
                    typeof detailError === "string"
                ) {
                    setError(detailError);
                    return;
                }

                const nonFieldErrors =
                    error.response?.data
                        ?.non_field_errors;

                if (
                    Array.isArray(nonFieldErrors) &&
                    nonFieldErrors.length > 0
                ) {
                    setError(
                        String(nonFieldErrors[0]),
                    );
                    return;
                }
            }

            setError(
                "Não foi possível adicionar o plano.",
            );
        } finally {
            setSaving(false);
        }
    }

    const hasAvailablePlans =
        plans.length > 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
                {/* CABEÇALHO */}
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Adicionar plano
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Crie uma nova matrícula para o
                            aluno.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* FORMULÁRIO */}
                <div className="space-y-5 p-6">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Plano
                        </label>

                        <select
                            value={planId}
                            disabled={
                                loadingPlans ||
                                saving ||
                                !hasAvailablePlans
                            }
                            onChange={(e) =>
                                handlePlanChange(
                                    e.target.value,
                                )
                            }
                            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                        >
                            <option value="">
                                {loadingPlans
                                    ? "Carregando planos..."
                                    : hasAvailablePlans
                                        ? "Selecione um plano"
                                        : "Nenhum plano disponível"}
                            </option>

                            {plans.map((plan) => (
                                <option
                                    key={plan.id}
                                    value={plan.id}
                                >
                                    {plan.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {!loadingPlans &&
                        !hasAvailablePlans && (
                            <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                                Este aluno já possui todos
                                os planos disponíveis ativos
                                ou congelados.
                            </div>
                        )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input
                            label="Valor contratado"
                            placeholder="99.90"
                            value={contractedPrice}
                            onChange={(e) => {
                                setContractedPrice(
                                    e.target.value,
                                );

                                setError("");
                            }}
                        />

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Forma de cobrança
                            </label>

                            <select
                                value={billingMethod}
                                disabled={saving}
                                onChange={(e) => {
                                    setBillingMethod(
                                        e.target
                                            .value as Enrollment["billing_method"],
                                    );

                                    setError("");
                                }}
                                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                            >
                                <option value="monthly">
                                    Mensal
                                </option>

                                <option value="full">
                                    À vista
                                </option>
                            </select>
                        </div>

                        <Input
                            label="Data de início"
                            type="date"
                            value={startDate}
                            onChange={(e) =>
                                handleStartDateChange(
                                    e.target.value,
                                )
                            }
                        />

                        <Input
                            label="Data de vencimento"
                            type="date"
                            value={dueDate}
                            onChange={(e) => {
                                setDueDate(
                                    e.target.value,
                                );

                                setError("");
                            }}
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Observações
                        </label>

                        <textarea
                            value={notes}
                            disabled={saving}
                            onChange={(e) => {
                                setNotes(e.target.value);
                                setError("");
                            }}
                            placeholder="Observações sobre esta matrícula..."
                            rows={3}
                            className="w-full resize-none rounded-xl border border-slate-300 px-3 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                        />
                    </div>

                    {error && (
                        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                            {error}
                        </div>
                    )}
                </div>

                {/* AÇÕES */}
                <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-5">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Cancelar
                    </Button>

                    <Button
                        type="button"
                        loading={saving}
                        disabled={
                            saving ||
                            loadingPlans ||
                            !hasAvailablePlans
                        }
                        onClick={handleSubmit}
                    >
                        Adicionar plano
                    </Button>
                </div>
            </div>
        </div>
    );
}