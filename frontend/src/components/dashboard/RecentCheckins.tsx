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
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
                <h2 className="text-lg font-bold text-slate-900">
                    Check-ins recentes
                </h2>

                <p className="text-sm text-slate-500">
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