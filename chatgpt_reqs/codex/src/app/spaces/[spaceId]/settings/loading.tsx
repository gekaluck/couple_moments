export default function SettingsLoading() {
  return (
    <>
      <section className="surface p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="skeleton h-6 w-36" />
            <div className="skeleton mt-2 h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <div className="skeleton h-7 w-24 rounded-full" />
            <div className="skeleton h-7 w-28 rounded-full" />
          </div>
        </div>
      </section>

      <section className="surface p-6">
        <div className="skeleton h-5 w-20" />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
            <div className="flex items-center gap-4">
              <div className="skeleton h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-24" />
                <div className="skeleton h-3 w-40" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4">
            <div className="flex items-center gap-4">
              <div className="skeleton h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-32" />
                <div className="skeleton h-3 w-40" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="surface p-6">
        <div className="skeleton h-5 w-24" />
        <div className="mt-4 space-y-3">
          <div className="skeleton h-12 w-full rounded-lg" />
          <div className="skeleton h-12 w-full rounded-lg" />
          <div className="skeleton h-12 w-full rounded-lg" />
        </div>
      </section>
    </>
  );
}
