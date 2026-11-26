import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // A preceding protected-page GET already refreshed the cookie. Avoid a second
  // Auth network call for Server Action POST requests; the action/RPC validates it.
  if (request.method !== "GET" && request.method !== "HEAD") return NextResponse.next({ request });
  return updateSession(request);
}

export const config = {
  // Public pages do not need an Auth round-trip. Refresh only protected areas.
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
