/** Page title on the left, the page's actions (buttons, filters) on the right; wraps on a phone. */
export function PageHeader({ title, children }: { title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

/** The row of search and filters under the header, for lists with more than one or two of them. */
export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div role="search" className="mt-4 flex flex-wrap items-center gap-2">
      {children}
    </div>
  );
}
