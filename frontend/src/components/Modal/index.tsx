import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";

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
    const [mounted, setMounted] = useState(open);

    useEffect(() => {
        if (open) {
            setMounted(true);
            return;
        }

        const closeTimer = window.setTimeout(() => setMounted(false), 180);
        return () => window.clearTimeout(closeTimer);
    }, [open]);

    if (!mounted) return null;

    return (
        <div data-closing={!open} className="cfit-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-[var(--cfit-overlay)] p-3 backdrop-blur-sm sm:p-6">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="cfit-modal-title"
                className={`cfit-modal cfit-floating-panel flex max-h-[calc(100dvh-1.5rem)] w-full flex-col overflow-hidden rounded-[var(--cfit-radius-modal)] border border-slate-200/80 bg-white shadow-[var(--cfit-shadow-elevated)] sm:max-h-[90vh] ${maxWidthClasses[maxWidth]}`}
            >
                <div className="relative flex shrink-0 items-center justify-between overflow-hidden border-b border-slate-200/80 bg-white px-5 py-4 sm:px-8">
                    <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-600 via-cyan-400 to-transparent" />

                    <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-600">
                            Ambiente Cfit
                        </p>

                        <h2 id="cfit-modal-title" className="mt-1 text-xl font-black tracking-[-0.025em] text-slate-950 sm:text-2xl">
                            {title}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        title="Fechar"
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-slate-500 transition hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                        aria-label="Fechar"
                    >
                        <X size={19} />
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-8 sm:py-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
