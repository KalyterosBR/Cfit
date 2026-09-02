type PaginationFooterProps = {
  count: number;
  label: string;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  page?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (value: number) => void;
};

export default function PaginationFooter({ count, label, hasPrevious, hasNext, onPrevious, onNext, page, pageSize, pageSizeOptions = [10, 25, 50], onPageSizeChange }: PaginationFooterProps) {
  return <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-t border-[var(--cfit-border-default)] p-4 text-sm"><span aria-live="polite">{count} {label}{page ? ` · página ${page}` : ""}</span><div className="flex flex-wrap items-center gap-3">{pageSize && onPageSizeChange && <label className="text-xs font-semibold">Por página <select aria-label="Itens por página" value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))} className="ml-2 h-9 rounded-lg border bg-[var(--cfit-surface)] px-2">{pageSizeOptions.map(option => <option key={option} value={option}>{option}</option>)}</select></label>}<nav aria-label="Paginação" className="flex gap-2"><button type="button" disabled={!hasPrevious} onClick={onPrevious} className="cfit-secondary-button">Anterior</button><button type="button" disabled={!hasNext} onClick={onNext} className="cfit-secondary-button">Próxima</button></nav></div></div>;
}
