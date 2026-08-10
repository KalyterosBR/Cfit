#!/bin/bash

set -e

BASE="frontend/src/components"

# SearchInput
mkdir -p "$BASE/SearchInput"

cat > "$BASE/SearchInput/types.ts" << 'EOF'
import { InputHTMLAttributes } from "react";

export interface SearchInputProps
    extends InputHTMLAttributes<HTMLInputElement> {}
EOF

cat > "$BASE/SearchInput/styles.ts" << 'EOF'
export const searchInputStyles = `
w-full
max-w-sm
rounded-xl
border
border-slate-300
px-4
py-3
outline-none
transition
focus:ring-2
focus:ring-blue-500
`;
EOF

cat > "$BASE/SearchInput/index.tsx" << 'EOF'
import { SearchInputProps } from "./types";
import { searchInputStyles } from "./styles";

export default function SearchInput({
    className = "",
    ...props
}: SearchInputProps) {
    return (
        <input
            {...props}
            placeholder="Pesquisar..."
            className={`
                ${searchInputStyles}
                ${className}
            `}
        />
    );
}
EOF

# Card
mkdir -p "$BASE/Card"

cat > "$BASE/Card/types.ts" << 'EOF'
import { HTMLAttributes, ReactNode } from "react";

export interface CardProps
    extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}
EOF

cat > "$BASE/Card/styles.ts" << 'EOF'
export const cardStyles = `
bg-white
rounded-2xl
shadow
p-8
`;
EOF

cat > "$BASE/Card/index.tsx" << 'EOF'
import { CardProps } from "./types";
import { cardStyles } from "./styles";

export default function Card({
    children,
    className = "",
    ...props
}: CardProps) {
    return (
        <div
            {...props}
            className={`
                ${cardStyles}
                ${className}
            `}
        >
            {children}
        </div>
    );
}
EOF

# PageHeader
mkdir -p "$BASE/PageHeader"

cat > "$BASE/PageHeader/types.ts" << 'EOF'
import { ReactNode } from "react";

export interface PageHeaderProps {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
}
EOF

cat > "$BASE/PageHeader/styles.ts" << 'EOF'
export const pageHeaderStyles = {
    container:
        "flex items-center justify-between mb-8",

    title:
        "text-3xl font-bold",

    subtitle:
        "text-slate-500 mt-1",
};
EOF

cat > "$BASE/PageHeader/index.tsx" << 'EOF'
import { PageHeaderProps } from "./types";
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
EOF

echo ""
echo "✅ Componentes criados com sucesso!"
echo ""
echo "SearchInput"
echo "Card"
echo "PageHeader"