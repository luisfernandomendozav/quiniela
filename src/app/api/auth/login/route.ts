import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Correo y contraseña requeridos" }, { status: 400 });
  }

  const emailNorm = String(email).trim().toLowerCase();
  const rows = (await sql`
    SELECT id, password_hash FROM quiniela.users WHERE email = ${emailNorm}
  `) as { id: number; password_hash: string }[];

  if (!rows.length) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }
  const ok = await bcrypt.compare(String(password), rows[0].password_hash);
  if (!ok) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  setSessionCookie(rows[0].id);
  return NextResponse.json({ ok: true });
}
