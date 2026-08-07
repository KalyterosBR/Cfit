import { BrowserRouter, Route, Routes } from "react-router-dom";

import Login from "@/pages/Login";

import Dashboard from "../pages/Dashboard";
import Plans from "../pages/Plans";

import StudentsListPage from "../features/students/pages/StudentsListPage";

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={<Login />}
                />

                <Route
                    path="/dashboard"
                    element={<Dashboard />}
                />

                <Route
                    path="/students"
                    element={<StudentsListPage />}
                />

                <Route
                    path="/plans"
                    element={<Plans />}
                />
            </Routes>
        </BrowserRouter>
    );
}