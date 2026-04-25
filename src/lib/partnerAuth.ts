import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { sendSms } from "./notify";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "glimmora-go-dev-secret-change-me"
);

export const PARTNER_COOKIE = "glimmora_partner_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const OTP_TTL_MS = 5 * 60 * 1000;

export type PartnerSession = {
  partnerId: string;
  phone: string;
  shopName: string;
};

export async function createPartnerToken(payload: PartnerSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

async function verifyToken(token: string): Promise<PartnerSession | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as PartnerSession;
  } catch {
    return null;
  }
}

export async function setPartnerCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(PARTNER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearPartnerCookie(): Promise<void> {
  const store = await cookies();
  store.delete(PARTNER_COOKIE);
}

export async function getPartnerSession(): Promise<PartnerSession | null> {
  const store = await cookies();
  const token = store.get(PARTNER_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requirePartner(): Promise<PartnerSession> {
  const session = await getPartnerSession();
  if (!session) redirect("/p/login");
  return session;
}

// Generates a 6-digit OTP and stores it. Returns { code, expiresAt }.
// In dev the code is surfaced to the caller; in prod integrate with MSG91.
export async function issueOtp(phone: string, purpose: "PARTNER_LOGIN") {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  await prisma.otpRequest.create({
    data: { phone, code, purpose, expiresAt },
  });
  await sendSms(
    phone,
    "partner_login_otp",
    `Your Glimmora Go partner login code is ${code}. Expires in 5 minutes.`,
    `otp:${purpose}`
  );
  return { code, expiresAt };
}

export async function verifyOtp(
  phone: string,
  code: string,
  purpose: "PARTNER_LOGIN"
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
