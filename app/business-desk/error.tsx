"use client";
export default function ErrorBoundary({ reset }: { reset: () => void }) {
  return (
    <section className="bd-panel" role="alert">
      <h2>The workspace could not load.</h2>
      <p>
        Retry the page or sign in again. Review the saved records before
        resubmitting a financial change.
      </p>
      <button className="bd-primary" onClick={reset}>
        Try again
      </button>
      <a className="bd-secondary" href="/account?next=%2Fbusiness-desk">
        Sign in
      </a>
    </section>
  );
}
