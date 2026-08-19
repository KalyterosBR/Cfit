import { Api } from "../../../services/http";


export interface Plan {
    id: string;
    active: boolean;

    name: string;
    description: string;

    price: string;
    duration_months: number;

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
