import { NextResponse } from "next/server";
import { z } from "zod";
export function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  return NextResponse.redirect(
    new URL(
      z.uuid().safeParse(token).success
        ? `/document/verify/${token}`
        : "/document/verify",
      url.origin,
    ),
  );
}
