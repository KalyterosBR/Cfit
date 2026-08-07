import type { CardProps } from "./types";
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
