export default function Loading() {
  return (
    <section className="bd-panel" aria-live="polite" aria-busy="true">
      <h2>Loading your protected workspace…</h2>
      <p>Checking your session and retrieving your authorised records.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3" aria-hidden="true">
        {[0, 1, 2].map((n) => (
          <div key={n} className="h-24 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    </section>
  );
}
