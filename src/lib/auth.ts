import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import type { AdminRole } from "../../generated/prisma";
import { canAccess, canWrite, type Surface } from "./rbac";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "glimmora-go-dev-secret-change-me"
);

const COOKIE_NAME = "glimmora_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = {
  adminId: string;
  email: string;
  role: AdminRole;
  name: string;
  cityId: string | null;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload) return null;
  return { ...payload, cityId: payload.cityId ?? null };
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;

export async function requireAccess(surface: Surface): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!canAccess(session.role, surface)) redirect("/");
  return session;
}

export function sessionCanWrite(
  session: SessionPayload,
  surface: Surface
): boolean {
  return canWrite(session.role, surface);
}
