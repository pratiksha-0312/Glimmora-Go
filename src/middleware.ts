import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "glimmora-go-dev-secret-change-me"
);

const ADMIN_COOKIE = "glimmora_session";
const KIRANA_COOKIE = "glimmora_kirana_session";

const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/track",
  "/api/track",
  "/k/login",
  "/k/signup",
  "/api/kirana/otp",
  "/api/kirana/signup",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function isKiranaPath(pathname: string): boolean {
  return pathname === "/k" || pathname.startsWith("/k/") || pathname.startsWith("/api/kirana");
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

  if (isKiranaPath(pathname)) {
    const token = req.cookies.get(KIRANA_COOKIE)?.value;
    if (!token || !(await verify(token))) {
      const url = req.nextUrl.clone();
      url.pathname = "/k/login";
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
