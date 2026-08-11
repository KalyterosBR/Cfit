import { Api } from "../../../services/http";


export interface Charge {
    id: string;

    enrollment: string;

    student_name: string;
    plan_name: string;

    description: string;
    amount: string;

    due_date: string;

    status:
    | "pending"
    | "paid"
    | "overdue"
    | "canceled";

    paid_at: string | null;

    notes: string;

    created_at: string;
    updated_at: string;
}


interface ChargesResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Charge[];
}


// ==========================================
// LISTAR COBRANÇAS DO ALUNO
// ==========================================

export async function getStudentCharges(
    studentId: string,
): Promise<Charge[]> {
    const response = await Api.get<ChargesResponse>(
        "/financial/charges/",
        {
            params: {
                student: studentId,
            },
        },
    );

    return response.data.results;
}


// ==========================================
// REGISTRAR PAGAMENTO
// ==========================================

export async function payCharge(
    chargeId: string,
): Promise<Charge> {
    const response = await Api.post<Charge>(
        `/financial/charges/${chargeId}/pay/`,
    );

    return response.data;
}


// ==========================================
// CANCELAR COBRANÇA
// ==========================================

export async function cancelCharge(
    chargeId: string,
): Promise<Charge> {
    const response = await Api.post<Charge>(
        `/financial/charges/${chargeId}/cancel/`,
    );

    return response.data;
}