import { Api } from "../../../services/http";


export interface Enrollment {
    id: string;

    student: string;
    student_name: string;

    plan: string;
    plan_name: string;

    contracted_price: string;
    original_price: string;
    discount_amount: string;
    discount_reason: string;

    start_date: string;
    due_date: string;

    status:
    | "active"
    | "frozen"
    | "canceled"
    | "finished"
    | "expired";

    billing_method: "monthly" | "full";

    notes: string;

    contract_version: number | null;
    contract_snapshot: Record<string, unknown>;
    contract_accepted_at: string | null;
    contract_accepted_by: number | null;
    created_by: number | null;

    created_at: string;
    updated_at: string;
}


export interface EnrollmentFreeze {
    id: string;

    enrollment: string;

    plan_name: string;
    student_name: string;

    frozen_at: string;
    reactivated_at: string | null;

    reason: string;

    created_at: string;
    updated_at: string;
}


/*
 * HISTÓRICO GERAL DA MATRÍCULA
 *
 * Tipos de evento atualmente registrados pelo backend:
 * - created
 * - frozen
 * - reactivated
 * - canceled
 * - finished
 */
export interface EnrollmentHistory {
    id: string;

    enrollment: string;

    student_name: string;
    plan_name: string;

    event_type:
    | "created"
    | "frozen"
    | "reactivated"
    | "canceled"
    | "finished";

    event_label: string;

    event_date: string;

    description: string;

    created_at: string;
    updated_at: string;
}


export interface CreateEnrollmentPayload {
    student: string;
    plan: string;

    discount_amount: string;
    discount_reason: string;

    start_date: string;
    due_date: string;

    status: Enrollment["status"];
    billing_method: Enrollment["billing_method"];

    notes: string;
    contract_accepted: boolean;
}

export interface EnrollmentChargePreview {
    original_price: string;
    discount_amount: string;
    final_price: string;
    enrollment_fee: string;
    total_expected: string;
    charges: Array<{
        description: string;
        amount: string;
        due_date: string;
    }>;
}


export interface UpdateEnrollmentPayload {
    status?: Enrollment["status"];

    contracted_price?: string;

    start_date?: string;
    due_date?: string;

    billing_method?: Enrollment["billing_method"];

    notes?: string;
}


/*
 * MATRÍCULAS DO ALUNO
 */
export async function getStudentEnrollments(
    studentId: string,
): Promise<Enrollment[]> {
    const response = await Api.get<Enrollment[]>(
        `/enrollments/student/${studentId}/`,
    );

    return response.data;
}


/*
 * HISTÓRICO GERAL DO ALUNO
 *
 * Esta será a fonte principal da aba Histórico.
 */
export async function getStudentEnrollmentHistory(
    studentId: string,
): Promise<EnrollmentHistory[]> {
    const response = await Api.get<EnrollmentHistory[]>(
        `/enrollments/student/${studentId}/history/`,
    );

    return response.data;
}


/*
 * HISTÓRICO ESPECÍFICO DE CONGELAMENTOS
 *
 * Continua disponível porque EnrollmentFreeze
 * guarda os períodos de congelamento.
 */
export async function getStudentFreezeHistory(
    studentId: string,
): Promise<EnrollmentFreeze[]> {
    const response = await Api.get<EnrollmentFreeze[]>(
        `/enrollments/student/${studentId}/freeze-history/`,
    );

    return response.data;
}


/*
 * CRIAR MATRÍCULA
 */
export async function createEnrollment(
    data: CreateEnrollmentPayload,
): Promise<Enrollment> {
    const response = await Api.post<Enrollment>(
        "/enrollments/",
        data,
    );

    return response.data;
}


/*
 * ATUALIZAR MATRÍCULA
 *
 * Usado para alterações comuns nos dados.
 *
 * Mudanças importantes de status utilizam
 * os endpoints específicos abaixo.
 */
export async function updateEnrollment(
    enrollmentId: string,
    data: UpdateEnrollmentPayload,
): Promise<Enrollment> {
    const response = await Api.patch<Enrollment>(
        `/enrollments/${enrollmentId}/`,
        data,
    );

    return response.data;
}


/*
 * CONGELAR MATRÍCULA
 */
export async function freezeEnrollment(
    enrollmentId: string,
    frozenUntil?: string,
): Promise<Enrollment> {
    const response = await Api.post<Enrollment>(
        `/enrollments/${enrollmentId}/freeze/`, { frozen_until: frozenUntil || null },
    );

    return response.data;
}


/*
 * REATIVAR MATRÍCULA
 */
export async function reactivateEnrollment(
    enrollmentId: string,
): Promise<Enrollment> {
    const response = await Api.post<Enrollment>(
        `/enrollments/${enrollmentId}/reactivate/`,
    );

    return response.data;
}


/*
 * CANCELAR MATRÍCULA
 */
export async function cancelEnrollment(
    enrollmentId: string,
    reason: string,
): Promise<Enrollment> {
    const response = await Api.post<Enrollment>(
        `/enrollments/${enrollmentId}/cancel/`, { reason },
    );

    return response.data;
}


/*
 * ENCERRAR MATRÍCULA
 */
export async function finishEnrollment(
    enrollmentId: string,
): Promise<Enrollment> {
    const response = await Api.post<Enrollment>(
        `/enrollments/${enrollmentId}/finish/`,
    );

    return response.data;
}

export async function renewEnrollment(enrollmentId: string, dueDate: string): Promise<Enrollment> {
    const response = await Api.post<Enrollment>(`/enrollments/${enrollmentId}/renew/`, { due_date: dueDate, reason: "Renovação registrada pela ficha do aluno" });
    return response.data;
}

export async function previewEnrollmentCharges(data: {
    plan: string;
    discount_amount: string;
    discount_reason: string;
    due_date: string;
    billing_method: Enrollment["billing_method"];
}): Promise<EnrollmentChargePreview> {
    const response = await Api.post<EnrollmentChargePreview>(
        "/enrollments/preview-charges/",
        data,
    );

    return response.data;
}
