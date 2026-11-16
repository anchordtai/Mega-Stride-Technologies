"use client";
import { FormEvent, useState, useRef, useEffect } from "react";
import Script from "next/script";
type Kind = "contact" | "trade" | "quotation" | "training";
declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
  }
}
export default function EnquiryForm({
  kind = "contact",
  service = "General enquiry",
  available = true,
}: {
  kind?: Kind;
  service?: string;
  available?: boolean;
}) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState(""),
    [reference, setReference] = useState("");
  const [attachmentMessage,setAttachmentMessage]=useState("");
  const [scriptReady, setScriptReady] = useState(false);
  const sending = useRef(false);
  const challenge = useRef("");
  const challengeTime = useRef(0);
  const widget = useRef<HTMLDivElement>(null),
    widgetId = useRef<string | null>(null),
    token = useRef("");
  useEffect(() => {
    if (
      scriptReady &&
      widget.current &&
      window.turnstile &&
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    ) {
      widgetId.current = window.turnstile.render(widget.current, {
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
        callback: (value: string) => {
          token.current = value;
        },
        "expired-callback": () => {
          token.current = "";
        },
      });
    }
    return () => {
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
    };
  }, [scriptReady]);
  useEffect(() => {
    if (available && !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
      fetch("/api/enquiry-challenge", {
        method: "POST",
        signal: AbortSignal.timeout(12000),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          challenge.current = d?.token || "";
          challengeTime.current = Date.now();
        })
        .catch(() => {});
    }
  }, [available]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending.current) return;
    sending.current = true;
    setError("");
    setPending(true);
    const f = new FormData(e.currentTarget);
    const payload = {
      kind,
      name: String(f.get("name") || ""),
      email: String(f.get("email") || ""),
      company: String(f.get("company") || ""),
      phone: String(f.get("phone") || ""),
      country: String(f.get("country") || ""),
      service: String(f.get("service") || service),
      subject: String(f.get("subject") || ""),
      message: String(f.get("message") || ""),
      product: String(f.get("product") || ""),
      quantity: String(f.get("quantity") || ""),
      destination: String(f.get("destination") || ""),
      timeframe: String(f.get("timeframe") || ""),
      state:String(f.get("state")||""),budget:String(f.get("budget")||""),preferred_contact:String(f.get("preferred_contact")||""),
      website: String(f.get("website") || ""),
      consent: f.get("consent") === "on",
      turnstileToken: token.current,
      challengeToken: challenge.current,
    };
    try {
      if (challenge.current && Date.now() - challengeTime.current < 1600)
        await new Promise((r) =>
          setTimeout(r, 1600 - (Date.now() - challengeTime.current)),
        );
      const r = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000),
      });
      if (!r.headers.get("content-type")?.includes("application/json"))
        throw Error(
          "We could not confirm the response. Your details are still here; please contact us if the problem continues.",
        );
      const data = await r.json();
      if (!r.ok) throw Error(data.error);
      const files=f.getAll("attachments").filter((x):x is File=>x instanceof File&&x.size>0);
      if(files.length&&data.attachmentPermit){let saved=0;for(const file of files.slice(0,3)){const upload=new FormData();upload.set("file",file);try{const r=await fetch("/api/business-desk/attachments",{method:"POST",headers:{Authorization:`Bearer ${data.attachmentPermit}`},body:upload,signal:AbortSignal.timeout(20000)});if(r.ok)saved++;}catch{}}setAttachmentMessage(`${saved} of ${files.length} attachments saved. ${saved<files.length?"Your enquiry is received. Contact the company with your reference to share any remaining files.":""}`);}
      else if(files.length)setAttachmentMessage("Your enquiry is saved. Contact the company with your reference to share supporting files.");
      setReference(data.reference);
    } catch (err) {
      setError(
        err instanceof DOMException &&
          (err.name === "TimeoutError" || err.name === "AbortError")
          ? "The connection took too long. We could not confirm submission. Please keep your details and contact our team before sending again."
          : err instanceof Error
            ? err.message
            : "We could not confirm submission. Your details are still here. Please try again or contact us.",
      );
      if (widgetId.current) window.turnstile?.reset(widgetId.current);
      token.current = "";
      if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
        try {
          const fresh = await fetch("/api/enquiry-challenge", {
            method: "POST",
            signal: AbortSignal.timeout(12000),
          });
          const d = await fresh.json();
          challenge.current = d.token || "";
          challengeTime.current = Date.now();
        } catch {
          challenge.current = "";
        }
      }
    } finally {
      sending.current = false;
      setPending(false);
    }
  }
  if (reference)
    return (
      <div role="status" className="platform-panel form-success">
        <span className="success-mark" aria-hidden="true">
          ✓
        </span>
        <p className="section-kicker">Enquiry received</p>
        <h2 className="mt-4 text-3xl font-bold">
          Thank you for taking the next stride.
        </h2>
        <p className="enquiry-reference">
          Your reference is <strong>{reference}</strong>. Our team will review
          your requirements.
        </p>
        {attachmentMessage&&<p className="mt-5 text-sm leading-7">{attachmentMessage}</p>}
      </div>
    );
  return (
    <form
      onSubmit={submit}
      className="platform-panel enquiry-form"
      aria-busy={pending}
    >
      <div className="form-intro">
        <h2>
          {kind === "training"
            ? "Let’s plan your learning."
            : kind === "trade"
              ? "Tell us what you need to source."
              : kind === "quotation"
                ? "Share your project requirements."
                : "Start the conversation."}
        </h2>
        <p>
          Fields marked * are required. You’ll receive a reference after your
          enquiry is saved.
        </p>
      </div>
      {!available && (
        <p
          role="status"
          className="mb-6 rounded-xl bg-blue-50 p-4 text-sm text-blue-950"
        >
          Online submissions are being upgraded. Please email{" "}
          <a className="underline" href="mailto:info@megastride.com.ng">
            info@megastride.com.ng
          </a>{" "}
          or call +234 707 572 1887.
        </p>
      )}
      <fieldset disabled={!available || pending}>
        <legend className="sr-only">{kind} enquiry details</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="form-label">
            Full name *
            <input
              className="form-input"
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={120}
            />
          </label>
          <label className="form-label">
            Email *
            <input
              className="form-input"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
            />
          </label>
          <label className="form-label">
            Company
            <input
              className="form-input"
              name="company"
              autoComplete="organization"
              maxLength={160}
            />
          </label>
          <label className="form-label">
            Telephone (including country code)
            <input
              className="form-input"
              name="phone"
              type="tel"
              autoComplete="tel"
              maxLength={40}
            />
          </label>
          <label className="form-label">
            Country *
            <input
              className="form-input"
              name="country"
              autoComplete="country-name"
              required
              maxLength={80}
            />
          </label>
          <label className="form-label">
            {kind === "training"
              ? "Learning pathway"
              : "Service / product category"}
            <input
              className="form-input"
              name="service"
              defaultValue={service}
              required
              maxLength={120}
            />
          </label>
          {kind === "quotation"&&<><label className="form-label">State / region<input name="state" className="form-input" maxLength={100}/></label><label className="form-label">Estimated budget · optional<input name="budget" className="form-input" maxLength={120}/></label><label className="form-label">Expected completion / timeframe<input name="timeframe" className="form-input" maxLength={120}/></label><label className="form-label">Preferred contact<select name="preferred_contact" className="form-input"><option value="email">Email</option><option value="phone">Phone</option><option value="whatsapp">WhatsApp</option></select></label><label className="form-label sm:col-span-2">Supporting files · up to three PDF, PNG or JPEG files, 2 MiB each<input type="file" name="attachments" className="form-input" multiple accept="application/pdf,image/png,image/jpeg" onChange={e=>{const files=Array.from(e.currentTarget.files||[]);if(files.length>3||files.some(f=>f.size>2097152)){e.currentTarget.setCustomValidity("Select up to three files, each no larger than 2 MiB.");}else e.currentTarget.setCustomValidity("");}}/></label></>}
          {kind === "trade" && (
            <>
              <label className="form-label">
                Product description *
                <input
                  name="product"
                  className="form-input"
                  required
                  maxLength={240}
                />
              </label>
              <label className="form-label">
                Quantity
                <input
                  name="quantity"
                  className="form-input"
                  required
                  maxLength={80}
                />
              </label>
              <label className="form-label">
                Destination *
                <input
                  name="destination"
                  className="form-input"
                  required
                  maxLength={160}
                />
              </label>
              <label className="form-label">
                Expected delivery timeframe
                <input
                  name="timeframe"
                  className="form-input"
                  maxLength={120}
                />
              </label>
            </>
          )}
        </div>
        <label className="form-label mt-5">
          Subject
          <input name="subject" className="form-input" maxLength={180} />
        </label>
        <label className="form-label mt-5">
          {kind === "training"
            ? "Learning goals and preferred training arrangement"
            : "Requirements and additional information *"}
          <textarea
            name="message"
            className="form-input"
            required
            minLength={15}
            maxLength={5000}
            rows={6}
          />
        </label>
        <div className="honeypot" aria-hidden="true">
          <label>
            Leave this empty
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <label className="mt-5 flex gap-3 text-sm leading-6">
          <input
            name="consent"
            type="checkbox"
            required
            className="mt-1 h-5 w-5 shrink-0"
          />
          <span>
            I agree to the use of my details to respond to this enquiry, as
            described in the{" "}
            <a href="/privacy" className="underline">
              privacy notice
            </a>
            .
          </span>
        </label>
        {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
          <>
            <Script
              src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
              onReady={() => setScriptReady(true)}
            />
            <div ref={widget} className="mt-5" />
          </>
        )}
        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 p-4 text-red-800"
          >
            {error}
          </p>
        )}
        <button
          type="submit"
          className="primary-button mt-6"
          disabled={pending || !available}
        >
          {pending
            ? "Sending…"
            : kind === "training"
              ? "Submit training enquiry"
              : "Send enquiry"}{" "}
          <span aria-hidden="true">↗</span>
        </button>
      </fieldset>
    </form>
  );
}
