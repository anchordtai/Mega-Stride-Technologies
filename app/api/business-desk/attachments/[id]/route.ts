import { NextResponse } from "next/server";
import { z } from "zod";
import { businessIdentity } from "@/lib/business-desk/server";
import { intakeDatabase } from "@/lib/supabase/server";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const i = await businessIdentity();
  if (!i)
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success)
    return NextResponse.json({ error: "Unavailable" }, { status: 404 });
  const record = await i.db
    .from("msbd_attachments")
    .select("object_path,name,mime")
    .eq("id", id)
    .maybeSingle();
  if (record.error || !record.data)
    return NextResponse.json({ error: "Unavailable" }, { status: 404 });
  const { data, error } = await intakeDatabase()
    .storage.from("business-attachments")
    .download(record.data.object_path);
  if (error || !data)
    return NextResponse.json({ error: "Unavailable" }, { status: 404 });
  return new Response(await data.arrayBuffer(), {
    headers: {
      "Content-Type": record.data.mime,
      "Content-Disposition": `attachment; filename="${record.data.name.replace(/[^a-zA-Z0-9._-]/g, "_")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
