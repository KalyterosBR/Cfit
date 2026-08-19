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
    notes: string;
    created_at: string;
}


export interface CheckInsResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: CheckIn[];
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
