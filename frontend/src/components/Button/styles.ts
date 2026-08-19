export const buttonVariants = {
    primary:
        "border-0 bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_12px_28px_-14px_rgba(37,99,235,0.8)] hover:-translate-y-px hover:from-blue-500 hover:to-cyan-400",

    secondary:
        "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-700",

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
