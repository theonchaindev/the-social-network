import { NextResponse } from "next/server";
import { chain } from "@/lib/chain";
import { scanHolders, type Holder } from "@/lib/holders";

// The scan is slow and rate-limited, so it must never run per visitor.
export const revalidate = 300;
export const maxDuration = 60;

export type HolderFeed = {
  updatedAt: number;
  token: string;
  mint: string;
  holders: Holder[];
  degraded?: boolean;
};

export async function GET() {
  let holders: Holder[] = [];
  let degraded = false;
  try {
    holders = (await scanHolders()).holders;
  } catch (e) {
    console.error("holder scan failed:", String(e).slice(0, 160));
    degraded = true;
  }
  const feed: HolderFeed = {
    updatedAt: Date.now(),
    token: chain.tokenSymbol,
    mint: chain.tokenMint,
    holders,
    degraded,
  };
  return NextResponse.json(feed, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800" },
  });
}
