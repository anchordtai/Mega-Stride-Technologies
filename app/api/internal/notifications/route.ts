import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { deliverBusinessNotifications } from "@/lib/business-desk/notifications";
import { deliverNotifications } from "@/lib/notifications";
export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  const supplied = request.headers.get("authorization") || "";
  if (
    !expected ||
    Buffer.byteLength(supplied) !== Buffer.byteLength(`Bearer ${expected}`) ||
    !timingSafeEqual(Buffer.from(supplied), Buffer.from(`Bearer ${expected}`))
  )
    return NextResponse.json({ error: "Access denied." }, { status: 401 });
  try {
    const [website,business]=await Promise.all([deliverNotifications(),deliverBusinessNotifications()]);
    return NextResponse.json({website,business}, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Notification queue unavailable." },
      { status: 503 },
    );
  }
}

export const GET = POST;
export const maxDuration = 60;
