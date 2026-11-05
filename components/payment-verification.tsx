"use client";
import { useState } from "react";
export default function PaymentVerification({
  reference,
}: {
  reference: string;
}) {
  const [message, setMessage] = useState(""),
    [pending, setPending] = useState(false);
  return (
    <div className="platform-panel mb-8">
      <h2 className="text-xl font-bold">Confirm your checkout result</h2>
      <p className="mt-3 text-sm">Reference: {reference}</p>
      <button
        disabled={pending}
        className="primary-button mt-5"
        onClick={async () => {
          setPending(true);
          try {
            const r = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reference }),
              signal: AbortSignal.timeout(20000),
            });
            const d = await r.json();
            setMessage(
              d.message || d.error || "Check your payment records below.",
            );
            if (r.ok) window.location.assign("/academy/payments?verified=1");
          } catch {
            setMessage(
              "Confirmation is unavailable. Keep your reference and contact support before paying again.",
            );
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? "Checking payment…" : "Verify payment"}
      </button>
      {message && (
        <p role="status" className="mt-4 leading-7">
          {message}
        </p>
      )}
    </div>
  );
}
