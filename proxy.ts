import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "rh_session";
const SESSION_VALUE = "autenticado_rh";

export function proxy(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE);

  if (!session || session.value !== SESSION_VALUE) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
