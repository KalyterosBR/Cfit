const ACCESS_TOKEN_KEY = "cfit_access_token";
const REFRESH_TOKEN_KEY = "cfit_refresh_token";
const KEEP_CONNECTED_KEY = "cfit_keep_connected";


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
        localStorage.getItem(KEEP_CONNECTED_KEY) === "true" &&
        (
            localStorage.getItem(REFRESH_TOKEN_KEY) ||
            localStorage.getItem(ACCESS_TOKEN_KEY)
        )
    ) {
        return localStorage;
    }

    if (
        sessionStorage.getItem(
            REFRESH_TOKEN_KEY,
        )
    ) {
        return sessionStorage;
    }

    if (localStorage.getItem(REFRESH_TOKEN_KEY)) {
        return localStorage;
    }

    if (sessionStorage.getItem(ACCESS_TOKEN_KEY)) {
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

    if (keepConnected === true) {
        localStorage.setItem(KEEP_CONNECTED_KEY, "true");
    } else if (keepConnected === false) {
        localStorage.removeItem(KEEP_CONNECTED_KEY);
    }

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
    const storage = getCurrentStorage();
    const fallback = storage === localStorage ? sessionStorage : localStorage;
    return storage.getItem(ACCESS_TOKEN_KEY) ?? fallback.getItem(ACCESS_TOKEN_KEY);
}


export function getRefreshToken() {
    const storage = getCurrentStorage();
    const fallback = storage === localStorage ? sessionStorage : localStorage;
    return storage.getItem(REFRESH_TOKEN_KEY) ?? fallback.getItem(REFRESH_TOKEN_KEY);
}


export function clearTokens() {
    clearStorage(localStorage);
    clearStorage(sessionStorage);
    localStorage.removeItem(KEEP_CONNECTED_KEY);
}
