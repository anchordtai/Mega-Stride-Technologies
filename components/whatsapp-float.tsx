"use client";

export default function WhatsAppFloat() {
  const href = "https://wa.me/23475721887?text=Hello%20Mega%20Stride%20Technologies%2C%20I%20would%20like%20to%20make%20an%20enquiry.";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Mega Stride Technologies on WhatsApp"
      className="group fixed bottom-6 right-4 z-[9999] flex min-h-[58px] items-center gap-2 rounded-full border-2 border-white/80 bg-[#25D366] px-3 py-2.5 text-white shadow-[0_14px_45px_rgba(37,211,102,.42)] ring-1 ring-[#25D366]/40 transition duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:bg-[#20bd5a] hover:shadow-[0_18px_55px_rgba(37,211,102,.52)] focus:outline-none focus:ring-4 focus:ring-[#25D366]/40 sm:bottom-7 sm:right-7 sm:gap-3 sm:px-4"
    >
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 shadow-inner">
        <span className="absolute inset-0 animate-ping rounded-full bg-white/20" aria-hidden="true" />
        <svg viewBox="0 0 32 32" className="relative h-6 w-6 fill-current" aria-hidden="true">
          <path d="M16 3C8.82 3 3 8.54 3 15.38c0 2.2.6 4.27 1.74 6.1L3.08 28.7l7.4-1.62A13.24 13.24 0 0 0 16 27.76c7.18 0 13-5.54 13-12.38S23.18 3 16 3Zm0 22.48c-1.8 0-3.55-.47-5.1-1.36l-.37-.21-4.39.96.94-4.05-.24-.4a10.65 10.65 0 0 1-1.63-5.64C5.21 9.83 10.05 5.2 16 5.2s10.79 4.63 10.79 10.33S21.95 25.48 16 25.48Zm5.92-7.7c-.32-.16-1.9-.92-2.2-1.02-.3-.11-.52-.16-.74.16-.22.33-.85 1.02-1.04 1.23-.19.22-.38.24-.7.08-.32-.16-1.36-.48-2.58-1.54-.95-.82-1.59-1.83-1.78-2.14-.19-.33-.02-.5.14-.66.15-.15.32-.38.48-.57.16-.19.22-.33.33-.54.11-.22.05-.41-.03-.57-.08-.16-.74-1.76-1.01-2.41-.27-.64-.54-.55-.74-.56h-.63c-.22 0-.57.08-.87.41-.3.33-1.14 1.1-1.14 2.68s1.17 3.11 1.33 3.33c.16.22 2.29 3.49 5.55 4.9.77.33 1.38.53 1.85.68.78.25 1.49.21 2.05.13.63-.09 1.9-.77 2.17-1.51.27-.74.27-1.38.19-1.51-.08-.14-.3-.22-.62-.38Z" />
        </svg>
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[9px] font-bold uppercase tracking-[.16em] text-white/80">Need help?</span>
        <span className="text-xs font-black sm:text-sm">Chat on WhatsApp</span>
      </span>
      <span className="ml-1 text-base font-black transition-transform group-hover:translate-x-0.5">↗</span>
    </a>
  );
}
