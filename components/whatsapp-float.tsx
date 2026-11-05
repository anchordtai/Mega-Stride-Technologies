import { company } from "@/lib/company";
// WhatsApp is held until the owner confirms a complete, registered business number.
export default function ContactFloat() {
  return (
    <a
      href={`tel:${company.phone}`}
      aria-label="Call Mega Stride Technologies"
      className="contact-float"
    >
      <span aria-hidden="true">↗</span> Talk to Mega Stride
    </a>
  );
}
