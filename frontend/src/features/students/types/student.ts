export interface Student {
    id: string;
    name: string;
    cpf: string | null;
    phone: string | null;
    identifier: string | null;
    active: boolean;
    created_at: string;
    updated_at: string;
}