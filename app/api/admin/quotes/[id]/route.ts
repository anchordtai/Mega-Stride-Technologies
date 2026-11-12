import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { currentIdentity } from "@/lib/supabase/server";
import { quotationTotal } from "@/lib/quotation";
const printable = (s: unknown) => String(s ?? "").replace(/[^\x20-\x7E]/g, "?");
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const i = await currentIdentity();
    if (!i || !["admin", "staff"].includes(i.role || ""))
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    const { id } = await params;
    const { data: q, error } = await i.db
      .from("quotations")
      .select("*,enquiries(name,company,reference)")
      .eq("id", id)
      .single();
    if (error || !q)
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    const { items, total } = quotationTotal(q.items);
    if (total !== q.total_minor) throw Error();
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    let page = doc.addPage([595, 842]);
    let y = 790;
    const line = (s: string, size = 11, heavy = false) => {
      if (y < 70) {
        page = doc.addPage([595, 842]);
        y = 790;
      }
      page.drawText(printable(s).slice(0, 110), {
        x: 45,
        y,
        size,
        font: heavy ? bold : font,
        color: rgb(0.04, 0.09, 0.16),
      });
      y -= size + 13;
    };
    line("MEGA STRIDE TECHNOLOGIES LIMITED", 18, true);
    line("Technology. Infrastructure. Trade. Transformation.");
    line(`QUOTATION ${q.number} - ${q.status.toUpperCase()}`, 14, true);
    if (q.status === "draft")
      line("DRAFT - SUBJECT TO MANAGEMENT APPROVAL", 12, true);
    line(`Client: ${q.enquiries?.company || q.enquiries?.name}`);
    line(`Enquiry: ${q.enquiries?.reference}`);
    line(`Valid until: ${q.valid_until}`);
    y -= 15;
    for (const item of items) {
      line(item.description, 11, true);
      line(
        `${item.quantity} x ${q.currency} ${(item.unit_minor / 100).toFixed(2)} = ${q.currency} ${((item.quantity * item.unit_minor) / 100).toFixed(2)}`,
      );
    }
    y -= 15;
    line(`TOTAL: ${q.currency} ${(total / 100).toFixed(2)}`, 15, true);
    line("Scope, taxes and delivery terms must be agreed before acceptance.");
    line("info@megastride.com.ng | +234 707 572 1887 | Abuja, Nigeria");
    const bytes = await doc.save();
    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${q.number}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Quotation unavailable." },
      { status: 503 },
    );
  }
}
