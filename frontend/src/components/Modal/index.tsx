import type { ReactNode } from "react";

interface ModalProps {
    open: boolean;
    title: string;
    children: ReactNode;
    onClose: () => void;
    maxWidth?: "md" | "lg" | "xl";
}


const maxWidthClasses = {
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-5xl",
};

export default function Modal({
    open,
    title,
    children,
    onClose,
    maxWidth = "xl",
}: ModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050b1c]/70 p-4 backdrop-blur-sm sm:p-6">
            <div
                className={`flex max-h-[90vh] w-full flex-col overflow-hidden rounded-[1.75rem] border border-white/70 bg-white shadow-[0_35px_100px_-35px_rgba(2,6,23,0.7)] ${maxWidthClasses[maxWidth]}`}
            >
                <div className="relative flex shrink-0 items-center justify-between overflow-hidden border-b border-slate-200/80 px-6 py-5 sm:px-8">
                    <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-600 via-cyan-400 to-transparent" />

                    <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-600">
                            Ambiente Cfit
                        </p>

                        <h2 className="mt-1 text-xl font-black tracking-[-0.025em] text-slate-950 sm:text-2xl">
                            {title}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                        aria-label="Fechar"
                    >
                        ×
                    </button>
                </div>

                <div className="overflow-y-auto px-6 py-6 sm:px-8">
                    {children}
                </div>
            </div>
        </div>
    );
}
