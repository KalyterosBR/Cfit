import type { InputProps } from "./types";
import { inputStyles } from "./styles";

export default function Input({
    label,
    error,
    helperText,
    className = "",
    ...props
}: InputProps) {
    const requiredLabel =
        typeof label === "string" && label.endsWith(" *");
    const labelText = requiredLabel
        ? label.slice(0, -2)
        : label;

    return (
        <div>

            {label && (
                <label className={inputStyles.label}>
                    {labelText}
                    {requiredLabel && (
                        <span className="ml-1 text-red-500" aria-hidden="true">
                            *
                        </span>
                    )}
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
