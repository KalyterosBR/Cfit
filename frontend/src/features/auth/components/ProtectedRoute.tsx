import { Suspense, useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { Api } from "@/services/http";
import { SessionProvider, type SessionProfile } from "../access-control";
import { getAccessToken } from "../services/token.service";
import { ThemeProvider } from "@/features/theme/ThemeProvider";
import { AppBootSkeleton, ModuleSkeleton } from "@/components/AsyncState";
import DashboardLayout from "@/layouts/DashboardLayout";


export default function ProtectedRoute() {
    const accessToken = getAccessToken();
    const location = useLocation();
    const [profile, setProfile] = useState<SessionProfile | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (!accessToken) return;
        Api.get<SessionProfile>("/users/me/").then(response => setProfile(response.data)).catch(() => setFailed(true));
    }, [accessToken]);


    if (!accessToken || failed) {
        return (
            <Navigate
                to="/"
                replace
            />
        );
    }

    if (!profile) return <ThemeProvider><AppBootSkeleton /></ThemeProvider>;
    if (profile.must_change_password && location.pathname !== "/change-password") return <Navigate to="/change-password" replace />;
    const canConfigureAcademy = profile.capabilities.includes("*") || profile.capabilities.includes("settings.manage");
    if (!profile.onboarding_completed && canConfigureAcademy && location.pathname !== "/onboarding") return <Navigate to="/onboarding" replace />;
    if (profile.onboarding_completed && location.pathname === "/onboarding") return <Navigate to="/dashboard" replace />;
    if (profile.role === "STUDENT" && !["/portal", "/change-password"].includes(location.pathname)) return <Navigate to="/portal" replace />;
    if (profile.role !== "STUDENT" && location.pathname === "/portal") return <Navigate to="/dashboard" replace />;
    const skeletonVariant = location.pathname.startsWith("/students/")
        ? "details"
        : ["/change-password", "/onboarding"].includes(location.pathname)
            ? "form"
            : "module";

    return <SessionProvider profile={profile}><ThemeProvider><Suspense fallback={<DashboardLayout><ModuleSkeleton variant={skeletonVariant} /></DashboardLayout>}><Outlet /></Suspense></ThemeProvider></SessionProvider>;
}
