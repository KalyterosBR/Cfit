import type { InputProps } from "./types";
import { inputStyles } from "./styles";

export default function Input({
    label,
    error,
    helperText,
    className = "",
    ...props
}: InputProps) {
    return (
        <div>

            {label && (
                <label className={inputStyles.label}>
                    {label}
                </label>
            )}

            <input
                {...props}
                className={`
                    ${inputStyles.input}
                    ${error ? inputStyles.error : ""}
                    ${className}
                `}
            />

            {error ? (
                <p className={inputStyles.errorText}>
                    {error}
                </p>
            ) : helperText ? (
                <p className={inputStyles.helper}>
                    {helperText}
                </p>
            ) : null}

        </div>
    );
}