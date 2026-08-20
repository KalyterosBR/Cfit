import axios from "axios";


export type RequestErrorKind =
    | "forbidden"
    | "not_found"
    | "generic";


export function getRequestErrorKind(error: unknown): RequestErrorKind {
    if (!axios.isAxiosError(error)) return "generic";

    if (error.response?.status === 403) return "forbidden";
    if (error.response?.status === 404) return "not_found";

    return "generic";
}
