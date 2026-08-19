import { Navigate, Outlet } from "react-router-dom";

import { getAccessToken } from "../services/token.service";


export default function ProtectedRoute() {
    const accessToken = getAccessToken();


    if (!accessToken) {
        return (
            <Navigate
                to="/"
                replace
            />
        );
    }

    return <Outlet />;
}