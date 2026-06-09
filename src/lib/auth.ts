import { cookies } from "next/headers";
import crypto from "node:crypto";
import { sql, type User } from "./db";

const SECRET = process.env.SESSION_SECRET || "dev-secret";
const COOKIE = "quiniela_session";

// Crea un token firmado (HMAC) con el id de usuario. Formato: payload.signature
export function signSession(userId: number): string {
  const payload = Buffer.from(JSON.stringify({ uid: userId, t: Date.now() })).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verifySession(token: string): number | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof data.uid === "number" ? data.uid : null;
  } catch {
    return null;
  }
}

export function setSessionCookie(userId: number) {
  cookies().set(COOKIE, signSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 días
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE);
}

// Devuelve el usuario autenticado o null leyendo la cookie de sesión.
export async function getCurrentUser(): Promise<User | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  const uid = verifySession(token);
  if (!uid) return null;
  const rows = (await sql`
    SELECT id, name, email, is_admin FROM quiniela.users WHERE id = ${uid}
  `) as User[];
  return rows[0] ?? null;
}

export function isAdminEmail(email: string): boolean {
  const list = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}
