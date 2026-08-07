import type { ReactNode } from "react";

type DashboardHeaderProps = {
    title: string;
    subtitle?: string;
    children?: ReactNode;
};

export default function DashboardHeader({
    title,
    subtitle,
    children,
}: DashboardHeaderProps) {
    return (
        <div className="mb-8 flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">
                    {title}
                </h1>

                {subtitle && (
                    <p className="mt-1 text-slate-500">
                        {subtitle}
                    </p>
                )}
            </div>

            {children && (
                <div className="flex items-center gap-3">
                    {children}
                </div>
            )}
        </div>
    );
}