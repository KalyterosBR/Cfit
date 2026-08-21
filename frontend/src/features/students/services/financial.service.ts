import { Api } from "../../../services/http";


export interface Charge {
    id: string;

    enrollment: string;
    student: string;

    student_name: string;
    plan_name: string;

    description: string;
    amount: string;

    due_date: string;
    competence_date: string;

    status:
    | "pending"
    | "paid"
    | "overdue"
    | "canceled";

    operational_category: OperationalCategory;
    overdue_days: number;

    paid_at: string | null;
    payment_method: PaymentMethod | null;
    reconciliation: ChargeReconciliation | null;

    notes: string;

    created_at: string;
    updated_at: string;
}


export type PaymentMethod =
    | "pix"
    | "cash"
    | "debit_card"
    | "credit_card"
    | "bank_transfer";


export interface ChargesResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Charge[];
}


// ==========================================
// LISTAR COBRANÇAS DO ALUNO
// ==========================================

export async function getStudentCharges(
    studentId: string,
): Promise<Charge[]> {
    const response = await Api.get<ChargesResponse>(
        "/financial/charges/",
        {
            params: {
                student: studentId,
            },
        },
    );

    return response.data.results;
}


// ==========================================
// REGISTRAR PAGAMENTO
// ==========================================

export async function payCharge(
    chargeId: string,
    paymentMethod: PaymentMethod,
): Promise<Charge> {
    const response = await Api.post<Charge>(
        `/financial/charges/${chargeId}/pay/`,
        { payment_method: paymentMethod },
    );

    return response.data;
}


// ==========================================
// CANCELAR COBRANÇA
// ==========================================

export async function cancelCharge(
    chargeId: string,
    reason: string,
): Promise<Charge> {
    const response = await Api.post<Charge>(
        `/financial/charges/${chargeId}/cancel/`,
        { reason },
    );

    return response.data;
}


export interface ChargeReconciliation {
    status: "reconciled" | "divergent";
    expected_amount: string;
    received_amount: string;
    notes: string;
    reconciled_at: string;
    reconciled_by: string;
}


export interface BulkPaymentResult {
    succeeded_count: number;
    failed_count: number;
    succeeded: Charge[];
    failed: Array<{ id: string; detail: string }>;
}


export async function payChargesInBulk(
    chargeIds: string[],
    paymentMethod: PaymentMethod,
): Promise<BulkPaymentResult> {
    const response = await Api.post<BulkPaymentResult>(
        "/financial/charges/bulk-pay/",
        {
            charge_ids: chargeIds,
            payment_method: paymentMethod,
        },
    );

    return response.data;
}


export async function reconcileCharge(
    chargeId: string,
    receivedAmount: string,
    notes: string,
): Promise<Charge> {
    const response = await Api.post<Charge>(
        `/financial/charges/${chargeId}/reconcile/`,
        { received_amount: receivedAmount, notes },
    );

    return response.data;
}

export type FinancialViewMode = "charges" | "student" | "enrollment";

export interface ChargeGroup {
    key: string;
    student: string;
    student_name: string;
    enrollment: string | null;
    plan_name: string | null;
    charge_count: number;
    total_amount: string;
    open_total: string;
    overdue_count: number;
    first_due_date: string;
    last_due_date: string;
    charges: Charge[];
}

export interface ChargeGroupsResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: ChargeGroup[];
}


export type ChargeStatusFilter =
    | "all"
    | Charge["status"];

export type OperationalCategory =
    | "overdue"
    | "due_soon"
    | "future"
    | "paid"
    | "canceled"
    | "inconsistent";

export type ChargeCategoryFilter = "all" | OperationalCategory;

export type OverdueRangeFilter =
    | "all"
    | "1_7"
    | "8_15"
    | "16_30"
    | "31_60"
    | "over_60";

export type ReconciliationFilter =
    | "all"
    | "pending"
    | "reconciled"
    | "divergent";


export interface FinancialSummary {
    total_count: number;
    paid_total: string;
    open_total: string;
    overdue_count: number;
    overdue_total: string;
}

export interface FinancialForecast {
    months: 3 | 6 | 12;
    period_start: string;
    period_end: string;
    totals: ForecastValues;
    historical_overdue: string;
    monthly: Array<ForecastValues & { period: string }>;
}

export type FinancialInconsistencyPriority =
    | "critical"
    | "high"
    | "medium"
    | "low";

export interface FinancialInconsistency {
    id: string;
    kind: string;
    priority: FinancialInconsistencyPriority;
    title: string;
    cause: string;
    next_action: string;
    entity_type: string;
    entity_id: string;
    student: string | null;
    student_name: string | null;
    context: string;
    responsible: string | null;
    source_updated_at: string | null;
    checked_at: string;
}

export interface FinancialInconsistencyResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: FinancialInconsistency[];
    summary: {
        total_count: number;
        critical_count: number;
        high_count: number;
        checked_at: string;
    };
}

interface ForecastValues {
    expected: string;
    received: string;
    pending: string;
    overdue: string;
}


export interface DashboardFinancialSummary {
    monthly_revenue: string;
    period_start: string;
    period_end: string;
    previous_revenue: string;
    growth_percentage: string | null;
    revenue_difference: string;
    current_payment_count: number;
    previous_payment_count: number;
    current_average_ticket: string;
    previous_average_ticket: string;
    volume_effect: string;
    ticket_effect: string;
    growth_driver:
        | "payment_volume"
        | "average_ticket"
        | "combined"
        | "stable"
        | "no_comparison";
    comparison_start: string;
    comparison_end: string;
    revenue_history: Array<{
        period: string;
        revenue: string;
    }>;
    recent_payments: Charge[];
}


export interface MonthlyRevenueGoal {
    period: string;
    target_amount: string | null;
    updated_at: string | null;
    updated_by: string | null;
}


export interface ChargeFilters {
    page: number;
    search: string;
    category: ChargeCategoryFilter;
    dueDateFrom: string;
    dueDateTo: string;
    competenceDateFrom: string;
    competenceDateTo: string;
    paidDateFrom: string;
    paidDateTo: string;
    charge: string;
    plan: string;
    paymentMethod: "all" | PaymentMethod;
    overdueRange: OverdueRangeFilter;
    reconciliation: ReconciliationFilter;
}


function buildFilters({
    page,
    search,
    category,
    dueDateFrom,
    dueDateTo,
    competenceDateFrom,
    competenceDateTo,
    paidDateFrom,
    paidDateTo,
    charge,
    plan,
    paymentMethod,
    overdueRange,
    reconciliation,
}: ChargeFilters) {
    return {
        page,
        ...(search.trim()
            ? { search: search.trim() }
            : {}),
        ...(category !== "all"
            ? { category }
            : {}),
        ...(dueDateFrom ? { due_date_from: dueDateFrom } : {}),
        ...(dueDateTo ? { due_date_to: dueDateTo } : {}),
        ...(competenceDateFrom
            ? { competence_date_from: competenceDateFrom }
            : {}),
        ...(competenceDateTo
            ? { competence_date_to: competenceDateTo }
            : {}),
        ...(paidDateFrom ? { paid_date_from: paidDateFrom } : {}),
        ...(paidDateTo ? { paid_date_to: paidDateTo } : {}),
        ...(charge ? { charge } : {}),
        ...(plan ? { plan } : {}),
        ...(paymentMethod !== "all"
            ? { payment_method: paymentMethod }
            : {}),
        ...(overdueRange !== "all"
            ? { overdue_range: overdueRange }
            : {}),
        ...(reconciliation !== "all"
            ? { reconciliation_status: reconciliation }
            : {}),
    };
}


export async function getCharges(
    filters: ChargeFilters,
): Promise<ChargesResponse> {
    const response = await Api.get<ChargesResponse>(
        "/financial/charges/",
        {
            params: buildFilters(filters),
        },
    );

    return response.data;
}


export async function getGroupedCharges(
    filters: ChargeFilters,
    groupBy: Exclude<FinancialViewMode, "charges">,
): Promise<ChargeGroupsResponse> {
    const response = await Api.get<ChargeGroupsResponse>(
        "/financial/charges/grouped/",
        {
            params: {
                ...buildFilters(filters),
                group_by: groupBy,
            },
        },
    );

    return response.data;
}


export async function getFinancialSummary(
    filters: Omit<ChargeFilters, "page">,
): Promise<FinancialSummary> {
    const response = await Api.get<FinancialSummary>(
        "/financial/charges/summary/",
        {
            params: buildFilters({
                ...filters,
                page: 1,
            }),
        },
    );

    return response.data;
}


export async function getFinancialForecast(
    filters: Omit<ChargeFilters, "page">,
    months: 3 | 6 | 12,
): Promise<FinancialForecast> {
    const response = await Api.get<FinancialForecast>(
        "/financial/charges/forecast/",
        {
            params: {
                ...buildFilters({ ...filters, page: 1 }),
                months,
            },
        },
    );

    return response.data;
}


export async function getFinancialInconsistencies(
    priority: "all" | FinancialInconsistencyPriority,
    search: string,
    page: number,
): Promise<FinancialInconsistencyResponse> {
    const response = await Api.get<FinancialInconsistencyResponse>(
        "/financial/charges/inconsistencies/",
        {
            params: {
                priority: priority === "all" ? undefined : priority,
                search: search.trim() || undefined,
                page,
            },
        },
    );

    return response.data;
}


export async function exportFinancialCharges(
    filters: Omit<ChargeFilters, "page">,
): Promise<{ file: Blob; filename: string }> {
    const response = await Api.get<Blob>(
        "/financial/charges/export/",
        {
            params: buildFilters({ ...filters, page: 1 }),
            responseType: "blob",
        },
    );
    const disposition = String(response.headers["content-disposition"] ?? "");
    const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);

    return {
        file: response.data,
        filename: filenameMatch?.[1] ?? "cfit-financeiro.csv",
    };
}


export interface FinancialFilterOptions {
    plans: Array<{ id: string; name: string }>;
    payment_methods: Array<{ value: PaymentMethod; label: string }>;
}


export async function getFinancialFilterOptions(): Promise<FinancialFilterOptions> {
    const response = await Api.get<FinancialFilterOptions>(
        "/financial/charges/filter-options/",
    );

    return response.data;
}


export async function getDashboardFinancialSummary(
    period?: string,
): Promise<DashboardFinancialSummary> {
    const response = await Api.get<DashboardFinancialSummary>(
        "/financial/charges/dashboard-summary/",
        {
            params: period ? { period } : undefined,
        },
    );

    return response.data;
}


export async function getDashboardOverdueCharges(): Promise<Charge[]> {
    const response = await Api.get<ChargesResponse>(
        "/financial/charges/",
        {
            params: {
                status: "overdue",
                ordering: "due_date",
                page_size: 4,
            },
        },
    );

    return response.data.results;
}


export async function getDashboardOverdueSummary(): Promise<FinancialSummary> {
    const response = await Api.get<FinancialSummary>(
        "/financial/charges/summary/",
        {
            params: { category: "overdue" },
        },
    );

    return response.data;
}


export async function getMonthlyRevenueGoal(
    period: string,
): Promise<MonthlyRevenueGoal> {
    const response = await Api.get<MonthlyRevenueGoal>(
        "/financial/revenue-goals/",
        { params: { period } },
    );

    return response.data;
}


export async function saveMonthlyRevenueGoal(
    period: string,
    targetAmount: string,
): Promise<MonthlyRevenueGoal> {
    const response = await Api.post<MonthlyRevenueGoal>(
        "/financial/revenue-goals/",
        {
            period,
            target_amount: targetAmount,
        },
    );

    return response.data;
}
