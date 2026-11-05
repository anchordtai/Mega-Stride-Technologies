export default function NotFound() {
  return (
    <main id="main-content" className="container min-h-[60vh] py-32">
      <p className="section-kicker">Page not found</p>
      <h1 className="mt-5 text-4xl font-bold">Let’s get you back on track.</h1>
      <p className="mt-5 text-slate-600">
        This page may have moved or may not be available to your account.
      </p>
      <a href="/" className="primary-button mt-7">
        Return home →
      </a>
    </main>
  );
}
