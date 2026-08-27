type PaginationFooterProps = {
  count: number;
  label: string;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export default function PaginationFooter({ count, label, hasPrevious, hasNext, onPrevious, onNext }: PaginationFooterProps) {
  return <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-t border-[var(--cfit-border)] p-4 text-sm"><span aria-live="polite">{count} {label}</span><nav aria-label="Paginação" className="flex gap-2"><button type="button" disabled={!hasPrevious} onClick={onPrevious} className="cfit-secondary-button">Anterior</button><button type="button" disabled={!hasNext} onClick={onNext} className="cfit-secondary-button">Próxima</button></nav></div>;
}
