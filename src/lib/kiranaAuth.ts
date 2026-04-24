import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./db";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "glimmora-go-dev-secret-change-me"
);

export const KIRANA_COOKIE = "glimmora_kirana_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const OTP_TTL_MS = 5 * 60 * 1000;

export type KiranaSession = {
  partnerId: string;
  phone: string;
  shopName: string;
};

export async function createKiranaToken(payload: KiranaSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

async function verifyToken(token: string): Promise<KiranaSession | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as KiranaSession;
  } catch {
    return null;
  }
}

export async function setKiranaCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(KIRANA_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearKiranaCookie(): Promise<void> {
  const store = await cookies();
  store.delete(KIRANA_COOKIE);
}

export async function getKiranaSession(): Promise<KiranaSession | null> {
  const store = await cookies();
  const token = store.get(KIRANA_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireKirana(): Promise<KiranaSession> {
  const session = await getKiranaSession();
  if (!session) redirect("/k/login");
  return session;
}

// Generates a 6-digit OTP and stores it. Returns { code, expiresAt }.
// In dev the code is surfaced to the caller; in prod integrate with MSG91.
export async function issueOtp(phone: string, purpose: "KIRANA_LOGIN") {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  await prisma.otpRequest.create({
    data: { phone, code, purpose, expiresAt },
  });
  // TODO: send via MSG91 here in prod
  return { code, expiresAt };
}

export async function verifyOtp(
  phone: string,
  code: string,
  purpose: "KIRANA_LOGIN"
): Promise<boolean> {
  const entry = await prisma.otpRequest.findFirst({
    where: {
      phone,
      code,
      purpose,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!entry) return false;
  await prisma.otpRequest.update({
    where: { id: entry.id },
    data: { usedAt: new Date() },
  });
  return true;
}
