import Image from "next/image";
export function Icon({ index = 0 }: { index?: number }) {
  const paths = [
    "m9 8-4 4 4 4m6-8 4 4-4 4m-2-11-2 14",
    "M9 3h6v5H9zM2 16h6v5H2zm14 0h6v5h-6zM12 8v4m-7 4v-4h14v4",
    "m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6zM8 12l3 3 5-6",
    "M7 18a5 5 0 0 1-1-10 6 6 0 0 1 11-1 5.5 5.5 0 0 1 1 11M8 15l4-4 4 4m-4-4v10",
    "M3 3h7v7H3zm11 11h7v7h-7zM14 3h7v7h-7zM3 14h7v7H3z",
    "M8 8h8v8H8zM9 2v6m6-6v6M9 16v6m6-6v6M2 9h6m-6 6h6m8-6h6m-6 6h6",
    "m3 7 9-4 9 4v10l-9 4-9-4zm0 0 9 4 9-4m-9 4v10M7 5l10 4",
  ];
  return (
    <svg
      aria-hidden="true"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[index % paths.length]} />
    </svg>
  );
}
export function EditorialImage({
  src,
  alt,
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={`editorial-image ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 767px) 100vw, 55vw"
        priority={priority}
        style={{ objectFit: "cover" }}
      />
    </div>
  );
}
export function SectionHeading({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="editorial-heading">
      <p className="section-kicker">{kicker}</p>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}
export function CTA({
  title = "Your next technology milestone starts here.",
  text = "Tell us where you want to go. Let’s work out how technology can take you there.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section className="closing-cta">
      <div>
        <p className="section-kicker">Let’s build what’s next</p>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      <div className="closing-actions">
        <a href="/quotation" className="primary-button light-button">
          Request a quotation <span aria-hidden="true">↗</span>
        </a>
        <a href="/contact" className="text-link">
          Request a consultation ↗
        </a>
      </div>
    </section>
  );
}
export function FAQ({
  items,
}: {
  items: ReadonlyArray<readonly [string, string]>;
}) {
  return (
    <div className="faq-list">
      {items.map(([q, a]) => (
        <details key={q}>
          <summary>
            {q}
            <span aria-hidden="true">+</span>
          </summary>
          <p>{a}</p>
        </details>
      ))}
    </div>
  );
}
