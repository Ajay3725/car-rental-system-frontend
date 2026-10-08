import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "auth_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export interface Session {
  userId: number;
  role: "user" | "admin";
  expiresAt: number;
}

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters.");
  }
  return secret;
}

function signature(payload: string): Buffer {
  return createHmac("sha256", sessionSecret()).update(payload).digest();
}

export function createSessionToken(userId: number, role: Session["role"]): string {
  const payload = Buffer.from(
    JSON.stringify({
      userId,
      role,
      expiresAt: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
    })
  ).toString("base64url");
  return `${payload}.${signature(payload).toString("base64url")}`;
}

export function verifySessionToken(token: string | undefined): Session | null {
  if (!token) return null;
  const [payload, encodedSignature, extra] = token.split(".");
  if (!payload || !encodedSignature || extra) return null;

  const expected = signature(payload);
  const supplied = Buffer.from(encodedSignature, "base64url");
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Session;
    if (
      !Number.isInteger(session.userId) ||
      (session.role !== "user" && session.role !== "admin") ||
      !Number.isInteger(session.expiresAt) ||
      session.expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function getSessionFromRequest(request: Request): Session | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  return verifySessionToken(cookie?.slice(SESSION_COOKIE.length + 1));
}

export async function getCurrentSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

export const sessionCookie = {
  name: SESSION_COOKIE,
  maxAge: SESSION_MAX_AGE,
};
