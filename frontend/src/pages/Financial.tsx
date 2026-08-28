import {
    lazy,
    Suspense,
    useCallback,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";

import {
    AlertTriangle,
    Banknote,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Download,
    ExternalLink,
    ReceiptText,
    Search,
    SlidersHorizontal,
    X,
} from "lucide-react";
import toast from "react-hot-toast";
import {
    useLocation,
    useNavigate,
    useSearchParams,
} from "react-router-dom";

import ConfirmDialog from "@/components/ConfirmDialog";
import { SkeletonBlock } from "@/components/AsyncState";
import PageHeader from "@/components/PageHeader";
import DashboardLayout from "@/layouts/DashboardLayout";
import { getRequestErrorKind } from "@/services/http/request-error";
import { useSession } from "@/features/auth/access-control";
import { hasCapability } from "@/features/auth/access-policy";

import {
    cancelCharge,
    exportFinancialCharges,
    getCharges,
    getFinancialFilterOptions,
    getFinancialForecast,
    getFinancialSummary,
    getGroupedCharges,
    payCharge,
    payChargesInBulk,
    reconcileCharge,
    type Charge,
    type ChargeCategoryFilter,
    type ChargeGroup,
    type FinancialViewMode,
    type FinancialSummary,
    type FinancialFilterOptions,
    type FinancialForecast as FinancialForecastData,
    type PaymentMethod,
    type OverdueRangeFilter,
    type ReconciliationFilter,
} from "@/features/students/services/financial.service";

const FinancialForecast = lazy(() => import("@/features/students/components/FinancialForecast"));
const CashFlowSection = lazy(() => import("@/features/students/components/CashFlowSection"));
const FinancialInconsistenciesSection = lazy(() => import("@/features/students/components/FinancialInconsistenciesSection"));
const RecurringFailuresSection = lazy(() => import("@/features/students/components/RecurringFailuresSection"));

function DeferredFinancialSection({ children }: { children: ReactNode }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const element = containerRef.current;
        if (!element || visible) return;
        const observer = new IntersectionObserver(
            ([entry]) => entry.isIntersecting && setVisible(true),
            { rootMargin: "320px 0px" },
        );
        observer.observe(element);
        return () => observer.disconnect();
    }, [visible]);

    return <div ref={containerRef} className="min-h-40">{visible ? <Suspense fallback={<SkeletonBlock className="h-40 w-full rounded-3xl" />}>{children}</Suspense> : <SkeletonBlock className="h-40 w-full rounded-3xl" />}</div>;
}


type PendingAction = {
    type: "pay" | "cancel";
    charge: Charge;
} | null;


const emptySummary: FinancialSummary = {
    total_count: 0,
    paid_total: "0",
    open_total: "0",
    overdue_count: 0,
    overdue_total: "0",
};


const paymentMethods: Array<{
    value: PaymentMethod;
    label: string;
}> = [
    { value: "pix", label: "Pix" },
    { value: "cash", label: "Dinheiro" },
    { value: "debit_card", label: "Cartão de débito" },
    { value: "credit_card", label: "Cartão de crédito" },
    { value: "bank_transfer", label: "Transferência bancária" },
];


function formatMoney(value: string) {
    return Number(value).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}


function formatDate(value: string) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
}


function getStatusLabel(status: Charge["status"]) {
    const labels = {
        pending: "Pendente",
        paid: "Pago",
        overdue: "Atrasado",
        canceled: "Cancelado",
    };

    return labels[status];
}


function getPaymentMethodLabel(method: PaymentMethod | null) {
    return paymentMethods.find((item) => item.value === method)?.label ?? "—";
}


function getCategoryLabel(category: Charge["operational_category"]) {
    return {
        overdue: "Vencida",
        due_soon: "A vencer",
        future: "Futura",
        paid: "Paga",
        canceled: "Cancelada",
        inconsistent: "Inconsistente",
    }[category];
}


function getCategoryTone(category: Charge["operational_category"]) {
    return {
        overdue: "danger",
        due_soon: "warning",
        future: "info",
        paid: "success",
        canceled: "neutral",
        inconsistent: "inconsistency",
    }[category];
}


const validCategories = new Set<ChargeCategoryFilter>([
    "all",
    "overdue",
    "due_soon",
    "future",
    "paid",
    "canceled",
    "inconsistent",
]);


function getDateParam(searchParams: URLSearchParams, name: string) {
    const value = searchParams.get(name) ?? "";

    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}


export default function Financial() {
    const session = useSession();
    const canManage = hasCapability(session.capabilities, "finance.manage");
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialCategory = searchParams.get("category") as ChargeCategoryFilter | null;

    const [charges, setCharges] = useState<Charge[]>([]);
    const [chargeGroups, setChargeGroups] = useState<ChargeGroup[]>([]);
    const [viewMode, setViewMode] = useState<FinancialViewMode>("charges");
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [summary, setSummary] =
        useState<FinancialSummary>(emptySummary);
    const [forecast, setForecast] = useState<FinancialForecastData | null>(null);
    const [forecastMonths, setForecastMonths] = useState<3 | 6 | 12>(6);
    const [forecastLoading, setForecastLoading] = useState(true);
    const [forecastError, setForecastError] = useState(false);
    const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    const [categoryFilter, setCategoryFilter] =
        useState<ChargeCategoryFilter>(
            initialCategory && validCategories.has(initialCategory)
                ? initialCategory
                : "all",
        );
    const [dueDateFrom, setDueDateFrom] = useState("");
    const [dueDateTo, setDueDateTo] = useState("");
    const [competenceDateFrom, setCompetenceDateFrom] = useState("");
    const [competenceDateTo, setCompetenceDateTo] = useState("");
    const [paidDateFrom, setPaidDateFrom] = useState(
        () => getDateParam(searchParams, "paid_date_from"),
    );
    const [paidDateTo, setPaidDateTo] = useState(
        () => getDateParam(searchParams, "paid_date_to"),
    );
    const [chargeFilter, setChargeFilter] = useState(
        () => searchParams.get("charge") ?? "",
    );
    const [planFilter, setPlanFilter] = useState("");
    const [paymentMethodFilter, setPaymentMethodFilter] =
        useState<"all" | PaymentMethod>("all");
    const [overdueRangeFilter, setOverdueRangeFilter] =
        useState<OverdueRangeFilter>("all");
    const [reconciliationFilter, setReconciliationFilter] =
        useState<ReconciliationFilter>("all");
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(
        () => Boolean(paidDateFrom || paidDateTo || chargeFilter),
    );
    const [filterOptions, setFilterOptions] =
        useState<FinancialFilterOptions>({ plans: [], payment_methods: [] });
    const [page, setPage] = useState(1);
    const [next, setNext] = useState<string | null>(null);
    const [previous, setPrevious] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [pendingAction, setPendingAction] =
        useState<PendingAction>(null);
    const [processing, setProcessing] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [paymentMethod, setPaymentMethod] =
        useState<PaymentMethod>("pix");
    const [cancellationReason, setCancellationReason] = useState("");
    const [selectedChargeIds, setSelectedChargeIds] =
        useState<Set<string>>(new Set());
    const [bulkPaymentOpen, setBulkPaymentOpen] = useState(false);
    const [bulkPaymentMethod, setBulkPaymentMethod] =
        useState<PaymentMethod>("pix");
    const [bulkProcessing, setBulkProcessing] = useState(false);
    const [reconciliationCharge, setReconciliationCharge] =
        useState<Charge | null>(null);
    const [receivedAmount, setReceivedAmount] = useState("");
    const [reconciliationNotes, setReconciliationNotes] = useState("");
    const [reconciliationProcessing, setReconciliationProcessing] =
        useState(false);


    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 350);

        return () => window.clearTimeout(timer);
    }, [search]);


    useEffect(() => {
        getFinancialFilterOptions()
            .then(setFilterOptions)
            .catch((requestError) => console.error(requestError));
    }, []);


    useEffect(() => {
        const targetId = location.hash.slice(1);
        if (!targetId) return;

        window.requestAnimationFrame(() => {
            document.getElementById(targetId)?.scrollIntoView({
                block: "start",
            });
        });
    }, [location.hash]);


    const loadFinancial = useCallback(async () => {
        try {
            setLoading(true);
            setError(false);
            setPermissionDenied(false);

            const filters = {
                search: debouncedSearch,
                category: categoryFilter,
                dueDateFrom,
                dueDateTo,
                competenceDateFrom,
                competenceDateTo,
                paidDateFrom,
                paidDateTo,
                charge: chargeFilter,
                plan: planFilter,
                paymentMethod: paymentMethodFilter,
                overdueRange: overdueRangeFilter,
                reconciliation: reconciliationFilter,
            };

            const chargeDataPromise = viewMode === "charges"
                ? getCharges({ ...filters, page })
                : getGroupedCharges(
                    { ...filters, page },
                    viewMode,
                );
            const [chargesData, summaryData] = await Promise.all([
                chargeDataPromise,
                getFinancialSummary(filters),
            ]);

            if (viewMode === "charges") {
                setCharges(chargesData.results as Charge[]);
                setChargeGroups([]);
            } else {
                setChargeGroups(chargesData.results as ChargeGroup[]);
                setCharges([]);
            }
            setNext(chargesData.next);
            setPrevious(chargesData.previous);
            setSummary(summaryData);
        } catch (requestError) {
            console.error(requestError);
            setCharges([]);
            setChargeGroups([]);
            setSummary(emptySummary);
            setNext(null);
            setPrevious(null);
            setError(true);
            setPermissionDenied(
                getRequestErrorKind(requestError) === "forbidden",
            );
        } finally {
            setLoading(false);
        }
    }, [
        categoryFilter,
        competenceDateFrom,
        competenceDateTo,
        paidDateFrom,
        paidDateTo,
        chargeFilter,
        debouncedSearch,
        dueDateFrom,
        dueDateTo,
        page,
        overdueRangeFilter,
        paymentMethodFilter,
        planFilter,
        reconciliationFilter,
        viewMode,
    ]);


    useEffect(() => {
        loadFinancial();
    }, [loadFinancial]);


    const loadForecast = useCallback(async () => {
        try {
            setForecastLoading(true);
            setForecastError(false);
            const data = await getFinancialForecast(
                {
                    search: debouncedSearch,
                    category: categoryFilter,
                    dueDateFrom,
                    dueDateTo,
                    competenceDateFrom,
                    competenceDateTo,
                    paidDateFrom,
                    paidDateTo,
                    charge: chargeFilter,
                    plan: planFilter,
                    paymentMethod: paymentMethodFilter,
                    overdueRange: overdueRangeFilter,
                    reconciliation: reconciliationFilter,
                },
                forecastMonths,
            );
            setForecast(data);
        } catch (requestError) {
            console.error(requestError);
            setForecast(null);
            setForecastError(true);
        } finally {
            setForecastLoading(false);
        }
    }, [
        categoryFilter,
        competenceDateFrom,
        competenceDateTo,
        paidDateFrom,
        paidDateTo,
        chargeFilter,
        debouncedSearch,
        dueDateFrom,
        dueDateTo,
        forecastMonths,
        overdueRangeFilter,
        paymentMethodFilter,
        planFilter,
        reconciliationFilter,
    ]);


    useEffect(() => {
        loadForecast();
    }, [loadForecast]);


    useEffect(() => {
        setSelectedChargeIds(new Set());
    }, [charges]);


    async function confirmAction() {
        if (!pendingAction) return;

        if (
            pendingAction.type === "cancel"
            && !cancellationReason.trim()
        ) {
            toast.error("Informe o motivo do cancelamento.");
            return;
        }

        try {
            setProcessing(true);

            if (pendingAction.type === "pay") {
                await payCharge(
                    pendingAction.charge.id,
                    paymentMethod,
                );
                toast.success("Pagamento registrado com sucesso!");
            } else {
                await cancelCharge(
                    pendingAction.charge.id,
                    cancellationReason.trim(),
                );
                toast.success("Cobrança cancelada com sucesso!");
            }

            setPendingAction(null);
            setCancellationReason("");
            await loadFinancial();
        } catch (requestError) {
            console.error(requestError);
            toast.error("Não foi possível concluir a operação.");
        } finally {
            setProcessing(false);
        }
    }


    const actionDescription = pendingAction
        ? pendingAction.type === "pay"
            ? `Confirmar o pagamento de ${formatMoney(pendingAction.charge.amount)} de ${pendingAction.charge.student_name}?`
            : `Cancelar a cobrança “${pendingAction.charge.description}” de ${pendingAction.charge.student_name}?`
        : "";

    const advancedFilterCount = [
        dueDateFrom,
        dueDateTo,
        competenceDateFrom,
        competenceDateTo,
        paidDateFrom,
        paidDateTo,
        chargeFilter,
        planFilter,
        paymentMethodFilter === "all" ? "" : paymentMethodFilter,
        overdueRangeFilter === "all" ? "" : overdueRangeFilter,
        reconciliationFilter === "all" ? "" : reconciliationFilter,
    ].filter(Boolean).length;

    function clearAdvancedFilters() {
        setDueDateFrom("");
        setDueDateTo("");
        setCompetenceDateFrom("");
        setCompetenceDateTo("");
        setPaidDateFrom("");
        setPaidDateTo("");
        setChargeFilter("");
        setPlanFilter("");
        setPaymentMethodFilter("all");
        setOverdueRangeFilter("all");
        setReconciliationFilter("all");
        setPage(1);

        const nextParams = new URLSearchParams();
        if (search.trim()) nextParams.set("search", search.trim());
        if (categoryFilter !== "all") {
            nextParams.set("category", categoryFilter);
        }
        setSearchParams(nextParams, { replace: true });
    }

    function changeViewMode(mode: FinancialViewMode) {
        setViewMode(mode);
        setExpandedGroups(new Set());
        setPage(1);
    }

    function toggleGroup(key: string) {
        setExpandedGroups((current) => {
            const nextGroups = new Set(current);

            if (nextGroups.has(key)) {
                nextGroups.delete(key);
            } else {
                nextGroups.add(key);
            }

            return nextGroups;
        });
    }

    async function handleExport() {
        try {
            setExporting(true);
            const { file, filename } = await exportFinancialCharges({
                search: debouncedSearch,
                category: categoryFilter,
                dueDateFrom,
                dueDateTo,
                competenceDateFrom,
                competenceDateTo,
                paidDateFrom,
                paidDateTo,
                charge: chargeFilter,
                plan: planFilter,
                paymentMethod: paymentMethodFilter,
                overdueRange: overdueRangeFilter,
                reconciliation: reconciliationFilter,
            });
            const downloadUrl = URL.createObjectURL(file);
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(downloadUrl);
            toast.success("Arquivo financeiro exportado com sucesso!");
        } catch (requestError) {
            console.error(requestError);
            toast.error("Não foi possível exportar o financeiro.");
        } finally {
            setExporting(false);
        }
    }

    const eligibleCharges = charges.filter(
        (charge) => (
            charge.status === "pending" || charge.status === "overdue"
        ) && charge.operational_category !== "inconsistent",
    );
    const selectedCharges = eligibleCharges.filter((charge) => (
        selectedChargeIds.has(charge.id)
    ));
    const selectedTotal = selectedCharges.reduce(
        (total, charge) => total + Number(charge.amount),
        0,
    );
    const allEligibleSelected = eligibleCharges.length > 0
        && eligibleCharges.every((charge) => selectedChargeIds.has(charge.id));

    function toggleChargeSelection(chargeId: string) {
        setSelectedChargeIds((current) => {
            const nextSelection = new Set(current);

            if (nextSelection.has(chargeId)) {
                nextSelection.delete(chargeId);
            } else {
                nextSelection.add(chargeId);
            }

            return nextSelection;
        });
    }

    function toggleAllEligibleCharges() {
        setSelectedChargeIds(
            allEligibleSelected
                ? new Set()
                : new Set(eligibleCharges.map((charge) => charge.id)),
        );
    }

    async function confirmBulkPayment() {
        if (selectedCharges.length === 0) return;

        try {
            setBulkProcessing(true);
            const result = await payChargesInBulk(
                selectedCharges.map((charge) => charge.id),
                bulkPaymentMethod,
            );
            setBulkPaymentOpen(false);
            setSelectedChargeIds(new Set());

            if (result.failed_count > 0) {
                toast.error(
                    `${result.succeeded_count} pagamento(s) registrado(s) e ${result.failed_count} não processado(s).`,
                );
            } else {
                toast.success(
                    `${result.succeeded_count} pagamento(s) registrado(s) com sucesso!`,
                );
            }

            await loadFinancial();
        } catch (requestError) {
            console.error(requestError);
            toast.error("Não foi possível processar os pagamentos em lote.");
        } finally {
            setBulkProcessing(false);
        }
    }

    function openReconciliation(charge: Charge) {
        setReconciliationCharge(charge);
        setReceivedAmount(charge.amount);
        setReconciliationNotes("");
    }

    async function confirmReconciliation() {
        if (!reconciliationCharge || receivedAmount === "") return;

        try {
            setReconciliationProcessing(true);
            const reconciled = await reconcileCharge(
                reconciliationCharge.id,
                receivedAmount.replace(",", "."),
                reconciliationNotes.trim(),
            );
            setReconciliationCharge(null);
            toast.success(
                reconciled.reconciliation?.status === "divergent"
                    ? "Conciliação registrada com divergência."
                    : "Pagamento conciliado com sucesso!",
            );
            await loadFinancial();
        } catch (requestError) {
            console.error(requestError);
            toast.error("Não foi possível conciliar o pagamento.");
        } finally {
            setReconciliationProcessing(false);
        }
    }

    function openForecastMonth(period: string) {
        const [year, month] = period.split("-").map(Number);
        const lastDay = new Date(year, month, 0).getDate();
        setCompetenceDateFrom(`${period}-01`);
        setCompetenceDateTo(`${period}-${String(lastDay).padStart(2, "0")}`);
        setShowAdvancedFilters(true);
        setPage(1);
    }

    const hasResults = viewMode === "charges"
        ? charges.length > 0
        : chargeGroups.length > 0;


    return (
        <DashboardLayout>
            <PageHeader
                title="Financeiro"
                subtitle="Acompanhe cobranças, recebimentos e inadimplência da academia."
                eyebrow="Pulso financeiro"
                context="Receita, risco e previsibilidade"
                actions={(
                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={exporting || loading || permissionDenied}
                        className="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Download size={17} />
                        {exporting ? "Exportando..." : "Exportar CSV"}
                    </button>
                )}
            />

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                {[
                    {
                        label: "Cobranças",
                        value: loading || error || permissionDenied
                            ? "—"
                            : String(summary.total_count),
                        detail: loading ? "Carregando..." : "No filtro atual",
                        icon: ReceiptText,
                        color: "bg-blue-50 text-blue-600",
                    },
                    {
                        label: "Total recebido",
                        value: loading || error || permissionDenied
                            ? "—"
                            : formatMoney(summary.paid_total),
                        detail: loading ? "Carregando..." : "Cobranças pagas",
                        icon: CheckCircle2,
                        color: "bg-emerald-50 text-emerald-600",
                    },
                    {
                        label: "Em aberto",
                        value: loading || error || permissionDenied
                            ? "—"
                            : formatMoney(summary.open_total),
                        detail: loading ? "Carregando..." : "Pendentes e atrasadas",
                        icon: Banknote,
                        color: "bg-amber-50 text-amber-600",
                    },
                    {
                        label: "Em atraso",
                        value: loading || error || permissionDenied
                            ? "—"
                            : formatMoney(summary.overdue_total),
                        detail: loading
                            ? "Carregando..."
                            : `${summary.overdue_count} cobrança(s)`,
                        icon: AlertTriangle,
                        color: "bg-red-50 text-red-600",
                    },
                ].map((item) => {
                    const Icon = item.icon;

                    return (
                        <div
                            key={item.label}
                            className="rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.3)]"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                                        {item.label}
                                    </p>
                                    <p className="mt-3 text-2xl font-black tracking-[-0.03em] text-slate-950">
                                        {item.value}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {item.detail}
                                    </p>
                                </div>
                                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.color}`}>
                                    <Icon size={20} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <DeferredFinancialSection><FinancialForecast
                    data={forecast}
                    loading={forecastLoading}
                    error={forecastError}
                    months={forecastMonths}
                    onMonthsChange={setForecastMonths}
                    onMonthOpen={openForecastMonth}
                    onRetry={loadForecast}
            /></DeferredFinancialSection>

            <DeferredFinancialSection><CashFlowSection canManage={canManage} /></DeferredFinancialSection>

            <DeferredFinancialSection><RecurringFailuresSection /></DeferredFinancialSection>

            <DeferredFinancialSection><FinancialInconsistenciesSection canManage={canManage} /></DeferredFinancialSection>

            <div
                id="financial-charges"
                className="mt-6 scroll-mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-[0_18px_45px_-32px_rgba(15,23,42,0.3)]"
            >
                {chargeFilter && (
                    <div className="flex flex-col gap-2 border-b border-blue-100 bg-blue-50/70 px-5 py-3 text-xs font-semibold text-blue-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <span>Exibindo a cobrança selecionada no Dashboard.</span>
                        <button
                            type="button"
                            onClick={() => {
                                setChargeFilter("");
                                setPage(1);
                                const nextParams = new URLSearchParams(searchParams);
                                nextParams.delete("charge");
                                setSearchParams(nextParams, { replace: true });
                            }}
                            className="self-start underline underline-offset-4 sm:self-auto"
                        >
                            Mostrar todas
                        </button>
                    </div>
                )}

                <div className="flex flex-col gap-3 border-b border-slate-200/80 p-5 md:flex-row md:items-center sm:p-6">
                    <div className="relative flex-1">
                        <Search
                            size={17}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Buscar por aluno, plano ou cobrança..."
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                        />
                    </div>

                    <select
                        value={categoryFilter}
                        onChange={(event) => {
                            setCategoryFilter(
                                event.target.value as ChargeCategoryFilter,
                            );
                            setPage(1);
                        }}
                        className="h-11 rounded-xl border border-slate-200 bg-slate-50/80 px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                    >
                        <option value="all">Todas as situações</option>
                        <option value="overdue">Vencidas</option>
                        <option value="due_soon">A vencer (30 dias)</option>
                        <option value="future">Futuras</option>
                        <option value="paid">Pagas</option>
                        <option value="canceled">Canceladas</option>
                        <option value="inconsistent">Inconsistentes</option>
                    </select>

                    <button
                        type="button"
                        onClick={() => setShowAdvancedFilters((current) => !current)}
                        className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                    >
                        <SlidersHorizontal size={16} />
                        Mais filtros
                        {advancedFilterCount > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                                {advancedFilterCount}
                            </span>
                        )}
                    </button>
                </div>

                {showAdvancedFilters && (
                    <div className="border-b border-slate-200/80 bg-slate-50/60 p-5 sm:p-6">
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <fieldset className="grid grid-cols-2 gap-3">
                                <legend className="col-span-2 mb-2 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                                    Período de vencimento
                                </legend>
                                <label className="text-xs font-semibold text-slate-600">
                                    De
                                    <input
                                        type="date"
                                        value={dueDateFrom}
                                        onChange={(event) => {
                                            setDueDateFrom(event.target.value);
                                            setPage(1);
                                        }}
                                        max={dueDateTo || undefined}
                                        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                                    />
                                </label>
                                <label className="text-xs font-semibold text-slate-600">
                                    Até
                                    <input
                                        type="date"
                                        value={dueDateTo}
                                        onChange={(event) => {
                                            setDueDateTo(event.target.value);
                                            setPage(1);
                                        }}
                                        min={dueDateFrom || undefined}
                                        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                                    />
                                </label>
                            </fieldset>

                            <fieldset className="grid grid-cols-2 gap-3">
                                <legend className="col-span-2 mb-2 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                                    Período de competência
                                </legend>
                                <label className="text-xs font-semibold text-slate-600">
                                    De
                                    <input
                                        type="date"
                                        value={competenceDateFrom}
                                        onChange={(event) => {
                                            setCompetenceDateFrom(event.target.value);
                                            setPage(1);
                                        }}
                                        max={competenceDateTo || undefined}
                                        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                                    />
                                </label>
                                <label className="text-xs font-semibold text-slate-600">
                                    Até
                                    <input
                                        type="date"
                                        value={competenceDateTo}
                                        onChange={(event) => {
                                            setCompetenceDateTo(event.target.value);
                                            setPage(1);
                                        }}
                                        min={competenceDateFrom || undefined}
                                        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                                    />
                                </label>
                            </fieldset>

                            <fieldset className="grid grid-cols-2 gap-3">
                                <legend className="col-span-2 mb-2 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                                    Período de pagamento
                                </legend>
                                <label className="text-xs font-semibold text-slate-600">
                                    De
                                    <input
                                        type="date"
                                        value={paidDateFrom}
                                        onChange={(event) => {
                                            setPaidDateFrom(event.target.value);
                                            setPage(1);
                                        }}
                                        max={paidDateTo || undefined}
                                        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                                    />
                                </label>
                                <label className="text-xs font-semibold text-slate-600">
                                    Até
                                    <input
                                        type="date"
                                        value={paidDateTo}
                                        onChange={(event) => {
                                            setPaidDateTo(event.target.value);
                                            setPage(1);
                                        }}
                                        min={paidDateFrom || undefined}
                                        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                                    />
                                </label>
                            </fieldset>

                            <div className="grid content-start gap-3 sm:grid-cols-2 xl:grid-cols-1">
                                <label className="text-xs font-semibold text-slate-600">
                                    Plano
                                    <select
                                        value={planFilter}
                                        onChange={(event) => {
                                            setPlanFilter(event.target.value);
                                            setPage(1);
                                        }}
                                        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                                    >
                                        <option value="">Todos os planos</option>
                                        {filterOptions.plans.map((plan) => (
                                            <option key={plan.id} value={plan.id}>
                                                {plan.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="text-xs font-semibold text-slate-600">
                                    Meio de pagamento
                                    <select
                                        value={paymentMethodFilter}
                                        onChange={(event) => {
                                            setPaymentMethodFilter(
                                                event.target.value as "all" | PaymentMethod,
                                            );
                                            setPage(1);
                                        }}
                                        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                                    >
                                        <option value="all">Todos os meios</option>
                                        {filterOptions.payment_methods.map((method) => (
                                            <option key={method.value} value={method.value}>
                                                {method.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="text-xs font-semibold text-slate-600">
                                    Faixa de atraso
                                    <select
                                        value={overdueRangeFilter}
                                        onChange={(event) => {
                                            setOverdueRangeFilter(
                                                event.target.value as OverdueRangeFilter,
                                            );
                                            setPage(1);
                                        }}
                                        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                                    >
                                        <option value="all">Todas as faixas</option>
                                        <option value="1_7">1 a 7 dias</option>
                                        <option value="8_15">8 a 15 dias</option>
                                        <option value="16_30">16 a 30 dias</option>
                                        <option value="31_60">31 a 60 dias</option>
                                        <option value="over_60">Mais de 60 dias</option>
                                    </select>
                                </label>
                                <label className="text-xs font-semibold text-slate-600">
                                    Conciliação
                                    <select
                                        value={reconciliationFilter}
                                        onChange={(event) => {
                                            setReconciliationFilter(
                                                event.target.value as ReconciliationFilter,
                                            );
                                            setPage(1);
                                        }}
                                        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                                    >
                                        <option value="all">Todas as situações</option>
                                        <option value="pending">Pendente</option>
                                        <option value="reconciled">Conciliada</option>
                                        <option value="divergent">Divergente</option>
                                    </select>
                                </label>
                            </div>
                        </div>

                        {advancedFilterCount > 0 && (
                            <button
                                type="button"
                                onClick={clearAdvancedFilters}
                                className="mt-4 flex items-center gap-1.5 text-xs font-bold text-slate-500 transition hover:text-red-600"
                            >
                                <X size={14} /> Limpar filtros avançados
                            </button>
                        )}
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 px-5 py-3 sm:px-6">
                    <span className="mr-1 text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
                        Visualização
                    </span>
                    {[
                        { value: "charges", label: "Cobranças" },
                        { value: "student", label: "Por aluno" },
                        { value: "enrollment", label: "Por matrícula" },
                    ].map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => changeViewMode(option.value as FinancialViewMode)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                                viewMode === option.value
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="overflow-x-auto" aria-label="Carregando financeiro" aria-busy="true">
                        <table className="cfit-data-table w-full min-w-[1460px]">
                            <thead className="cfit-table-header bg-slate-50/80 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                                <tr>{["", "Aluno", "Cobrança", "Plano", "Vencimento", "Competência", "Valor", "Status", "Pagamento", "Conciliação", "Ações"].map((label, index) => <th key={`${label}-${index}`} className="px-6 py-4">{label}</th>)}</tr>
                            </thead>
                            <tbody className="cfit-record-list">
                                {[1, 2, 3, 4].map((row) => (
                                    <tr key={row}>{Array.from({ length: 11 }, (_, cell) => <td key={cell} className="px-6 py-4"><SkeletonBlock className={`h-3 ${cell === 1 || cell === 2 ? "w-32" : cell === 10 ? "ml-auto w-20" : "w-20"}`} /></td>)}</tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : permissionDenied ? (
                    <div className="p-10 text-center">
                        <p className="font-semibold text-amber-800">
                            Acesso não permitido
                        </p>
                        <p className="mt-1 text-sm text-amber-700">
                            Seu usuário não possui permissão para consultar o financeiro.
                        </p>
                    </div>
                ) : error ? (
                    <div className="p-10 text-center">
                        <p className="font-semibold text-red-700">
                            Não foi possível carregar o financeiro.
                        </p>
                        <button
                            type="button"
                            onClick={loadFinancial}
                            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                        >
                            Tentar novamente
                        </button>
                    </div>
                ) : !hasResults ? (
                    <div className="p-10 text-center">
                        <ReceiptText
                            size={28}
                            className="mx-auto text-slate-300"
                        />
                        <p className="mt-3 font-semibold text-slate-800">
                            {debouncedSearch || categoryFilter !== "all" || advancedFilterCount > 0
                                ? "Nenhuma cobrança corresponde aos filtros"
                                : "Nenhuma cobrança cadastrada"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                            {debouncedSearch || categoryFilter !== "all" || advancedFilterCount > 0
                                ? "Altere a busca ou o filtro para consultar outros registros."
                                : "As cobranças geradas pelas matrículas aparecerão aqui."}
                        </p>
                    </div>
                ) : (
                    <>
                        {viewMode === "charges" ? (
                        <>
                        {canManage && <div className={`flex min-h-[73px] flex-col gap-3 border-b px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${
                            selectedCharges.length > 0
                                ? "border-blue-100 bg-blue-50/70"
                                : "border-slate-200 bg-slate-50/60"
                        }`}>
                            <div>
                                {selectedCharges.length > 0 ? (
                                    <>
                                        <p className="text-sm font-bold text-blue-950">
                                            {selectedCharges.length} cobrança(s) selecionada(s)
                                        </p>
                                        <p className="mt-0.5 text-xs text-blue-700">
                                            Total: {selectedTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm font-semibold text-slate-700">
                                            Pagamento em lote
                                        </p>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            Selecione cobranças disponíveis na tabela.
                                        </p>
                                    </>
                                )}
                            </div>
                            <button
                                type="button"
                                disabled={selectedCharges.length === 0}
                                onClick={() => {
                                    setBulkPaymentMethod("pix");
                                    setBulkPaymentOpen(true);
                                }}
                                className="h-10 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                            >
                                Registrar pagamentos
                            </button>
                        </div>}
                        <div className="overflow-x-auto">
                            <table className="cfit-data-table w-full min-w-[1460px]">
                                <thead className="bg-slate-50/80 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                                    <tr>
                                        <th className="w-12 px-4 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                checked={allEligibleSelected}
                                                onChange={toggleAllEligibleCharges}
                                                disabled={!canManage || eligibleCharges.length === 0}
                                                aria-label="Selecionar cobranças disponíveis nesta página"
                                                className="h-4 w-4 rounded border-slate-300 accent-blue-600 disabled:opacity-40"
                                            />
                                        </th>
                                        <th className="w-[220px] px-6 py-4">Aluno</th>
                                        <th className="px-6 py-4">Cobrança</th>
                                        <th className="px-6 py-4">Plano</th>
                                        <th className="px-6 py-4">Vencimento</th>
                                        <th className="px-6 py-4">Competência</th>
                                        <th className="px-6 py-4">Valor</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Pagamento</th>
                                        <th className="px-6 py-4">Conciliação</th>
                                        <th className="px-6 py-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="cfit-record-list">
                                    {charges.map((charge) => (
                                        <tr key={charge.id} data-selected={selectedChargeIds.has(charge.id)} className="text-sm text-slate-700 [&>td]:align-top">
                                            <td className="w-12 px-4 py-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedChargeIds.has(charge.id)}
                                                    onChange={() => toggleChargeSelection(charge.id)}
                                                    disabled={!canManage || !eligibleCharges.some((item) => item.id === charge.id)}
                                                    aria-label={`Selecionar cobrança de ${charge.student_name}`}
                                                    className="h-4 w-4 rounded border-slate-300 accent-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
                                                />
                                            </td>
                                            <td className="w-[220px] px-6 py-4">
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/students/${charge.student}`)}
                                                    className="group flex max-w-[190px] items-start gap-2 text-left font-semibold leading-5 text-slate-900 hover:text-blue-600"
                                                >
                                                    {charge.student_name}
                                                    <ExternalLink size={13} className="mt-0.5 shrink-0 opacity-0 transition group-hover:opacity-100" />
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-900">{charge.description}</td>
                                            <td className="px-6 py-4">{charge.plan_name}</td>
                                            <td className="px-6 py-4">{formatDate(charge.due_date)}</td>
                                            <td className="px-6 py-4">{formatDate(charge.competence_date)}</td>
                                            <td className="px-6 py-4 font-bold text-slate-950">{formatMoney(charge.amount)}</td>
                                            <td className="px-6 py-4">
                                                <span
                                                    title={`Status registrado: ${getStatusLabel(charge.status)}`}
                                                    className="cfit-chip"
                                                    data-tone={getCategoryTone(charge.operational_category)}
                                                >
                                                    <span aria-hidden="true" className="cfit-chip-dot" />
                                                    {getCategoryLabel(charge.operational_category)}
                                                </span>
                                                {charge.overdue_days > 0 && (
                                                    <p className="mt-1 text-[11px] font-semibold text-red-600">
                                                        {charge.overdue_days} dia(s) em atraso
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {getPaymentMethodLabel(charge.payment_method)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {charge.status === "paid" ? (
                                                    charge.reconciliation ? (
                                                        <span className="cfit-chip" data-tone={charge.reconciliation.status === "reconciled" ? "success" : "warning"}>
                                                            <span aria-hidden="true" className="cfit-chip-dot" />
                                                            {charge.reconciliation.status === "reconciled"
                                                                ? "Conciliada"
                                                                : "Divergente"}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs font-semibold text-amber-700">Pendente</span>
                                                    )
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {canManage && (charge.status === "pending" || charge.status === "overdue")
                                                    && charge.operational_category !== "inconsistent" ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setPaymentMethod("pix");
                                                                setPendingAction({ type: "pay", charge });
                                                            }}
                                                            className="h-9 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white transition hover:bg-emerald-700"
                                                        >
                                                            Registrar pagamento
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setCancellationReason("");
                                                                setPendingAction({ type: "cancel", charge });
                                                            }}
                                                            className="h-9 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                ) : charge.status === "paid" && !charge.reconciliation ? (
                                                    <div className="flex justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => openReconciliation(charge)}
                                                            className="h-9 rounded-lg border border-blue-200 px-3 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                                                        >
                                                            Conciliar
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="block text-right text-slate-400">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        </>
                        ) : (
                            <div className="cfit-record-list">
                                {chargeGroups.map((group) => {
                                    const expanded = expandedGroups.has(group.key);

                                    return (
                                        <div key={group.key}>
                                            <button
                                                type="button"
                                                onClick={() => toggleGroup(group.key)}
                                                className="grid w-full gap-4 px-5 py-5 text-left transition hover:bg-slate-50 sm:px-6 lg:grid-cols-[minmax(220px,1.5fr)_repeat(4,minmax(110px,1fr))_32px] lg:items-start"
                                            >
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                                                        Aluno
                                                    </p>
                                                    <p className="mt-1 truncate font-bold leading-5 text-slate-950" title={group.student_name}>
                                                        {group.student_name}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {viewMode === "enrollment"
                                                            ? group.plan_name
                                                            : `${group.charge_count} cobrança(s)`}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">Cobranças</p>
                                                    <p className="mt-1 font-bold text-slate-800">{group.charge_count}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">Valor total</p>
                                                    <p className="mt-1 font-bold text-slate-800">{formatMoney(group.total_amount)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">Em aberto</p>
                                                    <p className="mt-1 font-bold text-amber-700">{formatMoney(group.open_total)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">Vencidas</p>
                                                    <p className={`mt-1 font-bold ${group.overdue_count > 0 ? "text-red-600" : "text-slate-500"}`}>
                                                        {group.overdue_count}
                                                    </p>
                                                </div>
                                                <ChevronDown
                                                    size={18}
                                                    className={`mt-1 text-slate-400 transition ${expanded ? "rotate-180" : ""}`}
                                                />
                                            </button>

                                            {expanded && (
                                                <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
                                                    <div className="mb-3 flex justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => navigate(`/students/${group.student}`)}
                                                            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
                                                        >
                                                            Abrir ficha do aluno <ExternalLink size={13} />
                                                        </button>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="hidden px-4 lg:grid lg:grid-cols-[minmax(180px,1.5fr)_minmax(140px,1fr)_110px_120px_130px_170px] lg:gap-4">
                                                            {[
                                                                "Cobrança",
                                                                "Plano",
                                                                "Vencimento",
                                                                "Valor",
                                                                "Situação",
                                                                "Ações",
                                                            ].map((label) => (
                                                                <span
                                                                    key={label}
                                                                    className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 last:text-right"
                                                                >
                                                                    {label}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        {group.charges.map((charge) => (
                                                            <div
                                                                key={charge.id}
                                                                className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[minmax(180px,1.5fr)_minmax(140px,1fr)_110px_120px_130px_170px] lg:items-center"
                                                            >
                                                                <div className="min-w-0">
                                                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 lg:hidden">
                                                                        Cobrança
                                                                    </p>
                                                                    <p className="text-sm font-semibold text-slate-900">{charge.description}</p>
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 lg:hidden">
                                                                        Plano
                                                                    </p>
                                                                    <p className="truncate text-sm text-slate-600" title={charge.plan_name}>
                                                                        {charge.plan_name}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 lg:hidden">
                                                                        Vencimento
                                                                    </p>
                                                                    <p className="whitespace-nowrap text-sm text-slate-600">{formatDate(charge.due_date)}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 lg:hidden">
                                                                        Valor
                                                                    </p>
                                                                    <p className="whitespace-nowrap text-sm font-bold text-slate-900">{formatMoney(charge.amount)}</p>
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 lg:hidden">
                                                                        Situação
                                                                    </p>
                                                                    <span className="cfit-chip" data-tone={getCategoryTone(charge.operational_category)}>
                                                                        <span aria-hidden="true" className="cfit-chip-dot" />
                                                                        {getCategoryLabel(charge.operational_category)}
                                                                    </span>
                                                                </div>
                                                                {(charge.status === "pending" || charge.status === "overdue")
                                                                    && charge.operational_category !== "inconsistent" ? (
                                                                    <div className="flex items-center gap-2 lg:justify-end">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setPaymentMethod("pix");
                                                                                setPendingAction({ type: "pay", charge });
                                                                            }}
                                                                            className="h-8 rounded-lg bg-emerald-600 px-2.5 text-[11px] font-semibold text-white"
                                                                        >
                                                                            Pagar
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setCancellationReason("");
                                                                                setPendingAction({ type: "cancel", charge });
                                                                            }}
                                                                            className="h-8 rounded-lg border border-red-200 px-2.5 text-[11px] font-semibold text-red-600"
                                                                        >
                                                                            Cancelar
                                                                        </button>
                                                                    </div>
                                                                ) : charge.status === "paid" && !charge.reconciliation ? (
                                                                    <div className="flex lg:justify-end">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => openReconciliation(charge)}
                                                                            className="h-8 rounded-lg border border-blue-200 px-2.5 text-[11px] font-semibold text-blue-600"
                                                                        >
                                                                            Conciliar
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-slate-400 lg:text-right">—</span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {(previous || next) && (
                            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
                                <p className="text-sm text-slate-500">Página {page}</p>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        disabled={!previous}
                                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                                        className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 disabled:opacity-40"
                                    >
                                        <ChevronLeft size={15} /> Anterior
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!next}
                                        onClick={() => setPage((current) => current + 1)}
                                        className="flex h-9 items-center gap-1 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white disabled:opacity-40"
                                    >
                                        Próxima <ChevronRight size={15} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <ConfirmDialog
                open={reconciliationCharge !== null}
                title="Conciliar pagamento"
                description={reconciliationCharge
                    ? `Compare o valor recebido com os ${formatMoney(reconciliationCharge.amount)} esperados para esta cobrança.`
                    : ""}
                loading={reconciliationProcessing}
                onCancel={() => {
                    if (!reconciliationProcessing) {
                        setReconciliationCharge(null);
                    }
                }}
                onConfirm={confirmReconciliation}
            >
                <div className="mt-5 space-y-4">
                    <label className="block">
                        <span className="text-sm font-semibold text-slate-800">
                            Valor recebido
                            <span className="ml-1 text-red-500" aria-hidden="true">*</span>
                        </span>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={receivedAmount}
                            onChange={(event) => setReceivedAmount(event.target.value)}
                            disabled={reconciliationProcessing}
                            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                        />
                    </label>
                    {reconciliationCharge && receivedAmount !== "" && (
                        <div className={`rounded-xl px-4 py-3 text-xs font-semibold ${
                            Number(receivedAmount) === Number(reconciliationCharge.amount)
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-orange-50 text-orange-700"
                        }`}>
                            {Number(receivedAmount) === Number(reconciliationCharge.amount)
                                ? "Os valores conferem. A cobrança será conciliada."
                                : `Divergência de ${(Number(receivedAmount) - Number(reconciliationCharge.amount)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.`}
                        </div>
                    )}
                    <label className="block">
                        <span className="text-sm font-semibold text-slate-800">
                            Observação
                        </span>
                        <textarea
                            value={reconciliationNotes}
                            onChange={(event) => setReconciliationNotes(event.target.value)}
                            disabled={reconciliationProcessing}
                            maxLength={500}
                            rows={3}
                            placeholder="Detalhes opcionais da conferência."
                            className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                        />
                    </label>
                </div>
            </ConfirmDialog>

            <ConfirmDialog
                open={bulkPaymentOpen}
                title="Registrar pagamentos em lote"
                description={`Confirmar ${selectedCharges.length} pagamento(s), totalizando ${selectedTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}? Cada cobrança terá um registro individual de auditoria.`}
                loading={bulkProcessing}
                onCancel={() => !bulkProcessing && setBulkPaymentOpen(false)}
                onConfirm={confirmBulkPayment}
            >
                <label className="mt-5 block">
                    <span className="text-sm font-semibold text-slate-800">
                        Método de pagamento
                    </span>
                    <select
                        value={bulkPaymentMethod}
                        onChange={(event) => setBulkPaymentMethod(
                            event.target.value as PaymentMethod,
                        )}
                        disabled={bulkProcessing}
                        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10 disabled:opacity-60"
                    >
                        {paymentMethods.map((method) => (
                            <option key={method.value} value={method.value}>
                                {method.label}
                            </option>
                        ))}
                    </select>
                </label>
            </ConfirmDialog>

            <ConfirmDialog
                open={pendingAction !== null}
                title={pendingAction?.type === "pay" ? "Registrar pagamento" : "Cancelar cobrança"}
                description={actionDescription}
                loading={processing}
                onCancel={() => {
                    if (!processing) {
                        setPendingAction(null);
                        setCancellationReason("");
                    }
                }}
                onConfirm={confirmAction}
            >
                {pendingAction?.type === "pay" && (
                    <label className="mt-5 block">
                        <span className="text-sm font-semibold text-slate-800">
                            Método de pagamento
                        </span>
                        <select
                            value={paymentMethod}
                            onChange={(event) => setPaymentMethod(
                                event.target.value as PaymentMethod,
                            )}
                            disabled={processing}
                            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10 disabled:opacity-60"
                        >
                            {paymentMethods.map((method) => (
                                <option key={method.value} value={method.value}>
                                    {method.label}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
                {pendingAction?.type === "cancel" && (
                    <label className="mt-5 block">
                        <span className="text-sm font-semibold text-slate-800">
                            Motivo do cancelamento
                            <span className="ml-1 text-red-500" aria-hidden="true">*</span>
                        </span>
                        <textarea
                            value={cancellationReason}
                            onChange={(event) => setCancellationReason(event.target.value)}
                            disabled={processing}
                            required
                            maxLength={500}
                            rows={4}
                            placeholder="Explique por que esta cobrança está sendo cancelada."
                            className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10 disabled:opacity-60"
                        />
                        <span className="mt-1 block text-right text-xs text-slate-400">
                            {cancellationReason.length}/500
                        </span>
                    </label>
                )}
            </ConfirmDialog>
        </DashboardLayout>
    );
}
