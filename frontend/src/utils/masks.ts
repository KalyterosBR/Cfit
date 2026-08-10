export function cpfMask(value: string) {
    const digits = value
        .replace(/\D/g, "")
        .slice(0, 11);

    return digits
        .replace(/^(\d{3})(\d)/, "$1.$2")
        .replace(
            /^(\d{3})\.(\d{3})(\d)/,
            "$1.$2.$3",
        )
        .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function phoneMask(value: string) {
    return value
        .replace(/\D/g, "")
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .slice(0, 15);
}

export function cepMask(value: string) {
    const digits = value
        .replace(/\D/g, "")
        .slice(0, 8);

    return digits.replace(
        /^(\d{5})(\d)/,
        "$1-$2",
    );
}