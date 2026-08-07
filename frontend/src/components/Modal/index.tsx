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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl">

                <div className="flex items-center justify-between border-b p-6">
                    <h2 className="text-2xl font-bold">
                        {title}
                    </h2>

                    <button
                        onClick={onClose}
                        className="text-2xl"
                    >
                        ×
                    </button>
                </div>

                <div className="p-6">
                    {children}
                </div>

            </div>
        </div>
    );
}