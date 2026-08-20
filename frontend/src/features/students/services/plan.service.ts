import { Api } from "../../../services/http";


export interface Plan {
    id: string;
    active: boolean;

    name: string;
    description: string;

    price: string;
    monthly_equivalent: string;
    duration_months: number;
    billing_period:
        | "monthly"
        | "quarterly"
        | "semiannual"
        | "annual"
        | "one_time";
    billing_period_label: string;
    recurring: boolean;
    enrollment_fee: string;
    minimum_commitment_months: number;
    auto_renew: boolean;
    available_for_enrollment: boolean;
    modalities: string;
    benefits: string;
    access_rules: string;
    cancellation_rules: string;
    freeze_rules: string;
    contract_text: string;
    contract_version: number;
    active_students_count: number;

    created_at: string;
    updated_at: string;
}


export interface PlansResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Plan[];
}


export interface SavePlanPayload {
    name: string;
    description: string;
    price: string;
    duration_months: number;
    billing_period: Plan["billing_period"];
    recurring: boolean;
    enrollment_fee: string;
    minimum_commitment_months: number;
    auto_renew: boolean;
    available_for_enrollment: boolean;
    modalities: string;
    benefits: string;
    access_rules: string;
    cancellation_rules: string;
    freeze_rules: string;
    contract_text: string;
}


export type PlanStatusFilter =
    | "all"
    | "active"
    | "inactive";


export async function getPlans(): Promise<Plan[]> {
    const response = await Api.get<PlansResponse>(
        "/plans/",
    );

    return response.data.results;
}


export async function getPlansPage({
    page,
    search,
    status,
}: {
    page: number;
    search: string;
    status: PlanStatusFilter;
}): Promise<PlansResponse> {
    const response = await Api.get<PlansResponse>(
        "/plans/",
        {
            params: {
                include_inactive: true,
                page,
                search: search || undefined,
                active:
                    status === "all"
                        ? undefined
                        : status === "active",
                ordering: "name",
            },
        },
    );

    return response.data;
}


export async function createPlan(
    payload: SavePlanPayload,
): Promise<Plan> {
    const response = await Api.post<Plan>(
        "/plans/",
        payload,
    );

    return response.data;
}


export async function updatePlan(
    planId: string,
    payload: Partial<SavePlanPayload> & {
        active?: boolean;
    },
): Promise<Plan> {
    const response = await Api.patch<Plan>(
        `/plans/${planId}/`,
        payload,
    );

    return response.data;
}
