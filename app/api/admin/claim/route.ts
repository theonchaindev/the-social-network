import { NextResponse } from "next/server";
import { claimCreator } from "@/lib/admin/chain";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function POST() {
  try { return NextResponse.json(await claimCreator()); }
  catch (e) { return NextResponse.json({ error: String(e).slice(0, 200) }, { status: 502 }); }
}
