import { Connection, PublicKey } from "@solana/web3.js";
import { NextResponse } from "next/server";
import { chain, type PayoutFeed, type PayoutRow } from "@/lib/chain";

// Cached: the free RPC throttles per method, so this must not run per visitor.
export const revalidate = 120;
export const maxDuration = 30;

const MAX_TXS = 14;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function metaxUsd(): Promise<number | null> {
  try {
    const r = await fetch(`https://lite-api.jup.ag/price/v3?ids=${chain.metaxMint}`, {
      next: { revalidate: 120 },
    });
    const d = await r.json();
    return Number(d?.[chain.metaxMint]?.usdPrice) || null;
  } catch {
    return null;
  }
}

/**
 * Every transaction in which the payout wallet's METAx balance went DOWN is a
 * payout round; every other owner whose METAx went UP in that transaction is
 * a recipient. Reading balance deltas rather than instructions keeps this
 * independent of transaction version and of how the transfer was batched.
 */
async function readPayouts(): Promise<PayoutRow[]> {
  const conn = new Connection(chain.rpcUrl, "confirmed");
  const wallet = new PublicKey(chain.payoutWallet);
  const sigs = await conn.getSignaturesForAddress(wallet, { limit: MAX_TXS }, "confirmed");
  const rows: PayoutRow[] = [];

  for (const sig of sigs) {
    if (sig.err) continue;
    let tx = null;
    for (let attempt = 0; attempt < 4 && !tx; attempt++) {
      try {
        tx = await conn.getParsedTransaction(sig.signature, {
          maxSupportedTransactionVersion: 1,
          commitment: "confirmed",
        });
      } catch (e) {
        if (!/429/.test(String(e))) break;
        await sleep(600 * 2 ** attempt);
      }
    }
    if (!tx?.meta) continue;

    const pre = new Map<string, { raw: bigint; ui: number }>();
    for (const b of tx.meta.preTokenBalances ?? []) {
      if (b.mint !== chain.metaxMint || !b.owner) continue;
      pre.set(b.owner, { raw: BigInt(b.uiTokenAmount.amount), ui: b.uiTokenAmount.uiAmount ?? 0 });
    }
    const deltas = new Map<string, { raw: bigint; ui: number }>();
    for (const b of tx.meta.postTokenBalances ?? []) {
      if (b.mint !== chain.metaxMint || !b.owner) continue;
      const before = pre.get(b.owner) ?? { raw: BigInt(0), ui: 0 };
      deltas.set(b.owner, {
        raw: BigInt(b.uiTokenAmount.amount) - before.raw,
        ui: (b.uiTokenAmount.uiAmount ?? 0) - before.ui,
      });
    }

    const sent = deltas.get(chain.payoutWallet);
    if (!sent || sent.raw >= BigInt(0)) continue; // a claim in, not a payout out

    for (const [owner, d] of deltas) {
      if (owner === chain.payoutWallet || d.raw <= BigInt(0)) continue;
      rows.push({
        signature: sig.signature,
        blockTime: sig.blockTime ?? 0,
        recipient: owner,
        amountRaw: d.raw.toString(),
        amountUi: Number(d.ui.toFixed(8)),
      });
    }
    await sleep(150);
  }

  return rows.sort((a, b) => b.blockTime - a.blockTime);
}

export async function GET() {
  // The free RPC can refuse a whole call. Serve an empty feed rather than fail
  // the build or a revalidation; the client shows "feed unavailable" and retries.
  let rows: PayoutRow[] = [];
  let degraded = false;
  const [read, usd] = await Promise.all([
    readPayouts().catch((e) => {
      console.error("payout feed read failed:", String(e).slice(0, 160));
      degraded = true;
      return [] as PayoutRow[];
    }),
    metaxUsd(),
  ]);
  rows = read;
  const distributedUi = rows.reduce((s, r) => s + r.amountUi, 0);
  const feed: PayoutFeed = {
    updatedAt: Date.now(),
    degraded,
    metaxUsd: usd,
    payoutWallet: chain.payoutWallet,
    rows,
    totals: {
      distributedUi,
      distributedUsd: usd ? distributedUi * usd : null,
      payments: rows.length,
      rounds: new Set(rows.map((r) => r.signature)).size,
      lastRoundAt: rows[0]?.blockTime ?? null,
    },
  };
  return NextResponse.json(feed, {
    headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" },
  });
}
