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
import ComingSoon from "../pages/ComingSoon";

import {
    BarChart3,
    Calendar,
    Dumbbell,
    Settings,
} from "lucide-react";

import StudentsListPage from "../features/students/pages/StudentsListPage";
import StudentDetailsPage from "../features/students/pages/StudentDetailsPage";


const routeTitles: Record<string, string> = {
    "/": "Início",
    "/dashboard": "Dashboard",
    "/students": "Alunos",
    "/plans": "Planos",
    "/finance": "Financeiro",
    "/workouts": "Treinos",
    "/schedule": "Agenda",
    "/reports": "Relatórios",
    "/settings": "Configurações",
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
                        path="/workouts"
                        element={(
                            <ComingSoon
                                title="Treinos"
                                description="Gestão de treinos, exercícios e evolução dos alunos."
                                icon={Dumbbell}
                            />
                        )}
                    />

                    <Route
                        path="/schedule"
                        element={(
                            <ComingSoon
                                title="Agenda"
                                description="Agenda unificada de aulas, avaliações, tarefas e profissionais."
                                icon={Calendar}
                            />
                        )}
                    />

                    <Route
                        path="/reports"
                        element={(
                            <ComingSoon
                                title="Relatórios"
                                description="Análises gerenciais exploráveis e orientadas a decisões."
                                icon={BarChart3}
                            />
                        )}
                    />

                    <Route
                        path="/settings"
                        element={(
                            <ComingSoon
                                title="Configurações"
                                description="Parâmetros da academia, usuários, integrações e segurança."
                                icon={Settings}
                            />
                        )}
                    />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
