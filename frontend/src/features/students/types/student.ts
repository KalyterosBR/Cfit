export interface Student {
    id: string;

    name: string;
    cpf: string | null;
    phone: string | null;
    identifier: string | null;

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

    active: boolean;

    // ==========================================
    // SITUAÇÃO FINANCEIRA
    // ==========================================

    is_defaulting: boolean;

    financial_status:
    | "regular"
    | "grace_period"
    | "defaulting";

    grace_days_remaining: number | null;

    created_at: string;
    updated_at: string;
}