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
    | "without_recent_checkin";

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
    } | null;
    latest_checkin_at: string | null;
    checkins_last_30_days: number;
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
