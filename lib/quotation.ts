import { z } from "zod";
export const quoteItems = z
  .array(
    z
      .object({
        description: z.string().trim().min(2).max(180),
        quantity: z.number().int().min(1).max(100000),
        unit_minor: z.number().int().min(0).max(1000000000),
      })
      .strict(),
  )
  .min(1)
  .max(50);
export function quotationTotal(input: unknown) {
  const items = quoteItems.parse(input);
  const total = items.reduce((sum, i) => sum + i.quantity * i.unit_minor, 0);
  if (!Number.isSafeInteger(total) || total > 10000000000000)
    throw Error("Quotation total is too large.");
  return { items, total };
}
