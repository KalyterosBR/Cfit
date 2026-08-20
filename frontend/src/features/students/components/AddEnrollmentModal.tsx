import { useEffect, useState } from "react";
import axios from "axios";
import { X } from "lucide-react";

import Button from "../../../components/Button";
import Input from "../../../components/Input";

import {
    createEnrollment,
    previewEnrollmentCharges,
    type Enrollment,
    type EnrollmentChargePreview,
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
    const [discountAmount, setDiscountAmount] = useState("0.00");
    const [discountReason, setDiscountReason] = useState("");

    const [startDate, setStartDate] = useState("");
    const [dueDate, setDueDate] = useState("");

    const [billingMethod, setBillingMethod] =
        useState<Enrollment["billing_method"]>(
            "monthly",
        );

    const [notes, setNotes] = useState("");
    const [contractAccepted, setContractAccepted] = useState(false);
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [chargePreview, setChargePreview] =
        useState<EnrollmentChargePreview | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);

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
                        plan.available_for_enrollment &&
                        Boolean(plan.contract_text.trim()) &&
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
        setContractAccepted(false);
        setDiscountAmount("0.00");
        setDiscountReason("");
        setChargePreview(null);

        const selectedPlan = plans.find(
            (plan) => plan.id === id,
        );

        if (!selectedPlan) {
            setContractedPrice("");
            setDueDate("");
            return;
        }

        setContractedPrice(selectedPlan.price);
        setBillingMethod(
            selectedPlan.billing_period === "one_time"
                ? "full"
                : "monthly",
        );

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

        const selectedPlan = plans.find((plan) => plan.id === planId);

        if (selectedPlan?.contract_text && !contractAccepted) {
            setError("Confirme o aceite do contrato para concluir a matrícula.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            await createEnrollment({
                student: studentId,
                plan: planId,
                discount_amount: discountAmount || "0.00",
                discount_reason: discountReason.trim(),

                start_date: startDate,
                due_date: dueDate,

                status: "active",
                billing_method: billingMethod,

                notes,
                contract_accepted: contractAccepted,
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

                const contractError =
                    error.response?.data?.contract_accepted;

                if (Array.isArray(contractError) && contractError.length > 0) {
                    setError(String(contractError[0]));
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
    const selectedPlan = plans.find((plan) => plan.id === planId) ?? null;
    const billingCycleMonths = selectedPlan
        ? {
            monthly: 1,
            quarterly: 3,
            semiannual: 6,
            annual: 12,
            one_time: selectedPlan.duration_months,
        }[selectedPlan.billing_period]
        : 1;
    const planChargeCount = selectedPlan
        ? billingMethod === "full" || selectedPlan.billing_period === "one_time"
            ? 1
            : Math.ceil(selectedPlan.duration_months / billingCycleMonths)
        : 0;
    const estimatedChargeCount = selectedPlan
        ? planChargeCount + (Number(selectedPlan.enrollment_fee) > 0 ? 1 : 0)
        : 0;

    function formatMoney(value: string) {
        return Number(value).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        });
    }

    async function handleContinue() {
        if (step === 1) {
            if (!planId) {
                setError("Selecione um plano.");
                return;
            }

            if (!startDate || !dueDate) {
                setError("Informe as datas de início e vencimento.");
                return;
            }

            const selectedPlan = plans.find((plan) => plan.id === planId);
            const discount = Number(discountAmount || 0);

            if (!selectedPlan || discount < 0 || discount > Number(selectedPlan.price)) {
                setError("Informe um desconto válido.");
                return;
            }

            if (discount > 0 && !discountReason.trim()) {
                setError("Informe a justificativa do desconto.");
                return;
            }

            setError("");
            setStep(2);
            return;
        }

        if (step === 2) {
            if (selectedPlan?.contract_text && !contractAccepted) {
                setError("Confirme o aceite do contrato para continuar.");
                return;
            }

            try {
                setLoadingPreview(true);
                setError("");
                const preview = await previewEnrollmentCharges({
                    plan: planId,
                    discount_amount: discountAmount || "0.00",
                    discount_reason: discountReason.trim(),
                    due_date: dueDate,
                    billing_method: billingMethod,
                });

                setChargePreview(preview);
                setContractedPrice(preview.final_price);
                setStep(3);
            } catch (previewError) {
                console.error(previewError);
                setError("Não foi possível calcular as cobranças. Revise os dados e tente novamente.");
            } finally {
                setLoadingPreview(false);
            }
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
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

                        <p className="mt-2 text-xs font-semibold text-blue-600">
                            Etapa {step} de 3 · {step === 1 ? "Condições" : step === 2 ? "Contrato" : "Confirmação"}
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
                <div className="space-y-5 overflow-y-auto p-6">
                    {step === 1 && (
                        <>
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

                    {selectedPlan && (
                        <div className="grid gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Plano</p>
                                <p className="mt-1 text-sm font-bold text-slate-800">{selectedPlan.name}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Valor total</p>
                                <p className="mt-1 text-sm font-bold text-slate-800">{formatMoney(contractedPrice)}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Cobrança</p>
                                <p className="mt-1 text-sm font-bold text-slate-800">{selectedPlan.billing_period_label}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Cobranças previstas</p>
                                <p className="mt-1 text-sm font-bold text-slate-800">{estimatedChargeCount}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Taxa de matrícula</p>
                                <p className="mt-1 text-sm font-bold text-slate-800">{formatMoney(selectedPlan.enrollment_fee)}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Fidelidade</p>
                                <p className="mt-1 text-sm font-bold text-slate-800">
                                    {selectedPlan.minimum_commitment_months > 0
                                        ? `${selectedPlan.minimum_commitment_months} meses`
                                        : "Sem fidelidade"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Recorrência</p>
                                <p className="mt-1 text-sm font-bold text-slate-800">
                                    {selectedPlan.recurring ? "Recorrente" : "Não recorrente"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Contrato</p>
                                <p className="mt-1 text-sm font-bold text-slate-800">Versão {selectedPlan.contract_version}</p>
                            </div>
                        </div>
                    )}

                    {!loadingPlans &&
                        !hasAvailablePlans && (
                            <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                                Não há planos disponíveis com contrato configurado para este aluno.
                            </div>
                        )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input
                            label="Valor final"
                            placeholder="99.90"
                            value={contractedPrice}
                            readOnly
                        />

                        <Input
                            label="Desconto"
                            type="number"
                            min="0"
                            step="0.01"
                            value={discountAmount}
                            onChange={(e) => {
                                const value = e.target.value;
                                setDiscountAmount(value);
                                setContractedPrice(
                                    selectedPlan
                                        ? Math.max(
                                            0,
                                            Number(selectedPlan.price) - Number(value || 0),
                                        ).toFixed(2)
                                        : "",
                                );
                                setChargePreview(null);
                                setError("");
                            }}
                        />

                        {Number(discountAmount) > 0 && (
                            <div className="sm:col-span-2">
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Justificativa do desconto <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={discountReason}
                                    onChange={(event) => {
                                        setDiscountReason(event.target.value);
                                        setChargePreview(null);
                                        setError("");
                                    }}
                                    maxLength={500}
                                    rows={2}
                                    disabled={saving}
                                    placeholder="Informe por que este desconto foi concedido."
                                    className="w-full resize-none rounded-xl border border-slate-300 px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                        )}

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

                        </>
                    )}

                    {step === 2 && (
                        <>
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

                    {selectedPlan?.contract_text && (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                            <details>
                                <summary className="cursor-pointer text-sm font-semibold text-blue-700">
                                    Pré-visualizar contrato e regras
                                </summary>
                                <div className="mt-4 space-y-4 text-sm text-slate-600">
                                    {selectedPlan.modalities && <p><strong>Modalidades:</strong> {selectedPlan.modalities}</p>}
                                    {selectedPlan.benefits && <p><strong>Benefícios:</strong> {selectedPlan.benefits}</p>}
                                    {selectedPlan.access_rules && <p><strong>Acesso:</strong> {selectedPlan.access_rules}</p>}
                                    {selectedPlan.cancellation_rules && <p><strong>Cancelamento:</strong> {selectedPlan.cancellation_rules}</p>}
                                    {selectedPlan.freeze_rules && <p><strong>Trancamento:</strong> {selectedPlan.freeze_rules}</p>}
                                    <div className="whitespace-pre-wrap border-t border-slate-200 pt-4 leading-6">
                                        {selectedPlan.contract_text}
                                    </div>
                                </div>
                            </details>

                            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl bg-white p-3">
                                <input
                                    type="checkbox"
                                    checked={contractAccepted}
                                    onChange={(event) => {
                                        setContractAccepted(event.target.checked);
                                        setError("");
                                    }}
                                    disabled={saving}
                                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600"
                                />
                                <span className="text-sm font-medium text-slate-700">
                                    Confirmo que o contrato versão {selectedPlan.contract_version} foi apresentado e aceito pelo aluno.
                                </span>
                            </label>
                        </div>
                    )}
                        </>
                    )}

                    {step === 3 && chargePreview && selectedPlan && (
                        <div className="space-y-5">
                            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                                <h3 className="font-bold text-slate-900">Resumo final da matrícula</h3>
                                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    <div><p className="text-xs text-slate-400">Plano</p><p className="mt-1 text-sm font-bold text-slate-800">{selectedPlan.name}</p></div>
                                    <div><p className="text-xs text-slate-400">Valor original</p><p className="mt-1 text-sm font-bold text-slate-800">{formatMoney(chargePreview.original_price)}</p></div>
                                    <div><p className="text-xs text-slate-400">Desconto</p><p className="mt-1 text-sm font-bold text-amber-700">{formatMoney(chargePreview.discount_amount)}</p></div>
                                    <div><p className="text-xs text-slate-400">Valor final</p><p className="mt-1 text-sm font-bold text-blue-700">{formatMoney(chargePreview.final_price)}</p></div>
                                    <div><p className="text-xs text-slate-400">Início</p><p className="mt-1 text-sm font-bold text-slate-800">{startDate.split("-").reverse().join("/")}</p></div>
                                    <div><p className="text-xs text-slate-400">Vigência até</p><p className="mt-1 text-sm font-bold text-slate-800">{dueDate.split("-").reverse().join("/")}</p></div>
                                    <div><p className="text-xs text-slate-400">Contrato</p><p className="mt-1 text-sm font-bold text-slate-800">Versão {selectedPlan.contract_version}</p></div>
                                    <div><p className="text-xs text-slate-400">Total previsto</p><p className="mt-1 text-sm font-bold text-slate-800">{formatMoney(chargePreview.total_expected)}</p></div>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-2xl border border-slate-200">
                                <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
                                    <h3 className="text-sm font-semibold text-slate-800">Cobranças que serão geradas</h3>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {chargePreview.charges.map((charge, index) => (
                                        <div key={`${charge.description}-${index}`} className="grid gap-2 px-5 py-3 text-sm sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-6">
                                            <span className="font-medium text-slate-700">{charge.description}</span>
                                            <span className="text-slate-500">{charge.due_date.split("-").reverse().join("/")}</span>
                                            <span className="font-bold text-slate-900">{formatMoney(charge.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {Number(discountAmount) > 0 && (
                                <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                    <strong>Justificativa do desconto:</strong> {discountReason}
                                </div>
                            )}
                        </div>
                    )}

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

                    {step > 1 && (
                        <Button
                            type="button"
                            variant="secondary"
                            disabled={saving || loadingPreview}
                            onClick={() => {
                                setError("");
                                setStep((current) => (current - 1) as 1 | 2);
                            }}
                        >
                            Voltar
                        </Button>
                    )}

                    <Button
                        type="button"
                        loading={saving || loadingPreview}
                        disabled={
                            saving ||
                            loadingPlans ||
                            !hasAvailablePlans
                            || (step === 2 && Boolean(selectedPlan?.contract_text && !contractAccepted))
                        }
                        onClick={step === 3 ? handleSubmit : handleContinue}
                    >
                        {step === 1
                            ? "Continuar"
                            : step === 2
                                ? "Revisar cobranças"
                                : "Confirmar matrícula"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
