import { NextResponse } from "next/server";
import { readStats } from "@/lib/admin/chain";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
export async function GET() {
  try { return NextResponse.json(await readStats()); }
  catch (e) { return NextResponse.json({ error: String(e).slice(0, 200) }, { status: 502 }); }
}
