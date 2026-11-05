import { NextResponse } from "next/server";
import { currentIdentity } from "@/lib/supabase/server";
function cell(value: unknown) {
  let s = String(value ?? "");
  if (/^[=+@\-\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
export async function GET() {
  try {
    const i = await currentIdentity();
    if (!i || !["admin", "staff"].includes(i.role || ""))
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    const { data, error } = await i.db
      .from("enquiries")
      .select(
        "reference,kind,name,email,company,phone,country,service,status,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw error;
    const keys = [
      "reference",
      "kind",
      "name",
      "email",
      "company",
      "phone",
      "country",
      "service",
      "status",
      "created_at",
    ];
    const csv = [
      keys.map(cell).join(","),
      ...(data || []).map((r) =>
        keys.map((k) => cell(r[k as keyof typeof r])).join(","),
      ),
    ].join("\r\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="mega-stride-enquiries.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Export unavailable." }, { status: 503 });
  }
}
