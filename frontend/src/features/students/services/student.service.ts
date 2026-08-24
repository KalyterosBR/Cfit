import { Api } from "../../../services/http";

type StudentPayload = {
    name: string;
    cpf: string;
    phone: string;

    birth_date: string | null;
    email: string | null;

    cep: string | null;
    street: string | null;
    number: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;

    emergency_contact: string | null;
    emergency_phone: string | null;
};

export type StudentStatus = "all" | "active" | "inactive";
export type StudentSegment =
    | "all"
    | "defaulting"
    | "without_plan"
    | "without_recent_checkin"
    | "at_risk"
    | "plan_ending"
    | "without_workout"
    | "without_assessment"
    | "birthdays"
    | "access_blocked"
    | "incomplete_profile";

export interface StudentHealthScore {
    student: string;
    student_name: string;
    score: number;
    status: "healthy" | "attention" | "risk";
    factors: Array<{ code: string; impact: number; label: string }>;
}

export interface StudentHealthSummary {
    total_count: number;
    healthy_count: number;
    attention_count: number;
    risk_count: number;
    at_risk: StudentHealthScore[];
    methodology: { base_score: number; thresholds: { healthy: number; attention: number }; factors: Record<string, number> };
}

export interface StudentOperationalSummary {
    active_plans: Array<{
        id: string;
        name: string;
    }>;
    next_charge: {
        id: string;
        due_date: string;
        amount: string;
        status: "pending" | "overdue";
        origin: { enrollment_id: string; enrollment_status: string; enrollment_status_label: string; plan_name: string; is_active_enrollment: boolean };
    } | null;
    financial: { status: string; reason: string };
    health: StudentHealthScore;
    latest_checkin_at: string | null;
    checkins_last_30_days: number;
    current_workout: {
        id: string;
        name: string;
        objective: string;
        review_date: string | null;
        instructor: string;
    } | null;
}

export type StudentTimelineEventType =
    | "enrollment_created"
    | "enrollment_frozen"
    | "enrollment_reactivated"
    | "enrollment_canceled"
    | "enrollment_finished"
    | "charge_created"
    | "payment_registered"
    | "charge_canceled"
    | "checkin_registered"
    | "student_deactivated"
    | "student_reactivated";

export interface StudentTimelineEvent {
    id: string;
    type: StudentTimelineEventType;
    category: "Matrícula" | "Financeiro" | "Check-in" | "Cadastro";
    title: string;
    description: string;
    occurred_at: string;
    context: string;
    actor_name: string | null;
}


export interface DashboardStudentSummary {
    period: string;
    period_start: string;
    period_end: string;
    active_count: number;
    previous_period: string;
    previous_active_count: number;
    change: number;
    change_percentage: number | null;
    created_count: number;
    deactivated_count: number;
    reactivated_count: number;
    event_net_change: number;
    data_quality: "complete" | "partial";
    history_available_from: string | null;
}


export interface MonthlyActiveStudentGoal {
    period: string;
    target_count: number | null;
    updated_at: string | null;
    updated_by: string | null;
}


export async function getStudents(
    search = "",
    status: StudentStatus = "all",
    segment: StudentSegment = "all",
) {
    const response = await Api.get("/students/", {
        params: {
            search,
            active:
                status === "all"
                    ? undefined
                    : status === "active",
            segment: segment === "all" ? undefined : segment,
        },
    });

    return response.data;
}

export async function getStudent(id: string) {
    const response = await Api.get(
        `/students/${id}/`,
    );

    return response.data;
}

export async function createStudent(
    data: StudentPayload,
) {
    const response = await Api.post(
        "/students/",
        data,
    );

    return response.data;
}

export async function updateStudent(
    id: string,
    data: StudentPayload,
) {
    const response = await Api.put(
        `/students/${id}/`,
        data,
    );

    return response.data;
}

export async function deactivateStudent(id: string, reason: string) {
    const response = await Api.post(
        `/students/${id}/deactivate/`,
        { reason },
    );

    return response.data;
}

export async function activateStudent(id: string) {
    const response = await Api.post(
        `/students/${id}/activate/`,
    );

    return response.data;
}

export async function deleteStudent(id: string) {
    await Api.delete(`/students/${id}/`);
}

export async function getStudentOperationalSummary(
    id: string,
): Promise<StudentOperationalSummary> {
    const response = await Api.get<StudentOperationalSummary>(
        `/students/${id}/operational-summary/`,
    );

    return response.data;
}

export async function getStudentTimeline(
    id: string,
): Promise<StudentTimelineEvent[]> {
    const response = await Api.get<{
        events: StudentTimelineEvent[];
    }>(`/students/${id}/timeline/`);

    return response.data.events;
}


export async function getActiveStudentsCount(): Promise<number> {
    const response = await Api.get<{ count: number }>(
        "/students/summary/",
        {
            params: {
                active: true,
            },
        },
    );

    return response.data.count;
}


export async function getActiveStudentSegmentCount(
    segment: Exclude<StudentSegment, "all">,
): Promise<number> {
    const response = await Api.get<{ count: number }>(
        "/students/summary/",
        {
            params: {
                active: true,
                segment,
            },
        },
    );

    return response.data.count;
}

export async function getStudentHealthSummary(): Promise<StudentHealthSummary> {
    const response = await Api.get<StudentHealthSummary>("/students/health-summary/");
    return response.data;
}

export async function getStudentHealthScore(id: string): Promise<StudentHealthScore> {
    const response = await Api.get<StudentHealthScore>(`/students/${id}/health-score/`);
    return response.data;
}


export async function getDashboardStudentSummary(
    period: string,
): Promise<DashboardStudentSummary> {
    const response = await Api.get<DashboardStudentSummary>(
        "/students/dashboard-summary/",
        { params: { period } },
    );

    return response.data;
}


export async function getMonthlyActiveStudentGoal(
    period: string,
): Promise<MonthlyActiveStudentGoal> {
    const response = await Api.get<MonthlyActiveStudentGoal>(
        "/students/monthly-goal/",
        { params: { period } },
    );

    return response.data;
}


export async function saveMonthlyActiveStudentGoal(
    period: string,
    targetCount: number,
): Promise<MonthlyActiveStudentGoal> {
    const response = await Api.post<MonthlyActiveStudentGoal>(
        "/students/monthly-goal/",
        { period, target_count: targetCount },
    );

    return response.data;
}
