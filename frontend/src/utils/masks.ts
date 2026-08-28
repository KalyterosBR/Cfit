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
    const digits = value.replace(/\D/g, "").slice(0, 11);

    if (digits.length <= 10) {
        return digits
            .replace(/^(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{4})(\d)/, "$1-$2");
    }

    return digits
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
}

export function isValidCpf(value: string) {
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

    const calculateDigit = (length: number) => {
        const total = digits.slice(0, length).split("").reduce(
            (sum, digit, index) => sum + Number(digit) * (length + 1 - index),
            0,
        );
        const remainder = (total * 10) % 11;
        return remainder === 10 ? 0 : remainder;
    };

    return calculateDigit(9) === Number(digits[9]) && calculateDigit(10) === Number(digits[10]);
}

export function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function normalizeEmail(value: string) {
    return value.trim().toLowerCase();
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

export function currencyMask(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 12);
    const cents = Number(digits || "0");

    return (cents / 100).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export function currencyToDecimal(value: string) {
    const digits = value.replace(/\D/g, "");
    const cents = Number(digits || "0");

    return (cents / 100).toFixed(2);
}
