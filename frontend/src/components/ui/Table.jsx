const Table = ({
  columns = [],
  data = [],
  isLoading,
  error,
  onRetry,
  emptyMessage = 'No data available.',
}) => {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-14 rounded-lg bg-app-bg-tertiary animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-app-danger/30 bg-app-danger/5 p-6 text-center">
        <p className="text-sm font-medium text-app-danger mb-1">
          Couldn&apos;t load this data
        </p>
        <p className="text-xs text-app-text-secondary mb-4">
          {error.code === 'permission-denied'
            ? 'Your account does not have permission to read this collection. Check Firestore security rules.'
            : error.message || 'An unknown error occurred.'}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs font-medium text-app-accent hover:underline"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-app-border bg-app-bg-secondary p-12 text-center text-sm text-app-text-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-app-border bg-app-bg-secondary">
        <table className="w-full text-sm">
          <thead className="bg-app-bg-tertiary sticky top-0">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-app-text-secondary"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={row.id || idx}
                className={`border-t border-app-border hover:bg-app-bg-tertiary transition ${
                  idx % 2 === 1 ? 'bg-app-bg-primary/30' : ''
                }`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-app-text-primary">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <div className="md:hidden space-y-3">
        {data.map((row) => (
          <div
            key={row.id}
            className="rounded-2xl border border-app-border bg-app-bg-secondary p-4 space-y-2"
          >
            {columns.map((col) => (
              <div key={col.key} className="flex justify-between gap-3 text-sm">
                <span className="text-app-text-muted font-medium">
                  {col.header}
                </span>
                <span className="text-app-text-primary text-right">
                  {col.render ? col.render(row) : row[col.key]}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
};

export default Table;
