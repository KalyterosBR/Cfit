import type { ButtonProps } from "./types";
import {
    baseButtonStyles,
    buttonVariants,
} from "./styles";

export default function Button({
    children,
    variant = "primary",
    loading = false,
    className = "",
    disabled,
    ...props
}: ButtonProps) {
    return (
        <button
            {...props}
            disabled={disabled || loading}
            className={`
                ${baseButtonStyles}
                ${buttonVariants[variant]}
                ${className}
            `}
        >
            {loading ? "Carregando..." : children}
        </button>
    );
}