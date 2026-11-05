import { requireStaff } from "@/lib/staff";
import { NextResponse } from "next/server";
export async function GET() {
  const i = await requireStaff(["admin", "staff", "instructor"]);
  const { data, error } = await i.db
    .from("enrolments")
    .select("user_id,course_id,status,created_at,courses(title)")
    .limit(5000);
  if (error)
    return NextResponse.json({ error: "Export unavailable" }, { status: 503 });
  const cell = (v: unknown) => {
    let s = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  const rows = [
    ["User ID", "Course ID", "Course", "Status", "Created"],
    ...(data || []).map((e) => [
      e.user_id,
      e.course_id,
      (Array.isArray(e.courses) ? e.courses[0] : e.courses)?.title,
      e.status,
      e.created_at,
    ]),
  ];
  return new NextResponse(rows.map((r) => r.map(cell).join(",")).join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="mega-stride-enrolments.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
