import { useState } from "react";
import {
    AlertTriangle,
    Ban,
    CheckCircle2,
    PauseCircle,
    PlayCircle,
    X,
} from "lucide-react";

import Button from "../../../components/Button";

import {
    cancelEnrollment,
    finishEnrollment,
    freezeEnrollment,
    reactivateEnrollment,
    type Enrollment,
} from "../services/enrollment.service";

interface ManageEnrollmentModalProps {
    enrollment: Enrollment;
    onClose: () => void;
    onSuccess: () => void | Promise<void>;
}

type EnrollmentAction =
    | "freeze"
    | "reactivate"
    | "cancel"
    | "finish"
    | null;

type ConfirmationAction =
    | "cancel"
    | "finish"
    | null;

export default function ManageEnrollmentModal({
    enrollment,
    onClose,
    onSuccess,
}: ManageEnrollmentModalProps) {
    const [loadingAction, setLoadingAction] =
        useState<EnrollmentAction>(null);

    const [confirmationAction, setConfirmationAction] =
        useState<ConfirmationAction>(null);

    const [error, setError] = useState("");

    function formatMoney(value: string) {
        return Number(value).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        });
    }

    function formatDate(date: string) {
        const [year, month, day] = date.split("-");

        return `${day}/${month}/${year}`;
    }

    function getStatusLabel() {
        switch (enrollment.status) {
            case "active":
                return "Ativa";

            case "frozen":
                return "Congelada";

            case "canceled":
                return "Cancelada";

            case "finished":
                return "Encerrada";

            case "expired":
                return "Vencida";

            default:
                return enrollment.status;
        }
    }

    function getStatusClass() {
        switch (enrollment.status) {
            case "active":
                return "bg-emerald-50 text-emerald-700";

            case "frozen":
                return "bg-blue-50 text-blue-700";

            case "canceled":
                return "bg-red-50 text-red-700";

            case "finished":
                return "bg-slate-100 text-slate-700";

            case "expired":
                return "bg-amber-50 text-amber-700";

            default:
                return "bg-slate-100 text-slate-700";
        }
    }

    async function executeAction(
        action: Exclude<EnrollmentAction, null>,
    ) {
        try {
            setLoadingAction(action);
            setError("");

            switch (action) {
                case "freeze":
                    await freezeEnrollment(
                        enrollment.id,
                    );
                    break;

                case "reactivate":
                    await reactivateEnrollment(
                        enrollment.id,
                    );
                    break;

                case "cancel":
                    await cancelEnrollment(
                        enrollment.id,
                    );
                    break;

                case "finish":
                    await finishEnrollment(
                        enrollment.id,
                    );
                    break;
            }

            await onSuccess();

            setConfirmationAction(null);

            onClose();
        } catch (error) {
            console.error(error);

            setError(
                "Não foi possível alterar a matrícula.",
            );
        } finally {
            setLoadingAction(null);
        }
    }

    function handleCancelClick() {
        setError("");
        setConfirmationAction("cancel");
    }

    function handleFinishClick() {
        setError("");
        setConfirmationAction("finish");
    }

    function closeConfirmation() {
        if (loadingAction) {
            return;
        }

        setConfirmationAction(null);
    }

    const isLoading = loadingAction !== null;

    const canManage =
        enrollment.status === "active" ||
        enrollment.status === "frozen";

    const confirmationTitle =
        confirmationAction === "cancel"
            ? "Cancelar matrícula?"
            : "Encerrar matrícula?";

    const confirmationDescription =
        confirmationAction === "cancel"
            ? `Esta ação cancelará a matrícula do plano ${enrollment.plan_name}. Deseja continuar?`
            : `Esta ação encerrará a matrícula do plano ${enrollment.plan_name}. Deseja continuar?`;

    const confirmationButtonText =
        confirmationAction === "cancel"
            ? "Cancelar matrícula"
            : "Encerrar matrícula";

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
                <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl">
                    {/* CABEÇALHO */}
                    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">
                                Gerenciar matrícula
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                {enrollment.plan_name}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* INFORMAÇÕES */}
                    <div className="space-y-6 p-6">
                        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Valor contratado
                                </p>

                                <p className="mt-1 text-xl font-bold text-slate-900">
                                    {formatMoney(
                                        enrollment.contracted_price,
                                    )}
                                </p>
                            </div>

                            <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass()}`}
                            >
                                {getStatusLabel()}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Início
                                </p>

                                <p className="mt-1 text-sm font-semibold text-slate-700">
                                    {formatDate(
                                        enrollment.start_date,
                                    )}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Vencimento
                                </p>

                                <p className="mt-1 text-sm font-semibold text-slate-700">
                                    {formatDate(
                                        enrollment.due_date,
                                    )}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Cobrança
                                </p>

                                <p className="mt-1 text-sm font-semibold text-slate-700">
                                    {enrollment.billing_method ===
                                        "monthly"
                                        ? "Mensal"
                                        : "À vista"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Aluno
                                </p>

                                <p className="mt-1 text-sm font-semibold text-slate-700">
                                    {enrollment.student_name}
                                </p>
                            </div>
                        </div>

                        {enrollment.notes && (
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Observações
                                </p>

                                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                                    {enrollment.notes}
                                </p>
                            </div>
                        )}

                        {error && (
                            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                                {error}
                            </div>
                        )}

                        {/* AÇÕES */}
                        {canManage ? (
                            <div className="border-t border-slate-200 pt-5">
                                <p className="mb-3 text-sm font-semibold text-slate-900">
                                    Ações da matrícula
                                </p>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {enrollment.status ===
                                        "active" && (
                                            <button
                                                type="button"
                                                disabled={isLoading}
                                                onClick={() =>
                                                    executeAction(
                                                        "freeze",
                                                    )
                                                }
                                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <PauseCircle
                                                    size={18}
                                                />

                                                {loadingAction ===
                                                    "freeze"
                                                    ? "Congelando..."
                                                    : "Congelar"}
                                            </button>
                                        )}

                                    {enrollment.status ===
                                        "frozen" && (
                                            <button
                                                type="button"
                                                disabled={isLoading}
                                                onClick={() =>
                                                    executeAction(
                                                        "reactivate",
                                                    )
                                                }
                                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <PlayCircle
                                                    size={18}
                                                />

                                                {loadingAction ===
                                                    "reactivate"
                                                    ? "Reativando..."
                                                    : "Reativar"}
                                            </button>
                                        )}

                                    <button
                                        type="button"
                                        disabled={isLoading}
                                        onClick={
                                            handleFinishClick
                                        }
                                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <CheckCircle2
                                            size={18}
                                        />

                                        Encerrar
                                    </button>

                                    <button
                                        type="button"
                                        disabled={isLoading}
                                        onClick={
                                            handleCancelClick
                                        }
                                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Ban size={18} />

                                        Cancelar matrícula
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                Esta matrícula não possui
                                ações disponíveis porque está{" "}
                                <strong>
                                    {getStatusLabel().toLowerCase()}
                                </strong>
                                .
                            </div>
                        )}
                    </div>

                    {/* RODAPÉ */}
                    <div className="flex justify-end border-t border-slate-200 px-6 py-5">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Fechar
                        </Button>
                    </div>
                </div>
            </div>

            {/* CONFIRMAÇÃO */}
            {confirmationAction && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4">
                    <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div
                                    className={
                                        confirmationAction ===
                                            "cancel"
                                            ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600"
                                            : "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600"
                                    }
                                >
                                    <AlertTriangle
                                        size={22}
                                    />
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">
                                        {confirmationTitle}
                                    </h3>

                                    <p className="mt-2 text-sm leading-6 text-slate-500">
                                        {
                                            confirmationDescription
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={
                                    closeConfirmation
                                }
                                disabled={isLoading}
                            >
                                Voltar
                            </Button>

                            {confirmationAction ===
                                "cancel" ? (
                                <button
                                    type="button"
                                    disabled={isLoading}
                                    onClick={() =>
                                        executeAction(
                                            "cancel",
                                        )
                                    }
                                    className="inline-flex h-10 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {loadingAction ===
                                        "cancel"
                                        ? "Cancelando..."
                                        : confirmationButtonText}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    disabled={isLoading}
                                    onClick={() =>
                                        executeAction(
                                            "finish",
                                        )
                                    }
                                    className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {loadingAction ===
                                        "finish"
                                        ? "Encerrando..."
                                        : confirmationButtonText}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}