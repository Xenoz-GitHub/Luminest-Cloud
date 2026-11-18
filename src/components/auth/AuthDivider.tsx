export function AuthDivider() {
  return (
    <div className="my-4 flex items-center gap-3" aria-hidden>
      <span className="h-px flex-1 bg-line" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
        or
      </span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
