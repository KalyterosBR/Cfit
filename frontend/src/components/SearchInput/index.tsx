import type { SearchInputProps } from "./types";
import { searchInputStyles } from "./styles";

export default function SearchInput({
    className = "",
    ...props
}: SearchInputProps) {
    return (
        <input
            placeholder="Pesquisar..."
            {...props}
            className={`
                ${searchInputStyles}
                ${className}
            `}
        />
    );
}
