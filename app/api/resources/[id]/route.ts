import { NextResponse } from "next/server";
import { currentIdentity } from "@/lib/supabase/server";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const i = await currentIdentity();
    if (!i)
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const { id } = await params;
    const { data, error } = await i.db
      .from("resources")
      .select("object_path")
      .eq("id", id)
      .single();
    if (error || !data)
      return NextResponse.json(
        { error: "Resource unavailable." },
        { status: 404 },
      );
    const signed = await i.db.storage
      .from("academy-resources")
      .createSignedUrl(data.object_path, 60, { download: true });
    if (signed.error) throw signed.error;
    return NextResponse.redirect(signed.data.signedUrl, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Resource unavailable." },
      { status: 503 },
    );
  }
}
