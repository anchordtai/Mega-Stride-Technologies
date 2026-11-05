"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main-content" className="container min-h-[60vh] py-32">
      <h1 className="text-4xl font-bold">We couldn’t complete that request.</h1>
      <p className="mt-5 text-slate-600">
        Please check your information and try again. If the problem continues,
        contact info@megastride.com.ng.
      </p>
      <button className="primary-button mt-6" onClick={reset}>
        Try again
      </button>
      <a href="/" className="ml-5 underline">
        Return home
      </a>
    </main>
  );
}
