import type { SearchInputProps } from "./types";
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
