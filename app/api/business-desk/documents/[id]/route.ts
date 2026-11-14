import { NextResponse } from "next/server";
import { intakeDatabase } from "@/lib/supabase/server";
import { z } from "zod";
import {
  businessIdentity,
  type BusinessDocument,
} from "@/lib/business-desk/server";
import { documentBytes } from "@/lib/business-desk/pdf";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const i = await businessIdentity();
    if (!i)
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    const { id } = await params;
    if (!z.uuid().safeParse(id).success)
      return NextResponse.json(
        { error: "Document unavailable" },
        { status: 404 },
      );
    const { data, error } = await i.db
      .from("msbd_documents")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data)
      return NextResponse.json(
        { error: "Document unavailable" },
        { status: 404 },
      );
    const settings = data.issued_at
      ? null
      : await i.db.from("msbd_settings").select("profile").single();
    const bytes = await documentBytes(
      data as BusinessDocument,
      settings?.data?.profile,
    );
    if (data.issued_at) {
      const viewed = await intakeDatabase().rpc("msbd_record_view", {
        p_actor: i.user.id,
        p_document: id,
      });
      if (viewed.error) throw Error("Document access could not be recorded");
    }
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${new URL(request.url).searchParams.get("view") === "inline" ? "inline" : "attachment"}; filename="${String(data.number).replace(/[^A-Za-z0-9-]/g, "-")}.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Document unavailable. Please retry or contact the company." },
      { status: 503 },
    );
  }
}
