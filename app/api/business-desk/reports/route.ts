import { NextResponse } from "next/server";
import { z } from "zod";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { businessIdentity } from "@/lib/business-desk/server";
import { intakeDatabase } from "@/lib/supabase/server";
const money = (value: number, currency: string) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    currencyDisplay: "code",
  }).format(value / 100);
const csv = (v: unknown) => {
  let s = String(v ?? "");
  if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
  return `"${s.replaceAll('"', '""')}"`;
};
export async function GET(request: Request) {
  const i = await businessIdentity();
  if (!i)
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (
    !["super_admin", "admin", "finance", "management"].includes(
      i.businessRole || "",
    )
  )
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  try {
    const q = new URL(request.url).searchParams;
    const { data, error } = await intakeDatabase().rpc("msbd_report", {
      p_actor: i.user.id,
      p_from: q.get("from") ? z.iso.date().parse(q.get("from")) : null,
      p_to: q.get("to") ? z.iso.date().parse(q.get("to")) : null,
      p_client: q.get("client") ? z.uuid().parse(q.get("client")) : null,
      p_category: q.get("category")?.slice(0, 120) || null,
      p_status: q.get("status")?.slice(0, 40) || null,
      p_method: q.get("method")?.slice(0, 40) || null,
      p_staff: q.get("staff") ? z.uuid().parse(q.get("staff")) : null,
    });
    if (error) throw Error();
    if (q.get("format") !== "pdf") {
      const fields = [
        "number",
        "kind",
        "current_status",
        "currency",
        "total_minor",
        "due_date",
        "issued_at",
        "client",
      ];
      const rows = [
        fields.map(csv).join(","),
        ...data.rows.map((r: Record<string, unknown>) =>
          fields.map((k) => csv(r[k])).join(","),
        ),
      ];
      if (data.rows_limited)
        rows.push(csv("Report limited to 5,000 rows; narrow filters."));
      return new Response("\uFEFF" + rows.join("\r\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition":
            "attachment; filename=mega-stride-business-report.csv",
          "Cache-Control": "private, no-store",
        },
      });
    }
    const doc = await PDFDocument.create();
    doc.registerFontkit(fontkit);
    const font = await doc.embedFont(
      await readFile(join(process.cwd(), "public/fonts/manrope-400.ttf")),
      { subset: true },
    );
    let page = doc.addPage(),
      y = 790;
    const line = (text: string, size = 10) => {
      let rest = text.replace(/[\u0000-\u001f\u007f]/g, " ");
      while (rest.length) {
        let n = rest.length;
        while (n > 1 && font.widthOfTextAtSize(rest.slice(0, n), size) > 510)
          n--;
        if (y < 65) {
          page = doc.addPage();
          y = 790;
        }
        page.drawText(rest.slice(0, n), {
          x: 40,
          y,
          size,
          font,
          color: rgb(0.04, 0.12, 0.23),
        });
        rest = rest.slice(n);
        y -= size + 9;
      }
    };
    line("MEGA STRIDE TECHNOLOGIES LIMITED", 16);
    line("BUSINESS MANAGEMENT REPORT", 14);
    line(
      `Generated ${new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" })} WAT`,
      9,
    );
    line("Management report only. Not an invoice or proof of payment.", 9);
    y -= 10;
    for (const row of data.finance || []) {
      line(
        `Confirmed retained payments (${row.currency}): ${money(row.retained_minor || 0, row.currency)}`,
      );
      line(
        `Gross confirmed: ${money(row.gross_confirmed_minor || 0, row.currency)} | Reversed: ${money(row.reversed_minor || 0, row.currency)}`,
        9,
      );
    }
    for (const row of data.receivables || [])
      line(
        `Outstanding (${row.currency}): ${money(row.outstanding_minor || 0, row.currency)} | Issued invoices: ${money(row.invoiced_minor || 0, row.currency)}`,
        9,
      );
    y -= 10;
    for (const row of data.rows || [])
      line(
        `${row.number} | ${row.kind} | ${row.current_status} | ${money(row.total_minor, row.currency)} | ${row.client}`,
        8,
      );
    if (data.rows_limited)
      line(
        "Limited to 5,000 rows. Narrow the date range for a complete export.",
      );
    const pages = doc.getPages();
    pages.forEach((p, n) =>
      p.drawText(`${n + 1}/${pages.length}`, { x: 525, y: 30, size: 8, font }),
    );
    return new Response(Buffer.from(await doc.save()), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          "attachment; filename=mega-stride-business-report.pdf",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Report unavailable. Check your filters." },
      { status: 400 },
    );
  }
}
