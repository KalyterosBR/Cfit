import type { ReactNode } from "react";

type StatCardProps = {
    title: string;
    value: string;
    icon: ReactNode;
    description?: string;
    tone?: "blue" | "cyan" | "emerald" | "violet";
};


const toneStyles = {
    blue: {
        icon: "bg-blue-50 text-blue-600",
        line: "from-blue-600 to-blue-400",
    },
    cyan: {
        icon: "bg-cyan-50 text-cyan-600",
        line: "from-cyan-500 to-blue-500",
    },
    emerald: {
        icon: "bg-emerald-50 text-emerald-600",
        line: "from-emerald-500 to-cyan-400",
    },
    violet: {
        icon: "bg-violet-50 text-violet-600",
        line: "from-violet-500 to-blue-500",
    },
};

export default function StatCard({
    title,
    value,
    icon,
    description,
    tone = "blue",
}: StatCardProps) {
    const styles = toneStyles[tone];

    return (
        <div className="group relative overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200/80 hover:shadow-[0_24px_55px_-32px_rgba(37,99,235,0.28)] sm:p-6">
            <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${styles.line}`} />

            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                        {title}
                    </p>

                    <h2 className="mt-3 text-[1.75rem] font-black tracking-[-0.035em] text-slate-950">
                        {value}
                    </h2>

                    {description && (
                        <p className="mt-2 text-xs font-medium text-slate-500">
                            {description}
                        </p>
                    )}
                </div>

                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${styles.icon}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}
