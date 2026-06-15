import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { setPredictionsLocked } from "@/lib/settings";

// Activa o desactiva el candado global de pronósticos (solo admin).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.is_admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { locked } = await req.json();
  if (typeof locked !== "boolean") {
    return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
  }

  await setPredictionsLocked(locked);
  return NextResponse.json({ ok: true, locked });
}
