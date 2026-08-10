import type { ReactNode } from "react";

interface ModalProps {
    open: boolean;
    title: string;
    children: ReactNode;
    onClose: () => void;
}

export default function Modal({
    open,
    title,
    children,
    onClose,
}: ModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
            <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
                <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-8 py-5">
                    <h2 className="text-2xl font-bold text-slate-900">
                        {title}
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-2xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                        aria-label="Fechar"
                    >
                        ×
                    </button>
                </div>

                <div className="overflow-y-auto px-8 py-6">
                    {children}
                </div>
            </div>
        </div>
    );
}