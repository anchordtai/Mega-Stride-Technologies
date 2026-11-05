import { company } from "@/lib/company";
// WhatsApp is held until the owner confirms a complete, registered business number.
export default function ContactFloat() {
  return (
    <a
      href={`tel:${company.phone}`}
      aria-label="Call Mega Stride Technologies"
      className="fixed bottom-5 right-5 z-40 rounded-full border border-white/60 bg-blue-700 px-5 py-4 text-sm font-bold text-white shadow-lg"
    >
      Call Mega Stride
    </a>
  );
}
