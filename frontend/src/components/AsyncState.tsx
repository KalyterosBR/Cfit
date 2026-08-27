import { AlertCircle, Ban, Inbox, LoaderCircle, SlidersHorizontal, Wrench } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

export function SkeletonBlock({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <span aria-hidden="true" className={`cfit-skeleton block rounded-lg ${className}`} style={style} />;
}

export function CardSkeleton({ count = 4 }: { count?: number }) {
    return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">{Array.from({ length: count }, (_, index) => <div key={index} className="min-h-36 rounded-[var(--cfit-radius-card)] border border-slate-200/80 bg-white p-5"><SkeletonBlock className="h-9 w-9 rounded-xl"/><SkeletonBlock className="mt-5 h-3 w-24"/><SkeletonBlock className="mt-3 h-8 w-32 max-w-full"/><SkeletonBlock className="mt-3 h-3 w-4/5"/></div>)}</div>;
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
    return <div className="overflow-hidden rounded-[var(--cfit-radius-card)] border border-slate-200/80 bg-white" aria-hidden="true"><div className="h-12 border-b border-slate-200/80 bg-slate-50 px-5 py-4"><SkeletonBlock className="h-3 w-36 max-w-full"/></div><div>{Array.from({ length: rows }, (_, row) => <div key={row} className="grid min-h-16 items-center gap-3 border-b border-slate-100 px-5 last:border-b-0 sm:gap-5" style={{ gridTemplateColumns: `minmax(0, 1.6fr) repeat(${Math.max(columns - 1, 1)}, minmax(0, 1fr))` }}>{Array.from({ length: columns }, (_, column) => <SkeletonBlock key={column} className={`h-3 ${column === 0 ? "w-4/5" : "w-2/3"}`}/>)}</div>)}</div></div>;
}

export function DetailSkeleton() {
    return <div className="space-y-5" aria-hidden="true"><div className="rounded-[var(--cfit-radius-card)] border border-slate-200/80 bg-white p-6"><SkeletonBlock className="h-3 w-28"/><SkeletonBlock className="mt-3 h-9 w-64 max-w-full"/><SkeletonBlock className="mt-3 h-3 w-80 max-w-full"/></div><CardSkeleton count={3}/><div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]"><TableSkeleton rows={4} columns={3}/><div className="min-h-72 rounded-[var(--cfit-radius-card)] border border-slate-200/80 bg-white p-6"><SkeletonBlock className="h-4 w-32"/><SkeletonBlock className="mt-6 h-40 w-full rounded-xl"/></div></div></div>;
}

export function FormSkeleton() {
    return <div className="grid gap-5 sm:grid-cols-2" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <div key={index} className={index > 3 ? "sm:col-span-2" : ""}><SkeletonBlock className="h-3 w-24"/><SkeletonBlock className="mt-2 h-11 w-full rounded-xl"/></div>)}</div>;
}

export function ModuleSkeleton({ variant = "module", label = "Carregando módulo" }: { variant?: "module" | "details" | "form"; label?: string }) {
    return <section className="space-y-6" role="status" aria-live="polite" aria-busy="true"><span className="sr-only">{label}</span><div aria-hidden="true" className="flex min-h-16 flex-wrap items-end justify-between gap-4"><div><SkeletonBlock className="h-2.5 w-28"/><SkeletonBlock className="mt-3 h-8 w-56 max-w-[70vw]"/><SkeletonBlock className="mt-3 h-3 w-80 max-w-[80vw]"/></div><SkeletonBlock className="h-10 w-32 rounded-xl"/></div>{variant === "details" ? <DetailSkeleton/> : variant === "form" ? <div className="rounded-[var(--cfit-radius-card)] border border-slate-200/80 bg-white p-6"><FormSkeleton/></div> : <><CardSkeleton/><TableSkeleton/></>}</section>;
}

export function AppBootSkeleton() {
    return <div className="cfit-internal flex min-h-screen bg-[var(--cfit-canvas)]"><aside aria-hidden="true" className="hidden w-[280px] shrink-0 bg-[#071426] p-6 lg:block"><SkeletonBlock className="h-12 w-36 bg-white/10"/><div className="mt-12 space-y-4">{Array.from({ length: 7 }, (_, index) => <SkeletonBlock key={index} className="h-10 w-full bg-white/10"/>)}</div></aside><div className="min-w-0 flex-1"><div aria-hidden="true" className="h-[72px] border-b border-slate-200/80 bg-white/85 px-5 py-4"><SkeletonBlock className="h-10 w-52 max-w-[60vw]"/></div><main className="mx-auto w-full max-w-[1600px] p-5 sm:p-6 lg:p-8 xl:p-10"><ModuleSkeleton label="Carregando ambiente Cfit"/></main></div></div>;
}

export function PublicRouteFallback() {
    return <div data-route-fallback="public" className="min-h-screen overflow-hidden bg-[#f4f7fb]" role="status" aria-live="polite" aria-busy="true"><span className="sr-only">Carregando página inicial do Cfit</span><header aria-hidden="true" className="h-[78px] border-b border-slate-200 bg-white/90"><div className="mx-auto flex h-full max-w-[1600px] items-center justify-between px-6 lg:px-10"><SkeletonBlock className="h-9 w-24 bg-slate-200"/><SkeletonBlock className="h-10 w-28 rounded-full bg-slate-200"/></div></header><main aria-hidden="true" className="mx-auto grid w-full max-w-[1600px] gap-9 px-6 py-10 md:py-12 lg:min-h-[560px] lg:grid-cols-[minmax(0,1.05fr)_minmax(430px,0.95fr)] lg:items-center lg:px-10"><div><SkeletonBlock className="h-3 w-52 bg-blue-100"/><SkeletonBlock className="mt-7 h-16 w-full max-w-[680px] bg-slate-200 sm:h-24"/><SkeletonBlock className="mt-4 h-16 w-full max-w-[580px] bg-slate-200"/><div className="mt-6 flex gap-3"><SkeletonBlock className="h-12 w-40 rounded-full bg-blue-200"/><SkeletonBlock className="h-12 w-44 rounded-full bg-slate-200"/></div></div><div className="min-h-[360px] rounded-[1.5rem] border border-slate-200 bg-white p-5"><SkeletonBlock className="h-10 w-2/5 bg-slate-200"/><SkeletonBlock className="mt-6 h-24 w-full bg-slate-200"/><SkeletonBlock className="mt-4 h-40 w-full bg-blue-100"/></div></main></div>;
}

export function LoginRouteFallback() {
    return <main data-route-fallback="login" className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-3 py-4" role="status" aria-live="polite" aria-busy="true"><span className="sr-only">Carregando acesso ao Cfit</span><div aria-hidden="true" className="grid w-full max-w-[1040px] overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_32px_90px_-48px_rgba(15,23,42,0.55)] lg:grid-cols-[0.8fr_1.2fr]"><aside className="hidden min-h-[650px] bg-[#edf4ff] p-10 lg:block"><SkeletonBlock className="h-12 w-32 bg-blue-100"/><SkeletonBlock className="mt-14 h-28 w-full bg-blue-100"/><SkeletonBlock className="mt-6 h-16 w-4/5 bg-blue-100"/></aside><section className="min-h-[650px] bg-[#081426] p-5 sm:p-7 lg:p-10"><SkeletonBlock className="h-10 w-24 bg-white/10 lg:hidden"/><SkeletonBlock className="mt-5 h-4 w-44 bg-white/10"/><SkeletonBlock className="mt-8 h-10 w-72 max-w-full bg-white/10"/><SkeletonBlock className="mt-5 h-14 w-full bg-white/10"/><SkeletonBlock className="mt-5 h-12 w-full bg-white/10"/><SkeletonBlock className="mt-4 h-12 w-full bg-white/10"/><SkeletonBlock className="mt-5 h-20 w-full bg-white/10"/></section></div></main>;
}

type StateFrameProps = { icon: ReactNode; title: string; detail?: string; action?: ReactNode; tone?: "neutral" | "danger" | "warning" };

function StateFrame({ icon, title, detail, action, tone = "neutral" }: StateFrameProps) {
    const toneClass = tone === "danger" ? "border-red-300/70 text-red-700" : tone === "warning" ? "border-amber-300/70 text-amber-700" : "border-slate-200 text-slate-700";
    return <div className={`flex min-h-40 flex-col items-center justify-center rounded-[var(--cfit-radius-card)] border bg-white p-8 text-center text-sm shadow-[var(--cfit-shadow-card)] ${toneClass}`} role="status">{icon}<p className="mt-3 font-bold">{title}</p>{detail && <p className="mt-1 max-w-lg text-slate-600">{detail}</p>}{action && <div className="mt-4">{action}</div>}</div>;
}

export function LoadingState({ label = "Carregando dados..." }: { label?: string }) { return <StateFrame icon={<LoaderCircle className="animate-spin text-blue-600" size={22} />} title={label} />; }
export function SkeletonState({ rows = 4 }: { rows?: number }) { return <div className="space-y-3 rounded-[var(--cfit-radius-card)] border border-slate-200 bg-white p-6 shadow-[var(--cfit-shadow-card)]" aria-label="Carregando dados" aria-busy="true">{Array.from({ length: rows }, (_, index) => <SkeletonBlock key={index} className="h-16 w-full rounded-xl" />)}</div>; }
export function ErrorState({ onRetry, label = "Não foi possível carregar os dados.", detail = "Verifique a conexão e tente novamente." }: { onRetry?: () => void; label?: string; detail?: string }) { return <StateFrame tone="danger" icon={<AlertCircle size={22}/>} title={label} detail={detail} action={onRetry && <button type="button" onClick={onRetry} className="font-bold underline underline-offset-4">Tentar novamente</button>} />; }
export function EmptyState({ label, detail, action }: { label: string; detail: string; action?: ReactNode }) { return <StateFrame icon={<Inbox className="text-slate-300"/>} title={label} detail={detail} action={action} />; }
export function FilteredEmptyState({ onClear }: { onClear?: () => void }) { return <StateFrame icon={<SlidersHorizontal className="text-slate-400"/>} title="Nenhum resultado para estes filtros" detail="Altere os critérios ou limpe os filtros para ampliar a consulta." action={onClear && <button type="button" onClick={onClear} className="font-bold text-blue-600">Limpar filtros</button>} />; }
export function PermissionState({ detail = "Seu perfil não possui acesso a esta área." }: { detail?: string }) { return <StateFrame tone="warning" icon={<Ban size={22}/>} title="Acesso não permitido" detail={detail} />; }
export function UnavailableState({ detail = "Este módulo está temporariamente indisponível." }: { detail?: string }) { return <StateFrame tone="warning" icon={<Wrench size={22}/>} title="Módulo indisponível" detail={detail} />; }
