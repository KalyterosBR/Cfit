import {
    CheckCircle2,
    Clock,
} from "lucide-react";

const checkins = [
    {
        name: "João Pedro",
        time: "08:42",
        status: "Liberado",
    },
    {
        name: "Ana Beatriz",
        time: "08:37",
        status: "Liberado",
    },
    {
        name: "Rafael Martins",
        time: "08:31",
        status: "Liberado",
    },
    {
        name: "Camila Ferreira",
        time: "08:24",
        status: "Liberado",
    },
];

export default function RecentCheckins() {
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

            <div className="divide-y divide-slate-100">
                {checkins.map((checkin) => (
                    <div
                        key={`${checkin.name}-${checkin.time}`}
                        className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <CheckCircle2 size={20} />
                            </div>

                            <div>
                                <p className="font-semibold text-slate-900">
                                    {checkin.name}
                                </p>

                                <p className="text-sm text-emerald-600">
                                    {checkin.status}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                            <Clock size={15} />
                            {checkin.time}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
