export default function CalendarLoading() {
  return (
    <div className="surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="skeleton h-6 w-32" />
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
  );
}
