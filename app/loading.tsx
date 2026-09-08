export default function Loading() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-7 w-48 rounded-lg bg-slate-200" />
        <div className="mt-5 h-3 w-72 max-w-full rounded bg-slate-200" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
              <div className="aspect-[4/5] bg-slate-100" />
              <div className="space-y-3 p-5">
                <div className="h-3 w-20 rounded bg-slate-100" />
                <div className="h-5 w-4/5 rounded bg-slate-100" />
                <div className="h-4 w-2/5 rounded bg-slate-100" />
                <div className="h-11 rounded-xl bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
