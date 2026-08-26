import {
    useEffect,
    useState,
} from "react";

import {
    CalendarRange,
    Layers3,
    Pencil,
    Plus,
    Power,
    RotateCcw,
    Search,
    Users,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useSession } from "@/features/auth/access-control";

import DashboardLayout from "../layouts/DashboardLayout";
import Button from "../components/Button";
import Card from "../components/Card";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";

import { Toast } from "../services/toast";
import { getRequestErrorKind } from "../services/http/request-error";

import {
    createPlan,
    getPlansPage,
    updatePlan,
    type Plan,
    type PlanStatusFilter,
    type SavePlanPayload,
} from "../features/students/services/plan.service";


const initialForm: SavePlanPayload = {
    name: "",
    description: "",
    price: "",
    duration_months: 1,
    billing_period: "monthly",
    recurring: true,
    installment_count: 1,
    enrollment_fee: "0.00",
    promotion_price: null,
    promotion_ends_at: null,
    grace_period_days: 0,
    cancellation_penalty_percentage: "0.00",
    available_units: [],
    minimum_commitment_months: 0,
    auto_renew: true,
    available_for_enrollment: true,
    modalities: "",
    benefits: "",
    access_rules: "",
    cancellation_rules: "",
    freeze_rules: "",
    contract_text: "",
};


export default function Plans() {
    const session = useSession();
    const [searchParams, setSearchParams] = useSearchParams();
    const [plans, setPlans] =
        useState<Plan[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState(false);
    const [permissionDenied, setPermissionDenied] =
        useState(false);

    const [page, setPage] =
        useState(1);

    const [count, setCount] =
        useState(0);

    const [next, setNext] =
        useState<string | null>(null);

    const [previous, setPrevious] =
        useState<string | null>(null);

    const [search, setSearch] =
        useState("");

    const [appliedSearch, setAppliedSearch] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState<PlanStatusFilter>(() => {
            const status = searchParams.get("status");
            return status === "active" || status === "inactive" ? status : "all";
        });

    const [reloadKey, setReloadKey] =
        useState(0);

    const [openModal, setOpenModal] =
        useState(false);

    const [editingPlan, setEditingPlan] =
        useState<Plan | null>(null);

    const [form, setForm] =
        useState<SavePlanPayload>(initialForm);

    const [saving, setSaving] =
        useState(false);

    const [togglingPlanId, setTogglingPlanId] =
        useState<string | null>(null);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            const requestedStatus = searchParams.get("status");
            const nextStatus = requestedStatus === "active" || requestedStatus === "inactive"
                ? requestedStatus
                : "all";
            setStatusFilter(nextStatus);
            setPage(1);
            if (searchParams.get("action") === "new") {
                openCreateModal();
                const next = new URLSearchParams(searchParams);
                next.delete("action");
                setSearchParams(next, { replace: true });
            }
        }, 0);
        return () => window.clearTimeout(timer);
    }, [searchParams, setSearchParams]);


    useEffect(() => {
        let current = true;

        getPlansPage({
            page,
            search: appliedSearch,
            status: statusFilter,
        })
            .then((data) => {
                if (!current) {
                    return;
                }

                setPlans(data.results);
                setCount(data.count);
                setNext(data.next);
                setPrevious(data.previous);
                setError(false);
                setPermissionDenied(false);
            })
            .catch((requestError) => {
                console.error(requestError);

                if (!current) {
                    return;
                }

                setPlans([]);
                setCount(0);
                setNext(null);
                setPrevious(null);
                setError(true);
                setPermissionDenied(
                    getRequestErrorKind(requestError) === "forbidden",
                );
            })
            .finally(() => {
                if (current) {
                    setLoading(false);
                }
            });

        return () => {
            current = false;
        };
    }, [
        appliedSearch,
        page,
        reloadKey,
        statusFilter,
    ]);


    function reloadPlans() {
        setLoading(true);
        setReloadKey((current) => current + 1);
    }


    function handleSearch(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setLoading(true);
        setPage(1);
        setAppliedSearch(search.trim());
        setReloadKey((current) => current + 1);
    }


    function handleStatusChange(
        value: PlanStatusFilter,
    ) {
        setLoading(true);
        setPage(1);
        setStatusFilter(value);
        const next = new URLSearchParams(searchParams);
        if (value === "all") next.delete("status");
        else next.set("status", value);
        setSearchParams(next, { replace: true });
    }


    function handlePageChange(nextPage: number) {
        setLoading(true);
        setPage(nextPage);
    }


    function openCreateModal() {
        setEditingPlan(null);
        setForm(initialForm);
        setOpenModal(true);
    }


    function openEditModal(plan: Plan) {
        setEditingPlan(plan);
        setForm({
            name: plan.name,
            description: plan.description,
            price: plan.price,
            duration_months: plan.duration_months,
            billing_period: plan.billing_period,
            recurring: plan.recurring,
            installment_count: plan.installment_count,
            enrollment_fee: plan.enrollment_fee,
            promotion_price: plan.promotion_price,
            promotion_ends_at: plan.promotion_ends_at,
            grace_period_days: plan.grace_period_days,
            cancellation_penalty_percentage: plan.cancellation_penalty_percentage,
            available_units: plan.available_units,
            minimum_commitment_months: plan.minimum_commitment_months,
            auto_renew: plan.auto_renew,
            available_for_enrollment: plan.available_for_enrollment,
            modalities: plan.modalities,
            benefits: plan.benefits,
            access_rules: plan.access_rules,
            cancellation_rules: plan.cancellation_rules,
            freeze_rules: plan.freeze_rules,
            contract_text: plan.contract_text,
        });
        setOpenModal(true);
    }


    function closeModal() {
        if (saving) {
            return;
        }

        setOpenModal(false);
        setEditingPlan(null);
        setForm(initialForm);
    }


    async function handleSavePlan(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (
            !form.name.trim() ||
            Number(form.price) <= 0 ||
            form.duration_months < 1
            || Number(form.enrollment_fee) < 0
            || form.minimum_commitment_months < 0
            || form.minimum_commitment_months > form.duration_months
            || (form.billing_period === "one_time" && form.recurring)
            || form.installment_count < 1
            || (form.billing_period === "one_time" && form.installment_count !== 1)
            || (form.auto_renew && !form.recurring)
            || !form.contract_text.trim()
        ) {
            return;
        }

        const payload: SavePlanPayload = {
            ...form,
            name: form.name.trim(),
            description: form.description.trim(),
            price: Number(form.price).toFixed(2),
            enrollment_fee: Number(form.enrollment_fee).toFixed(2),
            modalities: form.modalities.trim(),
            benefits: form.benefits.trim(),
            access_rules: form.access_rules.trim(),
            cancellation_rules: form.cancellation_rules.trim(),
            freeze_rules: form.freeze_rules.trim(),
            contract_text: form.contract_text.trim(),
        };

        if (
            editingPlan &&
            editingPlan.active_students_count > 0 &&
            (
                editingPlan.price !== payload.price ||
                editingPlan.duration_months !== payload.duration_months ||
                editingPlan.billing_period !== payload.billing_period ||
                editingPlan.recurring !== payload.recurring ||
                editingPlan.installment_count !== payload.installment_count ||
                editingPlan.enrollment_fee !== payload.enrollment_fee ||
                editingPlan.minimum_commitment_months !== payload.minimum_commitment_months ||
                editingPlan.auto_renew !== payload.auto_renew
                || editingPlan.modalities !== payload.modalities
                || editingPlan.benefits !== payload.benefits
                || editingPlan.access_rules !== payload.access_rules
                || editingPlan.cancellation_rules !== payload.cancellation_rules
                || editingPlan.freeze_rules !== payload.freeze_rules
                || editingPlan.contract_text !== payload.contract_text
            )
        ) {
            const confirmed = window.confirm(
                `Este plano possui ${editingPlan.active_students_count} ${editingPlan.active_students_count === 1 ? "aluno ativo" : "alunos ativos"}. As matrículas existentes preservam os valores já contratados, mas as novas condições serão usadas nas próximas matrículas. Deseja continuar?`,
            );

            if (!confirmed) {
                return;
            }
        }

        try {
            setSaving(true);

            if (editingPlan) {
                await updatePlan(
                    editingPlan.id,
                    payload,
                );
            } else {
                await createPlan(payload);
            }

            Toast.success.updated("Plano");

            setOpenModal(false);
            setEditingPlan(null);
            setForm(initialForm);
            reloadPlans();
        } catch (saveError) {
            console.error(saveError);
            Toast.error.updated("Plano");
        } finally {
            setSaving(false);
        }
    }


    async function handleTogglePlan(plan: Plan) {
        const action = plan.active
            ? "inativar"
            : "reativar";

        const confirmed = window.confirm(
            `Deseja realmente ${action} o plano "${plan.name}"?`,
        );

        if (!confirmed) {
            return;
        }

        try {
            setTogglingPlanId(plan.id);

            await updatePlan(
                plan.id,
                {
                    active: !plan.active,
                },
            );

            Toast.success.updated("Plano");
            reloadPlans();
        } catch (toggleError) {
            console.error(toggleError);
            Toast.error.updated("Plano");
        } finally {
            setTogglingPlanId(null);
        }
    }


    function formatMoney(value: string) {
        return Number(value).toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL",
            },
        );
    }


    function getDurationLabel(months: number) {
        return months === 1
            ? "1 mês"
            : `${months} meses`;
    }


    return (
        <DashboardLayout>
            <PageHeader
                title="Planos"
                subtitle="Gerencie valores, duração e disponibilidade dos planos da academia."
                eyebrow="Estratégia comercial"
                context="Oferta, adesão e impacto"
                actions={
                    <Button onClick={openCreateModal}>
                        <span className="inline-flex items-center gap-2">
                            <Plus size={16} />
                            Novo plano
                        </span>
                    </Button>
                }
            />

            <Card>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <form
                        onSubmit={handleSearch}
                        className="flex w-full max-w-lg items-center gap-2"
                    >
                        <div className="relative min-w-0 flex-1">
                            <Search
                                size={16}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Buscar por nome ou descrição..."
                                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 hover:bg-white focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                            />
                        </div>

                        <button
                            type="submit"
                            className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                            Buscar
                        </button>
                    </form>

                    <div className="flex items-center gap-2 overflow-x-auto">
                        {(
                            [
                                ["all", "Todos"],
                                ["active", "Ativos"],
                                ["inactive", "Inativos"],
                            ] as const
                        ).map(([value, label]) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() =>
                                    handleStatusChange(value)
                                }
                                className={
                                    statusFilter === value
                                        ? "h-9 rounded-lg bg-slate-950 px-3.5 text-xs font-semibold text-white"
                                        : "h-9 rounded-lg px-3.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                                }
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-6">
                    {loading ? (
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3" aria-label="Carregando planos">
                            {[1, 2, 3].map((item) => (
                                <div key={item} className="h-52 animate-pulse rounded-[1.35rem] bg-slate-100" />
                            ))}
                        </div>
                    ) : permissionDenied ? (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
                            <h2 className="font-semibold text-amber-800">
                                Acesso não permitido
                            </h2>
                            <p className="mt-1 text-sm text-amber-700">
                                Seu usuário não possui permissão para consultar os planos.
                            </p>
                        </div>
                    ) : error ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                            <h2 className="font-semibold text-red-700">
                                Não foi possível carregar os planos
                            </h2>

                            <p className="mt-1 text-sm text-red-600">
                                Verifique a conexão e tente novamente.
                            </p>

                            <button
                                type="button"
                                onClick={reloadPlans}
                                className="mt-4 text-sm font-semibold text-red-700 underline underline-offset-4"
                            >
                                Tentar novamente
                            </button>
                        </div>
                    ) : plans.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <Layers3 size={22} />
                            </div>

                            <h2 className="mt-4 font-semibold text-slate-900">
                                {appliedSearch || statusFilter !== "all"
                                    ? "Nenhum plano corresponde aos filtros"
                                    : "Nenhum plano cadastrado"}
                            </h2>

                            <p className="mt-1 max-w-sm text-sm text-slate-500">
                                {appliedSearch || statusFilter !== "all"
                                    ? "Altere a busca ou os filtros para consultar outros planos."
                                    : "Cadastre o primeiro plano para iniciar a gestão comercial."}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4 flex items-center justify-between">
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                                    {count} {count === 1 ? "plano encontrado" : "planos encontrados"}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                                {plans.map((plan) => (
                                    <article
                                        key={plan.id}
                                        className="group relative overflow-hidden rounded-[1.35rem] border border-slate-200/90 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_22px_50px_-34px_rgba(37,99,235,0.35)]"
                                    >
                                        <div
                                            className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${plan.active
                                                ? "from-blue-600 to-cyan-400"
                                                : "from-slate-300 to-slate-200"
                                                }`}
                                        />

                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <span
                                                    className={
                                                        plan.active
                                                            ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700"
                                                            : "inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500"
                                                    }
                                                >
                                                    <span
                                                        className={`h-1.5 w-1.5 rounded-full ${plan.active
                                                            ? "bg-emerald-500"
                                                            : "bg-slate-400"
                                                            }`}
                                                    />
                                                    {plan.active ? "Ativo" : "Inativo"}
                                                </span>

                                                {!plan.available_for_enrollment && (
                                                    <span className="ml-2 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                                                        Matrículas pausadas
                                                    </span>
                                                )}

                                                <h2 className="mt-3 truncate text-lg font-black tracking-[-0.025em] text-slate-950">
                                                    {plan.name}
                                                </h2>
                                            </div>

                                            <div className="flex shrink-0 items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEditModal(plan)
                                                    }
                                                    title="Editar plano"
                                                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                                                >
                                                    <Pencil size={16} />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleTogglePlan(plan)
                                                    }
                                                    disabled={togglingPlanId === plan.id}
                                                    title={plan.active ? "Inativar plano" : "Reativar plano"}
                                                    className={
                                                        plan.active
                                                            ? "flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-amber-50 hover:text-amber-600 disabled:opacity-50"
                                                            : "flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50"
                                                    }
                                                >
                                                    {plan.active ? (
                                                        <Power size={16} />
                                                    ) : (
                                                        <RotateCcw size={16} />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        <p className="mt-3 min-h-10 text-sm leading-5 text-slate-500">
                                            {plan.description || "Sem descrição cadastrada."}
                                        </p>

                                        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
                                            <div>
                                                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                                    Valor total
                                                </p>

                                                <p className="mt-1 text-lg font-black tracking-[-0.02em] text-blue-600">
                                                    {formatMoney(plan.price)}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                                    Mensalidade equivalente
                                                </p>

                                                <p className="mt-1 text-sm font-bold text-slate-700">
                                                    {formatMoney(plan.monthly_equivalent)}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                                    Cobrança
                                                </p>

                                                <p className="mt-1 text-sm font-bold text-slate-700">
                                                    {plan.billing_period_label}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                                    Duração
                                                </p>

                                                <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-700">
                                                    <CalendarRange
                                                        size={15}
                                                        className="text-cyan-500"
                                                    />
                                                    {getDurationLabel(plan.duration_months)}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                                    Alunos ativos
                                                </p>

                                                <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-700">
                                                    <Users
                                                        size={15}
                                                        className="text-blue-500"
                                                    />
                                                    {plan.active_students_count}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                                    Taxa de matrícula
                                                </p>

                                                <p className="mt-1 text-sm font-bold text-slate-700">
                                                    {formatMoney(plan.enrollment_fee)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 text-[10px] font-semibold text-slate-500">
                                            <span className="rounded-lg bg-slate-100 px-2.5 py-1.5">
                                                {plan.recurring ? "Recorrente" : "Não recorrente"}
                                            </span>
                                            <span className="rounded-lg bg-slate-100 px-2.5 py-1.5">
                                                {plan.installment_count} {plan.installment_count === 1 ? "parcela" : "parcelas"}
                                            </span>
                                            <span className="rounded-lg bg-slate-100 px-2.5 py-1.5">
                                                {plan.minimum_commitment_months > 0
                                                    ? `${plan.minimum_commitment_months} meses de fidelidade`
                                                    : "Sem fidelidade"}
                                            </span>
                                            <span className="rounded-lg bg-slate-100 px-2.5 py-1.5">
                                                {plan.auto_renew ? "Renovação automática" : "Renovação manual"}
                                            </span>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            {(previous || next) && (
                                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
                                    <p className="text-sm font-medium text-slate-500">
                                        Página {page}
                                    </p>

                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handlePageChange(
                                                    Math.max(1, page - 1),
                                                )
                                            }
                                            disabled={!previous}
                                            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Anterior
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handlePageChange(page + 1)
                                            }
                                            disabled={!next}
                                            className="h-9 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Próxima
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Card>

            <Modal
                open={openModal}
                title={editingPlan ? "Editar plano" : "Novo plano"}
                maxWidth="xl"
                onClose={closeModal}
            >
                <form onSubmit={handleSavePlan}>
                    <div className="grid gap-5 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label
                                htmlFor="plan-name"
                                className="text-sm font-semibold text-slate-700"
                            >
                                Nome do plano
                            </label>

                            <input
                                id="plan-name"
                                type="text"
                                value={form.name}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        name: event.target.value,
                                    }))
                                }
                                maxLength={150}
                                required
                                disabled={saving}
                                placeholder="Ex.: Plano Mensal"
                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="plan-price"
                                className="text-sm font-semibold text-slate-700"
                            >
                                Valor total
                            </label>

                            <input
                                id="plan-price"
                                type="number"
                                value={form.price}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        price: event.target.value,
                                    }))
                                }
                                min="0.01"
                                step="0.01"
                                required
                                disabled={saving}
                                placeholder="0,00"
                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="plan-billing-period"
                                className="text-sm font-semibold text-slate-700"
                            >
                                Periodicidade da cobrança
                            </label>

                            <select
                                id="plan-billing-period"
                                value={form.billing_period}
                                onChange={(event) => {
                                    const billingPeriod = event.target.value as SavePlanPayload["billing_period"];

                                    setForm((current) => ({
                                        ...current,
                                        billing_period: billingPeriod,
                                        recurring:
                                            billingPeriod === "one_time"
                                                ? false
                                                : current.recurring,
                                        auto_renew:
                                            billingPeriod === "one_time"
                                                ? false
                                                : current.auto_renew,
                                        installment_count:
                                            billingPeriod === "one_time"
                                                ? 1
                                                : current.installment_count,
                                    }));
                                }}
                                disabled={saving}
                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                            >
                                <option value="monthly">Mensal</option>
                                <option value="quarterly">Trimestral</option>
                                <option value="semiannual">Semestral</option>
                                <option value="annual">Anual</option>
                                <option value="one_time">Pagamento único</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="plan-installments" className="text-sm font-semibold text-slate-700">
                                Quantidade de parcelas
                            </label>
                            <input
                                id="plan-installments"
                                type="number"
                                value={form.installment_count}
                                onChange={(event) => setForm((current) => ({ ...current, installment_count: Number(event.target.value) }))}
                                min="1"
                                disabled={saving || form.billing_period === "one_time"}
                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                            />
                            <p className="mt-1 text-xs text-slate-500">Número de cobranças previstas durante a vigência.</p>
                        </div>

                        <div>
                            <label
                                htmlFor="plan-enrollment-fee"
                                className="text-sm font-semibold text-slate-700"
                            >
                                Taxa de matrícula
                            </label>

                            <input
                                id="plan-enrollment-fee"
                                type="number"
                                value={form.enrollment_fee}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        enrollment_fee: event.target.value,
                                    }))
                                }
                                min="0"
                                step="0.01"
                                disabled={saving}
                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="plan-commitment"
                                className="text-sm font-semibold text-slate-700"
                            >
                                Fidelidade mínima em meses
                            </label>

                            <input
                                id="plan-commitment"
                                type="number"
                                value={form.minimum_commitment_months}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        minimum_commitment_months: Number(event.target.value),
                                    }))
                                }
                                min={0}
                                max={form.duration_months}
                                step={1}
                                disabled={saving}
                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                            />
                        </div>

                        <div>
                            <label htmlFor="plan-promotion-price" className="text-sm font-semibold text-slate-700">Valor promocional</label>
                            <input id="plan-promotion-price" type="number" min="0" step="0.01" value={form.promotion_price ?? ""} onChange={(event) => setForm((current) => ({ ...current, promotion_price: event.target.value || null }))} disabled={saving} placeholder="Sem promoção" className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm" />
                        </div>
                        <div>
                            <label htmlFor="plan-promotion-end" className="text-sm font-semibold text-slate-700">Promoção válida até</label>
                            <input id="plan-promotion-end" type="date" value={form.promotion_ends_at ?? ""} onChange={(event) => setForm((current) => ({ ...current, promotion_ends_at: event.target.value || null }))} disabled={saving} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm" />
                        </div>
                        <div>
                            <label htmlFor="plan-grace" className="text-sm font-semibold text-slate-700">Carência em dias</label>
                            <input id="plan-grace" type="number" min="0" value={form.grace_period_days} onChange={(event) => setForm((current) => ({ ...current, grace_period_days: Number(event.target.value) }))} disabled={saving} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm" />
                        </div>
                        <div>
                            <label htmlFor="plan-penalty" className="text-sm font-semibold text-slate-700">Multa de cancelamento (%)</label>
                            <input id="plan-penalty" type="number" min="0" max="100" step="0.01" value={form.cancellation_penalty_percentage} onChange={(event) => setForm((current) => ({ ...current, cancellation_penalty_percentage: event.target.value }))} disabled={saving} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm" />
                        </div>
                        <fieldset className="sm:col-span-2 rounded-2xl border border-slate-200 p-4">
                            <legend className="px-2 text-sm font-semibold text-slate-700">Disponibilidade por unidade</legend>
                            <p className="mb-3 text-xs text-slate-500">Sem seleção, o plano fica disponível em todas as unidades.</p>
                            <div className="grid gap-2 sm:grid-cols-2">{session.units.map((unit) => <label key={unit.id} className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.available_units.includes(unit.id)} onChange={(event) => setForm((current) => ({ ...current, available_units: event.target.checked ? [...current.available_units, unit.id] : current.available_units.filter((id) => id !== unit.id) }))} />{unit.name}</label>)}</div>
                        </fieldset>

                        <div className="sm:col-span-2 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-3">
                            {([
                                ["recurring", "Cobrança recorrente", "Gerar cobranças de forma continuada."],
                                ["auto_renew", "Renovação automática", "Renovar ao final da vigência."],
                                ["available_for_enrollment", "Novas matrículas", "Disponibilizar no fluxo de matrícula."],
                            ] as const).map(([field, label, description]) => (
                                <label key={field} className="flex cursor-pointer gap-3 rounded-xl bg-white p-3">
                                    <input
                                        type="checkbox"
                                        checked={form[field]}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                [field]: event.target.checked,
                                                ...(field === "recurring" && !event.target.checked
                                                    ? { auto_renew: false }
                                                    : {}),
                                            }))
                                        }
                                        disabled={
                                            saving ||
                                            ((field === "recurring" || field === "auto_renew") &&
                                                form.billing_period === "one_time") ||
                                            (field === "auto_renew" && !form.recurring)
                                        }
                                        className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
                                    />
                                    <span>
                                        <span className="block text-sm font-semibold text-slate-700">
                                            {label}
                                        </span>
                                        <span className="mt-1 block text-xs leading-4 text-slate-500">
                                            {description}
                                        </span>
                                    </span>
                                </label>
                            ))}
                        </div>

                        <div>
                            <label
                                htmlFor="plan-duration"
                                className="text-sm font-semibold text-slate-700"
                            >
                                Duração em meses
                            </label>

                            <input
                                id="plan-duration"
                                type="number"
                                value={form.duration_months}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        duration_months: Number(event.target.value),
                                    }))
                                }
                                min={1}
                                step={1}
                                required
                                disabled={saving}
                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <div className="flex items-center justify-between gap-4">
                                <label
                                    htmlFor="plan-description"
                                    className="text-sm font-semibold text-slate-700"
                                >
                                    Descrição
                                </label>

                                <span className="text-xs text-slate-400">
                                    Opcional
                                </span>
                            </div>

                            <textarea
                                id="plan-description"
                                value={form.description}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        description: event.target.value,
                                    }))
                                }
                                rows={4}
                                disabled={saving}
                                placeholder="Descreva as principais condições deste plano."
                                className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                            />
                        </div>

                        <div className="sm:col-span-2 border-t border-slate-200 pt-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h3 className="font-semibold text-slate-900">
                                        Serviços e regras operacionais
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Estas informações farão parte do resumo e da versão contratual.
                                    </p>
                                </div>
                                {editingPlan && (
                                    <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                                        Contrato atual · versão {editingPlan.contract_version}
                                    </span>
                                )}
                            </div>
                        </div>

                        {([
                            ["modalities", "Modalidades incluídas", "Ex.: musculação, funcional e aulas coletivas."],
                            ["benefits", "Benefícios e serviços", "Liste avaliações, aplicativos, aulas ou serviços incluídos."],
                            ["access_rules", "Regras de acesso", "Defina dias, horários, unidades e limites de acesso."],
                            ["cancellation_rules", "Regras de cancelamento", "Informe prazos, multas e condições para cancelamento."],
                            ["freeze_rules", "Regras de trancamento", "Informe prazos, limites e condições para congelamento."],
                        ] as const).map(([field, label, placeholder]) => (
                            <div key={field}>
                                <label
                                    htmlFor={`plan-${field}`}
                                    className="text-sm font-semibold text-slate-700"
                                >
                                    {label}
                                </label>
                                <textarea
                                    id={`plan-${field}`}
                                    value={form[field]}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            [field]: event.target.value,
                                        }))
                                    }
                                    rows={4}
                                    disabled={saving}
                                    placeholder={placeholder}
                                    className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                                />
                            </div>
                        ))}

                        <div className="sm:col-span-2">
                            <label
                                htmlFor="plan-contract"
                                className="text-sm font-semibold text-slate-700"
                            >
                                Texto do contrato <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="plan-contract"
                                value={form.contract_text}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        contract_text: event.target.value,
                                    }))
                                }
                                rows={10}
                                required
                                disabled={saving}
                                placeholder="Insira os termos contratuais que deverão ser aceitos na matrícula."
                                className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                            />
                            <p className="mt-2 text-xs text-slate-500">
                                Alterações neste conteúdo ou nas regras criam uma nova versão. Matrículas existentes preservam a cópia aceita.
                            </p>
                        </div>
                    </div>

                    <div className="mt-7 flex justify-end gap-3 border-t border-slate-100 pt-5">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={closeModal}
                            disabled={saving}
                        >
                            Cancelar
                        </Button>

                        <Button
                            type="submit"
                            loading={saving}
                        >
                            {editingPlan ? "Salvar alterações" : "Cadastrar plano"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}
