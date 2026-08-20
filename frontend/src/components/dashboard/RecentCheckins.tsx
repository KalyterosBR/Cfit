import {
    CheckCircle2,
    Clock,
} from "lucide-react";
import { Link } from "react-router-dom";

import type { CheckIn } from "@/features/students/services/checkin.service";


type RecentCheckinsProps = {
    checkins: CheckIn[];
    loading: boolean;
    error: boolean;
    onRetry: () => void;
};


function formatCheckInTime(value: string) {
    return new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

export default function RecentCheckins({
    checkins,
    loading,
    error,
    onRetry,
}: RecentCheckinsProps) {
    return (
        <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.28)] sm:p-6">
            <div className="mb-5">
                <h2 className="text-base font-bold text-slate-950">
                    Check-ins recentes
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                    Últimos acessos registrados na academia
                </p>
            </div>

            {loading ? (
                <div className="space-y-3" aria-label="Carregando check-ins recentes">
                    {[1, 2, 3].map((item) => (
                        <div key={item} className="h-14 animate-pulse rounded-xl bg-slate-100" />
                    ))}
                </div>
            ) : error ? (
                <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                    <p>Não foi possível carregar os check-ins.</p>
                    <button
                        type="button"
                        onClick={onRetry}
                        className="mt-2 font-semibold underline underline-offset-4"
                    >
                        Tentar novamente
                    </button>
                </div>
            ) : checkins.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                    Nenhum check-in foi registrado até o momento.
                </div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {checkins.map((checkin) => (
                        <Link
                            key={checkin.id}
                            to={`/students/${checkin.student}`}
                            className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                    <CheckCircle2 size={20} />
                                </div>

                                <div>
                                    <p className="font-semibold text-slate-900">
                                        {checkin.student_name}
                                    </p>

                                    <p className="text-sm text-emerald-600">
                                        {checkin.source_label}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                <Clock size={15} />
                                {formatCheckInTime(checkin.checked_in_at)}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
