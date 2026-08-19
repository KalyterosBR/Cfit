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
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <div className="mb-3 flex items-center gap-2.5">
                    <span className="h-px w-7 bg-gradient-to-r from-blue-600 to-cyan-400" />

                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-600">
                        Performance da operação
                    </span>
                </div>

                <h1 className="text-[1.75rem] font-black tracking-[-0.04em] text-slate-950 sm:text-[2rem]">
                    {title}
                </h1>

                {subtitle && (
                    <p className="mt-1.5 text-sm leading-6 text-slate-500">
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
