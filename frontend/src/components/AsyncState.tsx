import { AlertCircle, Ban, Inbox, LoaderCircle, SlidersHorizontal, Wrench } from "lucide-react";
import type { ReactNode } from "react";

type StateFrameProps = { icon: ReactNode; title: string; detail?: string; action?: ReactNode; tone?: "neutral" | "danger" | "warning" };

function StateFrame({ icon, title, detail, action, tone = "neutral" }: StateFrameProps) {
    const toneClass = tone === "danger" ? "border-red-200 text-red-700" : tone === "warning" ? "border-amber-200 text-amber-700" : "border-slate-200 text-slate-600";
    return <div className={`flex min-h-40 flex-col items-center justify-center rounded-2xl border bg-white p-8 text-center text-sm ${toneClass}`} role="status">{icon}<p className="mt-3 font-bold">{title}</p>{detail && <p className="mt-1 max-w-lg text-slate-500">{detail}</p>}{action && <div className="mt-4">{action}</div>}</div>;
}

export function LoadingState({ label = "Carregando dados..." }: { label?: string }) { return <StateFrame icon={<LoaderCircle className="animate-spin text-blue-600" size={22} />} title={label} />; }
export function SkeletonState({ rows = 4 }: { rows?: number }) { return <div className="space-y-3 rounded-2xl border bg-white p-6" aria-label="Carregando dados">{Array.from({ length: rows }, (_, index) => <div key={index} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>; }
export function ErrorState({ onRetry, label = "Não foi possível carregar os dados.", detail = "Verifique a conexão e tente novamente." }: { onRetry?: () => void; label?: string; detail?: string }) { return <StateFrame tone="danger" icon={<AlertCircle size={22}/>} title={label} detail={detail} action={onRetry && <button type="button" onClick={onRetry} className="font-bold underline underline-offset-4">Tentar novamente</button>} />; }
export function EmptyState({ label, detail, action }: { label: string; detail: string; action?: ReactNode }) { return <StateFrame icon={<Inbox className="text-slate-300"/>} title={label} detail={detail} action={action} />; }
export function FilteredEmptyState({ onClear }: { onClear?: () => void }) { return <StateFrame icon={<SlidersHorizontal className="text-slate-400"/>} title="Nenhum resultado para estes filtros" detail="Altere os critérios ou limpe os filtros para ampliar a consulta." action={onClear && <button type="button" onClick={onClear} className="font-bold text-blue-600">Limpar filtros</button>} />; }
export function PermissionState({ detail = "Seu perfil não possui acesso a esta área." }: { detail?: string }) { return <StateFrame tone="warning" icon={<Ban size={22}/>} title="Acesso não permitido" detail={detail} />; }
export function UnavailableState({ detail = "Este módulo está temporariamente indisponível." }: { detail?: string }) { return <StateFrame tone="warning" icon={<Wrench size={22}/>} title="Módulo indisponível" detail={detail} />; }
