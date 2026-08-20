import { Api } from "@/services/http";


export type RecurringAttemptStatus =
    | "pending"
    | "processing"
    | "approved"
    | "rejected";

export interface RecurringAttempt {
    id: number;
    charge: number;
    charge_description: string;
    charge_amount: string;
    student: string;
    student_name: string;
    plan_name: string;
    attempt_number: number;
    status: RecurringAttemptStatus;
    status_label: string;
    source: "automatic" | "integration" | "manual";
    source_label: string;
    provider: string;
    external_reference: string;
    failure_code: string;
    failure_reason: string;
    next_retry_at: string | null;
    recorded_by: string | null;
    occurred_at: string;
    created_at: string;
}

export interface RecurringAttemptSummary {
    total_count: number;
    pending_count: number;
    processing_count: number;
    approved_count: number;
    rejected_count: number;
    retry_due_count: number;
    unresolved_charge_count: number;
}

interface PaginatedAttempts {
    count: number;
    next: string | null;
    previous: string | null;
    results: RecurringAttempt[];
}

export async function getRecurringAttempts(
    status: "all" | RecurringAttemptStatus,
    search: string,
): Promise<PaginatedAttempts> {
    const response = await Api.get<PaginatedAttempts>(
        "/financial/recurring-attempts/",
        {
            params: {
                status: status === "all" ? undefined : status,
                search: search.trim() || undefined,
            },
        },
    );

    return response.data;
}

export async function getRecurringAttemptSummary(
    status: "all" | RecurringAttemptStatus,
    search: string,
): Promise<RecurringAttemptSummary> {
    const response = await Api.get<RecurringAttemptSummary>(
        "/financial/recurring-attempts/summary/",
        {
            params: {
                status: status === "all" ? undefined : status,
                search: search.trim() || undefined,
            },
        },
    );

    return response.data;
}
