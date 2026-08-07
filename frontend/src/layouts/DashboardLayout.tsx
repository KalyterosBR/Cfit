import type { ReactNode } from "react";

import Sidebar from "@/components/layout/Sidebar";

type DashboardLayoutProps = {
    children: ReactNode;
};

export default function DashboardLayout({
    children,
}: DashboardLayoutProps) {
    return (
        <div className="flex min-h-screen bg-slate-100">
            <Sidebar />

            <main className="flex-1 p-8">
                {children}
            </main>
        </div>
    );
}