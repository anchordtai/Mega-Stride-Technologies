import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { databaseConfig, databaseReady } from "@/lib/supabase/config";
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!databaseReady()) return response;
  const { url, key } = databaseConfig();
  const db = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values, cacheHeaders) => {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(cacheHeaders || {}).forEach(([key, value]) =>
          response.headers.set(key, value),
        );
      },
    },
  });
  await db.auth.getUser();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  matcher: [
    "/account/:path*",
    "/business-desk/:path*",
    "/client-portal/:path*",
    "/api/business-desk/:path*",
    "/academy/dashboard",
    "/academy/register",
    "/academy/payments",
    "/academy/learn/:path*",
    "/admin/:path*",
    "/super-admin/:path*",
    "/instructor/:path*",
    "/api/admin/:path*",
    "/api/resources/:path*",
  ],
};
