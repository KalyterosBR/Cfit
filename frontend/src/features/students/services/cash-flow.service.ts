import { Api } from "@/services/http";


export type CashTransactionType = "income" | "expense";
export type CashTransactionStatus = "planned" | "realized";
export type CashCategory =
    | "membership"
    | "services"
    | "payroll"
    | "rent"
    | "utilities"
    | "taxes"
    | "maintenance"
    | "marketing"
    | "other";

export interface CashTransaction {
    id: number;
    transaction_type: CashTransactionType;
    transaction_type_label: string;
    status: CashTransactionStatus;
    status_label: string;
    category: CashCategory;
    category_label: string;
    description: string;
    amount: string;
    competence_date: string;
    transaction_date: string | null;
    charge: number | null;
    notes: string;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface CashFlowFilters {
    transactionType: "all" | CashTransactionType;
    status: "all" | CashTransactionStatus;
    category: "all" | CashCategory;
}

export interface CashFlowSummary {
    granularity: "daily" | "monthly";
    period_start: string;
    period_end: string;
    opening_balance_included: boolean;
    totals: CashFlowValues & {
        projected_balance: string;
        realized_balance: string;
    };
    periods: Array<CashFlowValues & {
        period: string;
        projected_net: string;
        realized_net: string;
        projected_balance: string;
        realized_balance: string;
    }>;
}

interface CashFlowValues {
    projected_income: string;
    realized_income: string;
    projected_expense: string;
    realized_expense: string;
}

export interface SaveCashTransaction {
    transaction_type: CashTransactionType;
    status: CashTransactionStatus;
    category: CashCategory;
    description: string;
    amount: string;
    competence_date: string;
    transaction_date: string | null;
    notes: string;
}

function filterParams(filters: CashFlowFilters) {
    return {
        transaction_type: filters.transactionType === "all"
            ? undefined
            : filters.transactionType,
        status: filters.status === "all" ? undefined : filters.status,
        category: filters.category === "all" ? undefined : filters.category,
    };
}

export async function getCashFlowSummary(
    filters: CashFlowFilters,
    granularity: "daily" | "monthly",
    months: 3 | 6 | 12,
): Promise<CashFlowSummary> {
    const response = await Api.get<CashFlowSummary>(
        "/financial/cash-transactions/summary/",
        {
            params: {
                ...filterParams(filters),
                granularity,
                months,
            },
        },
    );

    return response.data;
}

export async function createCashTransaction(
    payload: SaveCashTransaction,
): Promise<CashTransaction> {
    const response = await Api.post<CashTransaction>(
        "/financial/cash-transactions/",
        payload,
    );

    return response.data;
}
