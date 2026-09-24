import { NextResponse } from "next/server";
import { distribute } from "@/lib/admin/chain";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { min?: number };
  try { return NextResponse.json(await distribute(body.min)); }
  catch (e) { return NextResponse.json({ error: String(e).slice(0, 200) }, { status: 502 }); }
}
