const ACCESS_TOKEN_KEY = "cfit_access_token";
const REFRESH_TOKEN_KEY = "cfit_refresh_token";


function clearStorage(storage: Storage) {
    storage.removeItem(
        ACCESS_TOKEN_KEY,
    );

    storage.removeItem(
        REFRESH_TOKEN_KEY,
    );
}


function getCurrentStorage() {
    if (
        sessionStorage.getItem(
            REFRESH_TOKEN_KEY,
        ) ||
        sessionStorage.getItem(
            ACCESS_TOKEN_KEY,
        )
    ) {
        return sessionStorage;
    }

    return localStorage;
}


export function saveTokens(
    access: string,
    refresh: string,
    keepConnected?: boolean,
) {
    const storage =
        keepConnected === undefined
            ? getCurrentStorage()
            : keepConnected
                ? localStorage
                : sessionStorage;

    const otherStorage =
        storage === localStorage
            ? sessionStorage
            : localStorage;

    clearStorage(otherStorage);

    storage.setItem(
        ACCESS_TOKEN_KEY,
        access,
    );

    storage.setItem(
        REFRESH_TOKEN_KEY,
        refresh,
    );
}


export function saveAccessToken(
    access: string,
) {
    getCurrentStorage().setItem(
        ACCESS_TOKEN_KEY,
        access,
    );
}


export function getAccessToken() {
    return (
        sessionStorage.getItem(
            ACCESS_TOKEN_KEY,
        ) ??
        localStorage.getItem(
            ACCESS_TOKEN_KEY,
        )
    );
}


export function getRefreshToken() {
    return (
        sessionStorage.getItem(
            REFRESH_TOKEN_KEY,
        ) ??
        localStorage.getItem(
            REFRESH_TOKEN_KEY,
        )
    );
}


export function clearTokens() {
    clearStorage(localStorage);
    clearStorage(sessionStorage);
}
