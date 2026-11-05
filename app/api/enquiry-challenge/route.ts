import { NextResponse } from "next/server";
import {
  challengeCookie,
  clientAddress,
  issueChallenge,
  permittedRequestOrigin,
  protectionMode,
} from "@/lib/enquiry-challenge";
import { intakeReady } from "@/lib/supabase/config";
export async function POST(request: Request) {
  if (!permittedRequestOrigin(request.headers.get("origin")))
    return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  if (
    !intakeReady() ||
    protectionMode() !== "signed-challenge" ||
    !process.env.RATE_LIMIT_SALT
  )
    return NextResponse.json(
      { error: "Online enquiries are temporarily unavailable." },
      { status: 503 },
    );
  const token = issueChallenge(
    clientAddress(request.headers),
    process.env.RATE_LIMIT_SALT,
  );
  const response = NextResponse.json(
    { token, mode: "signed-challenge" },
    { headers: { "Cache-Control": "private, no-store" } },
  );
  response.cookies.set(challengeCookie, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api",
    maxAge: 1800,
  });
  return response;
}
