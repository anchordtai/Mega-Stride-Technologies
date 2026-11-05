import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { currentIdentity } from "@/lib/supabase/server";
export async function GET(
  _r: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const i = await currentIdentity();
  if (!i) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/i.test(id))
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { data: t } = await i.db
    .from("transactions")
    .select("*")
    .eq("id", id)
    .eq("user_id", i.user.id)
    .eq("status", "verified")
    .maybeSingle();
  if (!t)
    return NextResponse.json({ error: "Receipt unavailable" }, { status: 404 });
  const doc = await PDFDocument.create();
  const p = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const lines = [
    "MEGA STRIDE TECHNOLOGIES LIMITED",
    t.mode === "test" ? "TEST RECEIPT / NO MONEY COLLECTED" : "PAYMENT RECEIPT",
    `Reference: ${t.reference}`,
    `Amount: ${t.currency} ${(t.amount_minor / 100).toFixed(2)}`,
    `Verified: ${new Date(t.verified_at).toISOString()}`,
    `Provider: Paystack / ${t.provider_event_id}`,
    t.mode === "test"
      ? "Test transactions do not confirm payment or grant course access."
      : "Keep this receipt and reference for support.",
    "https://www.megastride.com.ng/academy/payments",
  ];
  lines.forEach((s, n) =>
    p.drawText(s, {
      x: 45,
      y: 770 - n * 46,
      size: n === 0 ? 18 : 12,
      font,
      color: rgb(0.05, 0.13, 0.25),
      maxWidth: 500,
      lineHeight: 18,
    }),
  );
  return new NextResponse(Buffer.from(await doc.save()), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Mega-Stride-Receipt-${id}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
