import axios, {
    type AxiosError,
    type InternalAxiosRequestConfig,
} from "axios";

import api from "../api";

import {
    clearTokens,
    getAccessToken,
    getRefreshToken,
    saveTokens,
} from "@/features/auth/services/token.service";


interface RetryRequestConfig
    extends InternalAxiosRequestConfig {
    _retry?: boolean;
}


interface RefreshResponse {
    access: string;
    refresh?: string;
}


api.interceptors.request.use(
    (config) => {
        const accessToken = getAccessToken();

        if (accessToken) {
            config.headers.Authorization =
                `Bearer ${accessToken}`;
        }

        return config;
    },
);


api.interceptors.response.use(
    (response) => response,

    async (
        error: AxiosError,
    ) => {
        const originalRequest =
            error.config as RetryRequestConfig | undefined;

        if (!originalRequest) {
            return Promise.reject(error);
        }

        const status = error.response?.status;

        const isAuthRequest =
            originalRequest.url?.includes(
                "/auth/login/",
            ) ||
            originalRequest.url?.includes(
                "/auth/refresh/",
            );

        // ======================================
        // NÃO TENTAR REFRESH EM LOGIN / REFRESH
        // ======================================

        if (isAuthRequest) {
            return Promise.reject(error);
        }

        // ======================================
        // ERRO DIFERENTE DE 401
        // ======================================

        if (status !== 401) {
            return Promise.reject(error);
        }

        // ======================================
        // EVITAR LOOP INFINITO
        // ======================================

        if (originalRequest._retry) {
            clearTokens();

            window.location.href = "/";

            return Promise.reject(error);
        }

        originalRequest._retry = true;

        // ======================================
        // PEGAR REFRESH TOKEN
        // ======================================

        const refreshToken = getRefreshToken();

        if (!refreshToken) {
            clearTokens();

            window.location.href = "/";

            return Promise.reject(error);
        }

        try {
            // ==================================
            // RENOVAR ACCESS TOKEN
            //
            // Usamos axios diretamente aqui,
            // sem os interceptors da instância
            // principal, para evitar loops.
            // ==================================

            const response =
                await axios.post<RefreshResponse>(
                    `${api.defaults.baseURL}/auth/refresh/`,
                    {
                        refresh: refreshToken,
                    },
                    {
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                    },
                );

            const newAccess =
                response.data.access;

            const newRefresh =
                response.data.refresh ??
                refreshToken;

            // ==================================
            // SALVAR TOKENS ATUALIZADOS
            // ==================================

            saveTokens(
                newAccess,
                newRefresh,
            );

            // ==================================
            // REPETIR REQUISIÇÃO ORIGINAL
            // ==================================

            originalRequest.headers.Authorization =
                `Bearer ${newAccess}`;

            return api(originalRequest);
        } catch (refreshError) {
            // ==================================
            // REFRESH EXPIRADO / INVÁLIDO
            // ==================================

            clearTokens();

            window.location.href = "/";

            return Promise.reject(
                refreshError,
            );
        }
    },
);