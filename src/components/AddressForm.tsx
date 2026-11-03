/** The one action: a plain GET form, so it works before any script loads. */
export function AddressForm({
  defaultValue = "",
  variant = "default",
  id = "q",
}: {
  defaultValue?: string;
  /** `hero`: one wide white bar with the button inside it. `compact`: a small inline form. */
  variant?: "default" | "hero" | "compact";
  id?: string;
}) {
  const label = (
    <label htmlFor={id} className="sr-only">
      King County address or parcel number
    </label>
  );

  if (variant === "hero") {
    return (
      <form action="/report" method="get" className="flex w-full flex-col gap-2 bg-white p-2 sm:flex-row">
        {label}
        <input
          id={id}
          name="q"
          required
          defaultValue={defaultValue}
          autoComplete="street-address"
          placeholder="Address or parcel number"
          className="min-h-16 min-w-0 flex-1 bg-white px-4 text-[length:var(--step-lead)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none"
        />
        <button type="submit" className="btn min-h-16 shrink-0 px-8">
          Look up
        </button>
      </form>
    );
  }

  const compact = variant === "compact";
  return (
    <form action="/report" method="get" className={`flex w-full ${compact ? "gap-2" : "flex-col gap-3 sm:flex-row"}`}>
      {label}
      <input
        id={id}
        name="q"
        required
        defaultValue={defaultValue}
        autoComplete="street-address"
        placeholder="1600 E Olive Way, Seattle"
        className="min-h-14 min-w-0 flex-1 bg-[var(--field-input)] px-4 text-[length:var(--step-body)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:bg-white focus:outline-none"
      />
      <button type="submit" className="btn shrink-0">
        Look up
      </button>
    </form>
  );
}
