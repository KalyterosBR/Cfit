import { Api } from "../../../services/http";


export interface CheckIn {
    id: string;

    student: string;
    student_name: string;

    checked_in_at: string;

    source:
    | "manual"
    | "access_control"
    | "facial_recognition";

    source_label: string;
    access_result: "allowed" | "blocked";
    access_result_label: string;
    block_reason: string;
    equipment: string;
    notes: string;
    created_at: string;
}


export interface CheckInsResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: CheckIn[];
}


export interface DashboardCheckInSummary {
    today_count: number;
    period: string;
    period_count: number;
    recent_checkins: CheckIn[];
}


export interface MonthlyCheckInGoal {
    period: string;
    target_count: number | null;
    updated_at: string | null;
    updated_by: string | null;
}


export async function getStudentCheckIns(
    studentId: string,
    page: number,
): Promise<CheckInsResponse> {
    const response = await Api.get<CheckInsResponse>(
        "/checkins/",
        {
            params: {
                student: studentId,
                page,
            },
        },
    );

    return response.data;
}


export async function getCheckIns(filters: {
    page: number;
    checkedInFrom: string;
    checkedInTo: string;
    source: "all" | CheckIn["source"];
    accessResult?: "all" | CheckIn["access_result"];
}): Promise<CheckInsResponse> {
    const response = await Api.get<CheckInsResponse>("/checkins/", {
        params: {
            page: filters.page,
            checked_in_from: filters.checkedInFrom || undefined,
            checked_in_to: filters.checkedInTo || undefined,
            source: filters.source === "all" ? undefined : filters.source,
            access_result: !filters.accessResult || filters.accessResult === "all" ? undefined : filters.accessResult,
        },
    });

    return response.data;
}

export interface AccessSummary {
    total_count: number;
    allowed_count: number;
    blocked_count: number;
    by_source: Array<{ source: CheckIn["source"]; count: number }>;
}

export async function getAccessSummary(filters: {
    checkedInFrom: string;
    checkedInTo: string;
    source: "all" | CheckIn["source"];
    accessResult: "all" | CheckIn["access_result"];
}): Promise<AccessSummary> {
    const response = await Api.get<AccessSummary>("/checkins/access-summary/", {
        params: {
            checked_in_from: filters.checkedInFrom || undefined,
            checked_in_to: filters.checkedInTo || undefined,
            source: filters.source === "all" ? undefined : filters.source,
            access_result: filters.accessResult === "all" ? undefined : filters.accessResult,
        },
    });
    return response.data;
}


export async function createCheckIn(
    studentId: string,
    notes: string,
): Promise<CheckIn> {
    const response = await Api.post<CheckIn>(
        "/checkins/",
        {
            student: studentId,
            source: "manual",
            notes,
        },
    );

    return response.data;
}


export async function getDashboardCheckInSummary(
    period?: string,
): Promise<DashboardCheckInSummary> {
    const response = await Api.get<DashboardCheckInSummary>(
        "/checkins/dashboard-summary/",
        { params: period ? { period } : undefined },
    );

    return response.data;
}


export async function getMonthlyCheckInGoal(
    period: string,
): Promise<MonthlyCheckInGoal> {
    const response = await Api.get<MonthlyCheckInGoal>(
        "/checkins/monthly-goal/",
        { params: { period } },
    );

    return response.data;
}


export async function saveMonthlyCheckInGoal(
    period: string,
    targetCount: number,
): Promise<MonthlyCheckInGoal> {
    const response = await Api.post<MonthlyCheckInGoal>(
        "/checkins/monthly-goal/",
        {
            period,
            target_count: targetCount,
        },
    );

    return response.data;
}
