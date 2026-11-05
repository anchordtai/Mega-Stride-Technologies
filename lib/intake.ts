import { z } from "zod";
const field = (max: number) => z.string().trim().max(max).default("");
export const intakeSchema = z
  .object({
    kind: z.enum(["contact", "trade", "quotation", "training"]),
    name: z.string().trim().min(2).max(120),
    email: z.email().max(254),
    company: field(160),
    phone: field(40),
    country: z.string().trim().min(2).max(80),
    service: z.string().trim().min(2).max(120),
    subject: field(180),
    message: z.string().trim().min(15).max(5000),
    product: field(240),
    quantity: field(80),
    destination: field(160),
    timeframe: field(120),
    website: z.string().max(200).default(""),
    consent: z.literal(true),
    turnstileToken: field(2048),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (v.kind === "trade" && (!v.product || !v.quantity || !v.destination))
      ctx.addIssue({
        code: "custom",
        message: "Product, quantity and destination are required.",
      });
  });
export function allowedOrigin(origin: string | null, siteUrl: string) {
  try {
    return (
      Boolean(origin) && new URL(origin!).origin === new URL(siteUrl).origin
    );
  } catch {
    return false;
  }
}
