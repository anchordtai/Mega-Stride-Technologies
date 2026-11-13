"use client";
import { useState } from "react";
export default function CheckoutButton({
  course,
  test = false,
}: {
  course: string;
  test?: boolean;
}) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState("");
  return (
    <div>
      <button
        className="primary-button"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError("");
          try {
            const r = await fetch("/api/payments/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ course }),
              signal: AbortSignal.timeout(20000),
            });
            const d = await r.json();
            if (!r.ok) throw Error(d.error);
            const u = new URL(d.url);
            if (
              u.protocol !== "https:" ||
              u.hostname !== "checkout.paystack.com"
            )
              throw Error("Checkout unavailable");
            window.location.assign(u.href);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Checkout unavailable");
            setPending(false);
          }
        }}
      >
        {pending
          ? "Preparing secure checkout…"
          : test
            ? "Open test checkout"
            : "Pay securely with Paystack ↗"}
      </button>
      {test && (
        <p className="mt-3 text-sm text-amber-800">
          Test mode: no real payment or course access.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}
