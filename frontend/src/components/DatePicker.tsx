import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  min?: string;
  max?: string;
  error?: string;
  disabled?: boolean;
}

const weekdays = ["D", "S", "T", "Q", "Q", "S", "S"];
const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const dateFormatter = new Intl.DateTimeFormat("pt-BR");

function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function serializeDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function DatePicker({ value, onChange, label, required, min, max, error, disabled }: DatePickerProps) {
  const selected = parseDate(value);
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => selected ?? new Date());
  const rootRef = useRef<HTMLDivElement>(null);
  const fieldId = useId();

  useEffect(() => {
    const nextSelected = parseDate(value);
    if (nextSelected) setVisibleMonth(nextSelected);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const days = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const first = new Date(year, month, 1);
    const start = new Date(year, month, 1 - first.getDay());
    return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
  }, [visibleMonth]);

  const today = serializeDate(new Date());
  const minDate = parseDate(min ?? "") ?? new Date(1900, 0, 1);
  const maxDate = parseDate(max ?? "") ?? new Date(new Date().getFullYear() + 10, 11, 31);
  const minYear = minDate.getFullYear();
  const maxYear = maxDate.getFullYear();
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, index) => maxYear - index);
  const moveMonth = (offset: number) => setVisibleMonth(current => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  const visibleMonthKey = visibleMonth.getFullYear() * 12 + visibleMonth.getMonth();
  const atFirstMonth = visibleMonthKey <= minYear * 12 + minDate.getMonth();
  const atLastMonth = visibleMonthKey >= maxYear * 12 + maxDate.getMonth();

  return (
    <div ref={rootRef} className="relative">
      {label && <label className="mb-2 block text-sm font-medium text-slate-700">{label.replace(/ \*$/, "")}{required && <span className="ml-1 text-red-500">*</span>}</label>}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(current => !current)}
        className={`flex h-11 w-full items-center justify-between rounded-xl border bg-white px-4 text-left text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 disabled:opacity-60 ${error ? "border-red-400" : "border-slate-200"}`}
      >
        <span className={selected ? "text-slate-900" : "text-slate-400"}>{selected ? dateFormatter.format(selected) : "Selecione a data"}</span>
        <CalendarDays size={18} className="text-blue-600" />
      </button>
      {required && <input tabIndex={-1} aria-hidden="true" required value={value} onChange={() => undefined} className="pointer-events-none absolute h-px w-px opacity-0" />}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      {open && (
        <div role="dialog" aria-label="Escolher data" className="absolute left-0 z-50 mt-2 w-[min(21rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
          <div className="flex items-center gap-2">
            <button type="button" disabled={atFirstMonth} onClick={() => moveMonth(-1)} aria-label="Mês anterior" className="grid size-9 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-30"><ChevronLeft size={18} /></button>
            <div className="grid min-w-0 flex-1 grid-cols-[1fr_5.5rem] gap-2">
              <label className="sr-only" htmlFor={`${fieldId}-month`}>Mês</label>
              <select id={`${fieldId}-month`} aria-label="Mês" value={visibleMonth.getMonth()} onChange={event => setVisibleMonth(current => new Date(current.getFullYear(), Number(event.target.value), 1))} className="h-9 min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-2 text-sm font-bold text-slate-800 outline-none focus:border-blue-500">
                {months.map((month, index) => {
                  const monthKey = visibleMonth.getFullYear() * 12 + index;
                  const unavailable = monthKey < minYear * 12 + minDate.getMonth() || monthKey > maxYear * 12 + maxDate.getMonth();
                  return <option key={month} value={index} disabled={unavailable}>{month}</option>;
                })}
              </select>
              <label className="sr-only" htmlFor={`${fieldId}-year`}>Ano</label>
              <select id={`${fieldId}-year`} aria-label="Ano" value={visibleMonth.getFullYear()} onChange={event => setVisibleMonth(current => {
                const year = Number(event.target.value);
                const minimumMonth = year === minYear ? minDate.getMonth() : 0;
                const maximumMonth = year === maxYear ? maxDate.getMonth() : 11;
                return new Date(year, Math.min(maximumMonth, Math.max(minimumMonth, current.getMonth())), 1);
              })} className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-2 text-sm font-bold text-slate-800 outline-none focus:border-blue-500">
                {years.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
            <button type="button" disabled={atLastMonth} onClick={() => moveMonth(1)} aria-label="Próximo mês" className="grid size-9 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-30"><ChevronRight size={18} /></button>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1 text-center">
            {weekdays.map((day, index) => <span key={`${day}-${index}`} className="py-1 text-[11px] font-bold text-slate-400">{day}</span>)}
            {days.map(day => {
              const serialized = serializeDate(day);
              const outside = day.getMonth() !== visibleMonth.getMonth();
              const unavailable = Boolean((min && serialized < min) || (max && serialized > max));
              return <button key={serialized} type="button" disabled={unavailable} aria-label={dateFormatter.format(day)} aria-pressed={serialized === value} onClick={() => { onChange(serialized); setOpen(false); }} className={`aspect-square rounded-xl text-sm transition ${serialized === value ? "bg-blue-600 font-bold text-white" : serialized === today ? "bg-cyan-50 font-bold text-blue-700" : outside ? "text-slate-300 hover:bg-slate-50" : "text-slate-700 hover:bg-blue-50"} disabled:cursor-not-allowed disabled:opacity-25`}>{day.getDate()}</button>;
            })}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            <button type="button" disabled={Boolean((min && today < min) || (max && today > max))} onClick={() => { onChange(today); setOpen(false); }} className="text-xs font-bold text-blue-600 disabled:opacity-40">Hoje</button>
            {value && <button type="button" onClick={() => onChange("")} className="flex items-center gap-1 text-xs font-bold text-slate-500"><X size={14} /> Limpar</button>}
          </div>
        </div>
      )}
    </div>
  );
}
