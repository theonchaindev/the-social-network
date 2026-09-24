import { NextResponse } from "next/server";
import { SESSION_COOKIE, cookieOptions, passwordMatches, signSession } from "@/lib/admin/auth";

export async function POST(req: Request) {
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  if (!password || !passwordMatches(password)) {
    // Same delay either way; do not tell an attacker which branch they hit.
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ error: "wrong password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await signSession(), cookieOptions);
  return res;
}
