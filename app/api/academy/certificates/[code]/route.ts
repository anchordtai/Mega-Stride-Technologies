import { NextResponse } from "next/server";
import { certificatePdf } from "@/lib/academy-pdf";
import { currentIdentity } from "@/lib/supabase/server";
export async function GET(
  _r: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const i = await currentIdentity();
  if (!i) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  const { code } = await params;
  if (!/^[a-f0-9]{32}$/.test(code))
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { data: c } = await i.db
    .from("certificates")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  if (!c || c.revoked_at)
    return NextResponse.json(
      { error: "Certificate unavailable" },
      { status: 404 },
    );
  return new NextResponse(Buffer.from(await certificatePdf(c)), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Mega-Stride-Certificate-${code}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
