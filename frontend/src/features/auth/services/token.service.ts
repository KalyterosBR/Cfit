const ACCESS_TOKEN_KEY = "cfit_access_token";
const REFRESH_TOKEN_KEY = "cfit_refresh_token";


export function saveTokens(
    access: string,
    refresh: string,
) {
    localStorage.setItem(
        ACCESS_TOKEN_KEY,
        access,
    );

    localStorage.setItem(
        REFRESH_TOKEN_KEY,
        refresh,
    );
}


export function saveAccessToken(
    access: string,
) {
    localStorage.setItem(
        ACCESS_TOKEN_KEY,
        access,
    );
}


export function getAccessToken() {
    return localStorage.getItem(
        ACCESS_TOKEN_KEY,
    );
}


export function getRefreshToken() {
    return localStorage.getItem(
        REFRESH_TOKEN_KEY,
    );
}


export function clearTokens() {
    localStorage.removeItem(
        ACCESS_TOKEN_KEY,
    );

    localStorage.removeItem(
        REFRESH_TOKEN_KEY,
    );
}