import type { PageHeaderProps } from "./types";
import { pageHeaderStyles } from "./styles";

export default function PageHeader({
    title,
    subtitle,
    actions,
    eyebrow = "Operação Cfit",
    context = "Dados e ações conectados",
}: PageHeaderProps) {
    return (
        <header className={pageHeaderStyles.container}>
            <div className="relative px-5 py-6 sm:px-6 lg:py-7">
                <div className="pointer-events-none absolute -left-20 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-blue-200/25 blur-[75px]" />
                <div className="relative">
                <div className="mb-3 flex items-center gap-2.5">
                    <span className="h-px w-7 bg-gradient-to-r from-blue-600 to-cyan-400" />

                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-600">
                        {eyebrow}
                    </span>
                </div>

                <h1 className={pageHeaderStyles.title}>
                    {title}
                </h1>

                {subtitle && (
                    <p className={pageHeaderStyles.subtitle}>
                        {subtitle}
                    </p>
                )}
                </div>
            </div>

            <div className="relative flex min-w-[14rem] flex-col justify-center border-t border-blue-200/70 px-5 py-4 lg:border-l lg:border-t-0 lg:px-6">
                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Contexto do módulo
                </span>
                <span className="mt-1 text-xs font-bold text-slate-700">
                    {context}
                </span>
                {actions && <div className="mt-3 flex flex-wrap items-center gap-3">{actions}</div>}
            </div>
        </header>
    );
}
