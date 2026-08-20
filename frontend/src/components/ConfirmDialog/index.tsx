import type { ReactNode } from "react";

import Modal from "../Modal";
import Button from "../Button";

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    description: string;
    loading?: boolean;
    confirmDisabled?: boolean;
    children?: ReactNode;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({
    open,
    title,
    description,
    loading = false,
    confirmDisabled = false,
    children,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    return (
        <Modal
            open={open}
            title={title}
            onClose={onCancel}
        >
            <p className="text-slate-600">
                {description}
            </p>

            {children}

            <div className="flex justify-end gap-3 mt-8">
                <Button
                    variant="secondary"
                    onClick={onCancel}
                    disabled={loading}
                >
                    Cancelar
                </Button>

                <Button
                    loading={loading}
                    disabled={confirmDisabled}
                    onClick={onConfirm}
                >
                    Confirmar
                </Button>
            </div>
        </Modal>
    );
}
