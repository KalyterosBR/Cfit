export const inputStyles = {
    input: `
        w-full
        rounded-xl
        border
        border-slate-300
        bg-slate-50/80
        px-4
        py-3
        text-slate-900
        outline-none
        transition
        placeholder:text-slate-500
        hover:border-slate-400
        focus:border-blue-500
        focus:bg-white
        focus:ring-2
        focus:ring-blue-500/20
    `,

    error: `
        border-red-500
        focus:ring-red-500
    `,

    label: `
        block
        mb-2
        text-sm
        font-semibold
        text-slate-700
    `,

    helper: `
        mt-1
        text-sm
        text-slate-500
    `,

    errorText: `
        mt-1
        text-sm
        text-red-600
    `,
};
