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
} from "lucide-react";

import DashboardLayout from "../layouts/DashboardLayout";
import Button from "../components/Button";
import Card from "../components/Card";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";

import { Toast } from "../services/toast";

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
};


export default function Plans() {
    const [plans, setPlans] =
        useState<Plan[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
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
        useState<PlanStatusFilter>("all");

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
        ) {
            return;
        }

        const payload: SavePlanPayload = {
            ...form,
            name: form.name.trim(),
            description: form.description.trim(),
            price: Number(form.price).toFixed(2),
        };

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
                        <div className="py-16 text-center text-sm text-slate-500">
                            Carregando planos...
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
                                Nenhum plano encontrado
                            </h2>

                            <p className="mt-1 max-w-sm text-sm text-slate-500">
                                Ajuste os filtros ou cadastre o primeiro plano da academia.
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

                                        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                                            <div>
                                                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                                    Valor
                                                </p>

                                                <p className="mt-1 text-lg font-black tracking-[-0.02em] text-blue-600">
                                                    {formatMoney(plan.price)}
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
                maxWidth="lg"
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
                                Valor
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
