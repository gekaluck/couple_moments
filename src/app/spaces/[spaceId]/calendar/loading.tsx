export default function CalendarLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="surface-muted p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="skeleton h-6 w-32" />
            <div className="skeleton mt-2 h-4 w-56" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="skeleton h-9 w-24 rounded-full" />
            <div className="skeleton h-9 w-28 rounded-full" />
            <div className="skeleton h-9 w-24 rounded-full" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={`weekday-${index}`} className="skeleton h-4 w-full" />
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, index) => (
            <div key={`cell-${index}`} className="skeleton h-[110px] w-full" />
          ))}
        </div>
      </div>
      <div className="surface p-6">
        <div className="flex items-center justify-between">
          <div className="skeleton h-6 w-40" />
          <div className="skeleton h-9 w-24 rounded-full" />
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, column) => (
            <div key={`column-${column}`} className="flex flex-col gap-4">
              <div className="skeleton h-10 w-40" />
              {Array.from({ length: 4 }).map((__, card) => (
                <div key={`card-${column}-${card}`} className="skeleton h-24 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
