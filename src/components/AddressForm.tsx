/** The one action: a plain GET form, so it works before any script loads. */
export function AddressForm({ defaultValue = "", compact = false }: { defaultValue?: string; compact?: boolean }) {
  return (
    <form action="/report" method="get" className={`flex w-full ${compact ? "gap-2" : "flex-col gap-3 sm:flex-row"}`}>
      <label htmlFor={compact ? "q-compact" : "q"} className="sr-only">
        King County address or parcel number
      </label>
      <input
        id={compact ? "q-compact" : "q"}
        name="q"
        required
        defaultValue={defaultValue}
        autoComplete="street-address"
        placeholder="1600 E Olive Way, Seattle"
        className="min-h-14 min-w-0 flex-1 bg-[var(--field-input)] px-4 text-[length:var(--step-body)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:bg-white focus:outline-none"
      />
      <button type="submit" className="btn shrink-0">
        {compact ? "Look up" : "Build the dossier"}
      </button>
    </form>
  );
}
