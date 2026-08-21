import { useEffect } from "react";

import {
    BrowserRouter,
    Route,
    Routes,
    useLocation,
} from "react-router-dom";

import ProtectedRoute from "@/features/auth/components/ProtectedRoute";

import Login from "@/pages/Login";

import Dashboard from "../pages/Dashboard";
import Financial from "../pages/Financial";
import Plans from "../pages/Plans";
import CheckIns from "../pages/CheckIns";
import Workouts from "../pages/Workouts";
import Schedule from "../pages/Schedule";
import Reports from "../pages/Reports";
import SettingsPage from "../pages/Settings";
import Automations from "../pages/Automations";
import Units from "../pages/Units";


import StudentsListPage from "../features/students/pages/StudentsListPage";
import StudentDetailsPage from "../features/students/pages/StudentDetailsPage";


const routeTitles: Record<string, string> = {
    "/": "Início",
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
};


function DocumentTitle() {
    const location = useLocation();

    const title = location.pathname.startsWith("/students/")
        ? "Detalhes do aluno"
        : routeTitles[location.pathname] ?? "Cfit";

    useEffect(() => {
        document.title = title;
    }, [title]);

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
                    element={<Login />}
                />

                {/* ROTAS PROTEGIDAS */}
                <Route element={<ProtectedRoute />}>
                    <Route
                        path="/dashboard"
                        element={<Dashboard />}
                    />

                    <Route
                        path="/students"
                        element={<StudentsListPage />}
                    />

                    <Route
                        path="/students/:id"
                        element={<StudentDetailsPage />}
                    />

                    <Route
                        path="/plans"
                        element={<Plans />}
                    />

                    <Route
                        path="/finance"
                        element={<Financial />}
                    />

                    <Route
                        path="/checkins"
                        element={<CheckIns />}
                    />

                    <Route
                        path="/workouts"
                        element={<Workouts />}
                    />

                    <Route
                        path="/schedule"
                        element={<Schedule />}
                    />

                    <Route
                        path="/reports"
                        element={<Reports />}
                    />

                    <Route
                        path="/settings"
                        element={<SettingsPage />}
                    />
                    <Route path="/automations" element={<Automations />} />
                    <Route path="/units" element={<Units />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
