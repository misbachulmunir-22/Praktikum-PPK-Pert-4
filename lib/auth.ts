import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "session_token";
const BALANCE_PREF_COOKIE = "show_balance";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(":");
    if (!salt || !hash) return false;
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return hash === verifyHash;
  } catch {
    return false;
  }
}

export async function createSession(userId: number) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { token } }).catch(() => {});
    }
    return null;
  }

  return session.user;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.delete({ where: { token } }).catch(() => {});
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
}

export async function getPreferences() {
  const cookieStore = await cookies();
  const showBalanceVal = cookieStore.get(BALANCE_PREF_COOKIE)?.value;
  return {
    showBalance: showBalanceVal !== "false", // default to true
  };
}

export async function setPreference(key: string, value: string) {
  const cookieStore = await cookies();
  cookieStore.set(key, value, {
    httpOnly: false, // accessible via JS if needed
    path: "/",
    maxAge: 365 * 24 * 60 * 60, // 1 year
  });
}
