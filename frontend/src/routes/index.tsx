import { BrowserRouter, Route, Routes } from "react-router-dom";

import ProtectedRoute from "@/features/auth/components/ProtectedRoute";

import Login from "@/pages/Login";

import Dashboard from "../pages/Dashboard";
import Plans from "../pages/Plans";

import StudentsListPage from "../features/students/pages/StudentsListPage";
import StudentDetailsPage from "../features/students/pages/StudentDetailsPage";


export default function AppRoutes() {
    return (
        <BrowserRouter>
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
                </Route>
            </Routes>
        </BrowserRouter>
    );
}