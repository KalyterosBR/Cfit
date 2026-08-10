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

interface PlansResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Plan[];
}

export async function getPlans(): Promise<Plan[]> {
    const response = await Api.get<PlansResponse>(
        "/plans/",
    );

    return response.data.results;
}