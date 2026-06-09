import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { setActiveJornada } from "@/lib/settings";

// Cambia la jornada activa (solo admin).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.is_admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { jornada } = await req.json();
  const n = Number(jornada);
  if (!Number.isInteger(n) || n < 1) {
    return NextResponse.json({ error: "Jornada inválida" }, { status: 400 });
  }

  await setActiveJornada(n);
  return NextResponse.json({ ok: true, activeJornada: n });
}
