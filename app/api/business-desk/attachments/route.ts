import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { intakeDatabase } from "@/lib/supabase/server";
import { permittedRequestOrigin } from "@/lib/enquiry-challenge";
import {
  verifyAttachmentPermit,
  attachmentType,
  boundedUpload,
} from "@/lib/business-desk/attachments";
export async function POST(request: Request) {
  if (!permittedRequestOrigin(request.headers.get("origin")))
    return NextResponse.json({ error: "Request rejected" }, { status: 403 });
  const secret = process.env.RATE_LIMIT_SALT;
  const token = (request.headers.get("authorization") || "").replace(
    /^Bearer /,
    "",
  );
  const enquiry = secret ? verifyAttachmentPermit(token, secret) : null;
  if (!enquiry)
    return NextResponse.json(
      {
        error:
          "Attachment permission expired. Contact the company with your request reference.",
      },
      { status: 403 },
    );
  try {
    const bytes = await boundedUpload(request, 2200000);
    const form = await new Response(bytes, {
      headers: { "Content-Type": request.headers.get("content-type") || "" },
    }).formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size > 2097152) throw Error();
    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = attachmentType(buffer);
    if (!mime || mime !== file.type) throw Error();
    const suffix =
      mime === "application/pdf" ? "pdf" : mime === "image/png" ? "png" : "jpg";
    const path = `${enquiry}/${randomUUID()}.${suffix}`;
    const db = intakeDatabase();
    const reservation = await db.rpc("msbd_attachment_reserve", {
      p_enquiry: enquiry,
      p_path: path,
      p_name: file.name.slice(0, 180),
      p_mime: mime,
      p_size: buffer.length,
    });
    if (reservation.error) throw Error();
    const saved = await db.storage
      .from("business-attachments")
      .upload(path, buffer, { contentType: mime, upsert: false });
    if (saved.error) {
      await db.from("msbd_attachments").delete().eq("id", reservation.data);
      throw Error();
    }
    return NextResponse.json({ saved: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        error:
          "Attachment was not saved. Use PDF, PNG or JPEG files up to 2 MiB, with no more than three per request.",
      },
      { status: 400 },
    );
  }
}
