import { Api } from "@/services/http";


export interface LoginCredentials {
    email: string;
    password: string;
    turnstile_token: string;
}


export interface LoginResponse {
    access: string;
    refresh: string;
}


export interface RefreshResponse {
    access: string;
    refresh?: string;
}


export async function login(
    credentials: LoginCredentials,
): Promise<LoginResponse> {
    const response = await Api.post<LoginResponse>(
        "/auth/login/",
        credentials,
    );

    return response.data;
}


export async function refreshAccessToken(
    refresh: string,
): Promise<RefreshResponse> {
    const response = await Api.post<RefreshResponse>(
        "/auth/refresh/",
        {
            refresh,
        },
    );

    return response.data;
}