import type { PageHeaderProps } from "./types";
import { pageHeaderStyles } from "./styles";

export default function PageHeader({
    title,
    subtitle,
    actions,
}: PageHeaderProps) {
    return (
        <div className={pageHeaderStyles.container}>
            <div>
                <div className="mb-3 flex items-center gap-2.5">
                    <span className="h-px w-7 bg-gradient-to-r from-blue-600 to-cyan-400" />

                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-600">
                        Ambiente Cfit
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

            {actions}
        </div>
    );
}
