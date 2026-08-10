import {
    Bell,
    ChevronDown,
    Search,
} from "lucide-react";

export default function Topbar() {
    return (
        <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8">
            <div className="relative w-full max-w-md">
                <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                    type="text"
                    placeholder="Buscar no Cfit..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
            </div>

            <div className="flex items-center gap-4">
                <button
                    type="button"
                    className="relative flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100"
                >
                    <Bell size={20} />

                    <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-blue-600" />
                </button>

                <div className="h-8 w-px bg-slate-200" />

                <button
                    type="button"
                    className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-100"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
                        JM
                    </div>

                    <div className="text-left">
                        <p className="text-sm font-semibold text-slate-900">
                            Administrador
                        </p>

                        <p className="text-xs text-slate-500">
                            Cfit
                        </p>
                    </div>

                    <ChevronDown
                        size={16}
                        className="text-slate-400"
                    />
                </button>
            </div>
        </header>
    );
}