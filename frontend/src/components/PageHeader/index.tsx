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
