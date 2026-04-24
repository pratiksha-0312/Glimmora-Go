import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "glimmora-go-dev-secret-change-me"
);

const ADMIN_COOKIE = "glimmora_session";
const PARTNER_COOKIE = "glimmora_partner_session";

const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/track",
  "/api/track",
  "/p/login",
  "/p/signup",
  "/api/partner/otp",
  "/api/partner/signup",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function isPartnerPath(pathname: string): boolean {
  // /p (partner PWA) + /api/partner/ — NOT /api/partners (admin CRUD for partner
  // records). The trailing slash on /api/partner/ keeps them separate.
  return (
    pathname === "/p" ||
    pathname.startsWith("/p/") ||
    pathname === "/api/partner" ||
    pathname.startsWith("/api/partner/")
  );
}

async function verify(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  if (isPartnerPath(pathname)) {
    const token = req.cookies.get(PARTNER_COOKIE)?.value;
    if (!token || !(await verify(token))) {
      const url = req.nextUrl.clone();
      url.pathname = "/p/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Admin routes
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!token || !(await verify(token))) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Let PWA shell files, icons, and image assets bypass auth entirely —
    // the service worker and manifest must be reachable without a session.
    "/((?!_next/static|_next/image|favicon\\.ico|manifest\\.webmanifest|sw\\.js|offline\\.html|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
