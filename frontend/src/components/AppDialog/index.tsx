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
import { AlertTriangle, CircleHelp, X } from "lucide-react";

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

            {request && (
                <div className="cfit-modal-overlay fixed inset-0 z-[70] flex items-center justify-center bg-[var(--cfit-overlay)] p-3 backdrop-blur-md sm:p-6">
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="cfit-action-dialog-title"
                        data-tone={request.tone ?? "default"}
                        className="cfit-action-dialog cfit-floating-panel relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-[1.65rem] border sm:max-h-[90vh]"
                    >
                        <div className="cfit-action-dialog-accent absolute inset-x-0 top-0 h-[3px]" />

                        <header className="cfit-action-dialog-header flex items-start justify-between gap-4 border-b px-5 pb-5 pt-6 sm:px-7 sm:pb-6 sm:pt-7">
                            <div className="flex min-w-0 items-start gap-4">
                                <span className="cfit-action-dialog-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.9rem] border">
                                    {request.tone === "danger" ? <AlertTriangle size={21} /> : <CircleHelp size={21} />}
                                </span>

                                <div className="min-w-0">
                                    <p className="cfit-action-dialog-eyebrow text-[9px] font-black uppercase tracking-[0.22em]">
                                        Confirmação segura
                                    </p>
                                    <h2 id="cfit-action-dialog-title" className="mt-1.5 break-words text-xl font-black tracking-[-0.025em] sm:text-2xl">
                                        {request.title}
                                    </h2>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => close(request.kind === "confirm" ? false : null)}
                                className="cfit-action-dialog-close flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition"
                                aria-label="Fechar diálogo"
                                title="Fechar"
                            >
                                <X size={18} />
                            </button>
                        </header>

                        <form onSubmit={submit} className="min-h-0 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7 sm:py-6">
                            {request.description && (
                                <div className="cfit-action-dialog-message rounded-2xl border px-4 py-3.5">
                                    <p className="text-sm font-medium leading-6">
                                        {request.description}
                                    </p>
                                </div>
                            )}

                            {promptRequest && (
                                <label className="mt-5 block text-sm font-extrabold">
                                    {promptRequest.label}
                                    <input
                                        ref={inputRef}
                                        type={promptRequest.inputType ?? "text"}
                                        value={value}
                                        minLength={promptRequest.minLength}
                                        required={promptRequest.required}
                                        placeholder={promptRequest.placeholder}
                                        onChange={(event) => setValue(event.target.value)}
                                        className="cfit-action-dialog-input mt-2.5 h-12 w-full rounded-xl border px-3.5 text-sm font-medium outline-none transition"
                                    />
                                    {promptRequest.minLength && value.length > 0 && value.length < promptRequest.minLength && (
                                        <span className="mt-2 block text-xs font-bold text-[var(--cfit-danger)]">
                                            Informe ao menos {promptRequest.minLength} caracteres.
                                        </span>
                                    )}
                                </label>
                            )}

                            <div className="mt-7 grid gap-3 sm:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={() => close(request.kind === "confirm" ? false : null)}
                                    className="cfit-action-dialog-cancel order-2 flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-extrabold transition sm:order-1"
                                >
                                    {request.cancelLabel ?? "Cancelar"}
                                </button>
                                <button
                                    type="submit"
                                    disabled={!valueIsValid}
                                    className="cfit-action-dialog-confirm order-1 flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-50 sm:order-2"
                                >
                                    {request.confirmLabel ?? "Confirmar"}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </AppDialogContext.Provider>
    );
}

export function useAppDialog() {
    const context = useContext(AppDialogContext);
    if (!context) throw new Error("useAppDialog deve ser usado dentro de AppDialogProvider.");
    return context;
}
