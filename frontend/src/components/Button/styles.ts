export const buttonVariants = {
    primary:
        "border-0 bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_12px_28px_-14px_rgba(37,99,235,0.8)] hover:-translate-y-px hover:from-blue-500 hover:to-cyan-400",

    secondary:
        "border border-[var(--cfit-border-default)] bg-[var(--cfit-surface-2)] text-[var(--cfit-text-secondary)] shadow-sm hover:border-blue-300 hover:bg-[var(--cfit-surface-hover)] hover:text-blue-700",

    danger:
        "bg-red-600 hover:bg-red-700 text-white",
};

export const baseButtonStyles = `
px-5
py-2.5
rounded-xl
text-sm
font-semibold
transition-all
disabled:opacity-50
disabled:cursor-not-allowed
`;
