import type { ReactNode } from "react";

type StatCardProps = {
    title: string;
    value: string;
    icon: ReactNode;
    description?: string;
};

export default function StatCard({
    title,
    value,
    icon,
    description,
}: StatCardProps) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-slate-500">
                        {title}
                    </p>

                    <h2 className="mt-2 text-3xl font-bold text-slate-900">
                        {value}
                    </h2>

                    {description && (
                        <p className="mt-2 text-sm text-slate-500">
                            {description}
                        </p>
                    )}
                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                    {icon}
                </div>
            </div>
        </div>
    );
}