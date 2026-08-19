import {
    useState,
    type ReactNode,
} from "react";

import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

type DashboardLayoutProps = {
    children: ReactNode;
};

export default function DashboardLayout({
    children,
}: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] =
        useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-[#f4f7fb]">
            <Sidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
                <Topbar
                    onOpenSidebar={() => setSidebarOpen(true)}
                />

                <main className="relative min-h-0 flex-1 overflow-y-auto">
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        <div className="absolute -right-56 -top-56 h-[32rem] w-[32rem] rounded-full bg-cyan-400/[0.06] blur-[120px]" />
                        <div className="absolute -left-48 top-1/3 h-96 w-96 rounded-full bg-blue-500/[0.05] blur-[120px]" />
                    </div>

                    <div className="relative mx-auto w-full max-w-[1600px] p-5 sm:p-6 lg:p-8 xl:p-10">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
