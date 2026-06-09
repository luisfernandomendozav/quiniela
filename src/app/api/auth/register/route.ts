import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql, type User } from "@/lib/db";
import { setSessionCookie, isAdminEmail } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }
  if (String(password).length < 4) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 4 caracteres" }, { status: 400 });
  }

  const emailNorm = String(email).trim().toLowerCase();
  const existing = (await sql`SELECT id FROM quiniela.users WHERE email = ${emailNorm}`) as { id: number }[];
  if (existing.length) {
    return NextResponse.json({ error: "Ese correo ya está registrado" }, { status: 409 });
  }

  const hash = await bcrypt.hash(String(password), 10);
  const admin = isAdminEmail(emailNorm);
  const rows = (await sql`
    INSERT INTO quiniela.users (name, email, password_hash, is_admin)
    VALUES (${String(name).trim()}, ${emailNorm}, ${hash}, ${admin})
    RETURNING id, name, email, is_admin
  `) as User[];

  setSessionCookie(rows[0].id);
  return NextResponse.json({ user: rows[0] });
}
