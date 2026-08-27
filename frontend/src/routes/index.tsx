import { lazy, Suspense, useEffect } from "react";

import {
    BrowserRouter,
    Route,
    Routes,
    useLocation,
} from "react-router-dom";

import ProtectedRoute from "@/features/auth/components/ProtectedRoute";
import CapabilityRoute from "@/features/auth/components/CapabilityRoute";
import { routeAccess } from "@/features/auth/access-control";
import { ChangePassword, ForgotPassword, ResetPassword } from "../pages/PasswordAccess";
import { LoginRouteFallback, PublicRouteFallback } from "@/components/AsyncState";
import { applySeo } from "@/services/seo";

const Home = lazy(() => import("@/pages/Home"));
const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Financial = lazy(() => import("../pages/Financial"));
const Plans = lazy(() => import("../pages/Plans"));
const CheckIns = lazy(() => import("../pages/CheckIns"));
const Workouts = lazy(() => import("../pages/Workouts"));
const Schedule = lazy(() => import("../pages/Schedule"));
const Reports = lazy(() => import("../pages/Reports"));
const SettingsPage = lazy(() => import("../pages/Settings"));
const Automations = lazy(() => import("../pages/Automations"));
const Units = lazy(() => import("../pages/Units"));
const Operations = lazy(() => import("../pages/Operations"));
const Growth = lazy(() => import("../pages/Growth"));
const Relationship = lazy(() => import("../pages/Relationship"));
const Portal = lazy(() => import("../pages/Portal"));
const Documents = lazy(() => import("../pages/Documents"));
const Onboarding = lazy(() => import("../pages/Onboarding"));
const StudentsListPage = lazy(() => import("../features/students/pages/StudentsListPage"));
const StudentDetailsPage = lazy(() => import("../features/students/pages/StudentDetailsPage"));


const routeTitles: Record<string, string> = {
    "/": "Início",
    "/login": "Entrar",
    "/forgot-password": "Recuperar senha",
    "/reset-password": "Redefinir senha",
    "/dashboard": "Dashboard",
    "/students": "Alunos",
    "/plans": "Planos",
    "/finance": "Financeiro",
    "/checkins": "Check-ins",
    "/workouts": "Treinos",
    "/schedule": "Agenda",
    "/reports": "Relatórios",
    "/settings": "Configurações",
    "/automations": "Automações",
    "/units": "Academia e unidades",
    "/operations": "Central operacional",
    "/growth": "Comercial e turmas",
    "/relationship": "Relacionamento",
    "/portal": "Portal do aluno",
    "/documents": "Documentos e portal",
    "/change-password": "Alterar senha",
    "/onboarding": "Configuração inicial",
};


function DocumentTitle() {
    const location = useLocation();

    const title = location.pathname.startsWith("/students/")
        ? "Detalhes do aluno"
        : routeTitles[location.pathname] ?? "Cfit";

    useEffect(() => {
        applySeo(location.pathname, title);
    }, [location.pathname, title]);

    return null;
}


export default function AppRoutes() {
    return (
        <BrowserRouter>
            <DocumentTitle />

            <Routes>
                {/* ROTA PÚBLICA */}
                <Route
                    path="/"
                    element={<Suspense fallback={<PublicRouteFallback />}><Home /></Suspense>}
                />
                <Route path="/login" element={<Suspense fallback={<LoginRouteFallback />}><Login /></Suspense>} />
                <Route path="/forgot-password" element={<Suspense fallback={<LoginRouteFallback />}><ForgotPassword /></Suspense>} />
                <Route path="/reset-password" element={<Suspense fallback={<LoginRouteFallback />}><ResetPassword /></Suspense>} />

                {/* ROTAS PROTEGIDAS */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/change-password" element={<ChangePassword />} />
                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route
                        path="/dashboard"
                        element={<Dashboard />}
                    />

                    <Route
                        path="/students"
                        element={<CapabilityRoute requirement={routeAccess["/students"]}><StudentsListPage /></CapabilityRoute>}
                    />

                    <Route
                        path="/students/:id"
                        element={<CapabilityRoute requirement={routeAccess["/students"]}><StudentDetailsPage /></CapabilityRoute>}
                    />

                    <Route
                        path="/plans"
                        element={<CapabilityRoute requirement={routeAccess["/plans"]}><Plans /></CapabilityRoute>}
                    />

                    <Route
                        path="/finance"
                        element={<CapabilityRoute requirement={routeAccess["/finance"]}><Financial /></CapabilityRoute>}
                    />

                    <Route
                        path="/checkins"
                        element={<CapabilityRoute requirement={routeAccess["/checkins"]}><CheckIns /></CapabilityRoute>}
                    />

                    <Route
                        path="/workouts"
                        element={<CapabilityRoute requirement={routeAccess["/workouts"]}><Workouts /></CapabilityRoute>}
                    />

                    <Route
                        path="/schedule"
                        element={<CapabilityRoute requirement={routeAccess["/schedule"]}><Schedule /></CapabilityRoute>}
                    />

                    <Route
                        path="/reports"
                        element={<CapabilityRoute requirement={routeAccess["/reports"]}><Reports /></CapabilityRoute>}
                    />

                    <Route
                        path="/settings"
                        element={<CapabilityRoute requirement={routeAccess["/settings"]}><SettingsPage /></CapabilityRoute>}
                    />
                    <Route path="/automations" element={<CapabilityRoute requirement={routeAccess["/automations"]}><Automations /></CapabilityRoute>} />
                    <Route path="/units" element={<CapabilityRoute requirement={routeAccess["/units"]}><Units /></CapabilityRoute>} />
                    <Route path="/operations" element={<CapabilityRoute requirement={routeAccess["/operations"]}><Operations /></CapabilityRoute>} />
                    <Route path="/growth" element={<CapabilityRoute requirement={routeAccess["/growth"]}><Growth /></CapabilityRoute>} />
                    <Route path="/relationship" element={<CapabilityRoute requirement={routeAccess["/relationship"]}><Relationship /></CapabilityRoute>} />
                    <Route path="/portal" element={<CapabilityRoute requirement={routeAccess["/portal"]}><Portal /></CapabilityRoute>} />
                    <Route path="/documents" element={<CapabilityRoute requirement={routeAccess["/documents"]}><Documents /></CapabilityRoute>} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
