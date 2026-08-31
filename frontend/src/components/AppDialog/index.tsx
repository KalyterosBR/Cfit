/* eslint-disable react-refresh/only-export-components */
import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
    type FormEvent,
    type ReactNode,
} from "react";
import { AlertTriangle } from "lucide-react";

import Button from "../Button";
import Modal from "../Modal";

type InputType = "text" | "email" | "password" | "date" | "datetime-local" | "tel";

type DialogOptions = {
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: "default" | "danger";
};

type PromptOptions = DialogOptions & {
    label: string;
    initialValue?: string;
    placeholder?: string;
    inputType?: InputType;
    required?: boolean;
    minLength?: number;
};

type DialogRequest =
    | ({ kind: "confirm" } & DialogOptions & { resolve: (value: boolean) => void })
    | ({ kind: "prompt" } & PromptOptions & { resolve: (value: string | null) => void });

type AppDialogContextValue = {
    confirm: (options: DialogOptions) => Promise<boolean>;
    prompt: (options: PromptOptions) => Promise<string | null>;
};

const AppDialogContext = createContext<AppDialogContextValue | null>(null);

export function AppDialogProvider({ children }: { children: ReactNode }) {
    const [request, setRequest] = useState<DialogRequest | null>(null);
    const [value, setValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const requestRef = useRef<DialogRequest | null>(null);

    const close = useCallback((result: boolean | string | null) => {
        const current = requestRef.current;
        requestRef.current = null;
        setRequest(null);
        setValue("");
        if (current?.kind === "confirm") current.resolve(Boolean(result));
        if (current?.kind === "prompt") current.resolve(typeof result === "string" ? result : null);
    }, []);

    const confirm = useCallback((options: DialogOptions) => new Promise<boolean>((resolve) => {
        const nextRequest: DialogRequest = { kind: "confirm", ...options, resolve };
        requestRef.current = nextRequest;
        setRequest(nextRequest);
    }), []);

    const prompt = useCallback((options: PromptOptions) => new Promise<string | null>((resolve) => {
        setValue(options.initialValue ?? "");
        const nextRequest: DialogRequest = { kind: "prompt", required: true, ...options, resolve };
        requestRef.current = nextRequest;
        setRequest(nextRequest);
        window.setTimeout(() => inputRef.current?.focus(), 0);
    }), []);

    const contextValue = useMemo(() => ({ confirm, prompt }), [confirm, prompt]);
    const promptRequest = request?.kind === "prompt" ? request : null;
    const valueIsValid = !promptRequest || (
        (!promptRequest.required || Boolean(value.trim())) &&
        (!promptRequest.minLength || value.length >= promptRequest.minLength)
    );

    function submit(event: FormEvent) {
        event.preventDefault();
        if (!request || !valueIsValid) return;
        close(request.kind === "confirm" ? true : value.trim());
    }

    return (
        <AppDialogContext.Provider value={contextValue}>
            {children}

            <Modal
                open={Boolean(request)}
                title={request?.title ?? "Confirmação"}
                onClose={() => close(request?.kind === "confirm" ? false : null)}
                maxWidth="md"
            >
                {request && (
                    <form onSubmit={submit} className="space-y-6">
                        <div className="flex gap-3">
                            <span
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                    request.tone === "danger"
                                        ? "bg-red-50 text-red-600"
                                        : "bg-blue-50 text-blue-600"
                                }`}
                            >
                                <AlertTriangle size={19} />
                            </span>
                            <p className="pt-1 text-sm leading-6 text-[var(--cfit-text-secondary)]">
                                {request.description}
                            </p>
                        </div>

                        {promptRequest && (
                            <label className="block text-sm font-bold text-[var(--cfit-text-primary)]">
                                {promptRequest.label}
                                <input
                                    ref={inputRef}
                                    type={promptRequest.inputType ?? "text"}
                                    value={value}
                                    minLength={promptRequest.minLength}
                                    required={promptRequest.required}
                                    placeholder={promptRequest.placeholder}
                                    onChange={(event) => setValue(event.target.value)}
                                    className="mt-2 h-11 w-full rounded-xl border border-[var(--cfit-border)] bg-[var(--cfit-surface-elevated)] px-3 text-sm text-[var(--cfit-text-primary)] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                                />
                                {promptRequest.minLength && value.length > 0 && value.length < promptRequest.minLength && (
                                    <span className="mt-2 block text-xs font-semibold text-red-600">
                                        Informe ao menos {promptRequest.minLength} caracteres.
                                    </span>
                                )}
                            </label>
                        )}

                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <Button type="button" variant="secondary" onClick={() => close(request.kind === "confirm" ? false : null)}>
                                {request.cancelLabel ?? "Cancelar"}
                            </Button>
                            <Button type="submit" disabled={!valueIsValid}>
                                {request.confirmLabel ?? "Confirmar"}
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>
        </AppDialogContext.Provider>
    );
}

export function useAppDialog() {
    const context = useContext(AppDialogContext);
    if (!context) throw new Error("useAppDialog deve ser usado dentro de AppDialogProvider.");
    return context;
}
