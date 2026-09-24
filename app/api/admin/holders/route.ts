import { NextResponse } from "next/server";
import { scanHolders } from "@/lib/admin/chain";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET() {
  try { return NextResponse.json(await scanHolders()); }
  catch (e) { return NextResponse.json({ error: String(e).slice(0, 200) }, { status: 502 }); }
}
