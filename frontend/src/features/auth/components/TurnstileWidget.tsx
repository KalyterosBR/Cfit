import {
    useEffect,
    useRef,
} from "react";


declare global {
    interface Window {
        turnstile?: {
            render: (
                element: HTMLElement,
                options: {
                    sitekey: string;
                    theme?: "light" | "dark" | "auto";
                    size?: "normal" | "compact";
                    callback?: (
                        token: string,
                    ) => void;
                    "expired-callback"?: () => void;
                    "error-callback"?: () => void;
                },
            ) => string;

            remove: (
                widgetId: string,
            ) => void;

            reset: (
                widgetId: string,
            ) => void;
        };
    }
}


type TurnstileWidgetProps = {
    onVerify: (
        token: string,
    ) => void;

    onExpire?: () => void;

    resetKey?: number;
};


export default function TurnstileWidget({
    onVerify,
    onExpire,
    resetKey = 0,
}: TurnstileWidgetProps) {
    const containerRef =
        useRef<HTMLDivElement | null>(
            null,
        );

    const widgetIdRef =
        useRef<string | null>(
            null,
        );


    useEffect(() => {
        if (
            widgetIdRef.current &&
            window.turnstile
        ) {
            window.turnstile.reset(
                widgetIdRef.current,
            );
        }
    }, [resetKey]);


    useEffect(() => {
        const siteKey =
            import.meta.env
                .VITE_TURNSTILE_SITE_KEY;


        if (!siteKey) {
            console.error(
                "VITE_TURNSTILE_SITE_KEY não configurada.",
            );

            return;
        }


        const interval =
            window.setInterval(() => {
                if (
                    !window.turnstile ||
                    !containerRef.current ||
                    widgetIdRef.current
                ) {
                    return;
                }


                widgetIdRef.current =
                    window.turnstile.render(
                        containerRef.current,
                        {
                            sitekey:
                                siteKey,

                            theme:
                                "dark",

                            callback: (
                                token,
                            ) => {
                                onVerify(
                                    token,
                                );
                            },

                            "expired-callback":
                                () => {
                                    onExpire?.();
                                },

                            "error-callback":
                                () => {
                                    onExpire?.();
                                },
                        },
                    );


                window.clearInterval(
                    interval,
                );
            }, 100);


        return () => {
            window.clearInterval(
                interval,
            );


            if (
                widgetIdRef.current &&
                window.turnstile
            ) {
                window.turnstile.remove(
                    widgetIdRef.current,
                );

                widgetIdRef.current =
                    null;
            }
        };
    }, [
        onVerify,
        onExpire,
    ]);


    return (
        <div className="flex w-full justify-center overflow-hidden rounded-xl">
            <div
                className="
                    origin-center
                    scale-[0.82]
                    sm:scale-[0.86]
                "
            >
                <div
                    ref={
                        containerRef
                    }
                />
            </div>
        </div>
    );
}
