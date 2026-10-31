import { NextResponse, type NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import type { SessionData } from "@/lib/session";

const publicPaths = ["/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    // Allow through so pages can show a config error; login still works after env set
    if (pathname === "/login") return NextResponse.next();
  }

  const res = NextResponse.next();
  if (!password || password.length < 32) {
    if (pathname !== "/login") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return res;
  }

  const session = await getIronSession<SessionData>(request, res, {
    password,
    cookieName: "chana_oms_session",
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  });

  const isPublic = publicPaths.some((p) => pathname === p);
  const loggedIn = Boolean(session.isLoggedIn && session.userId);

  if (!loggedIn && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (loggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/orders", request.url));
  }
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(loggedIn ? "/orders" : "/login", request.url),
    );
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
