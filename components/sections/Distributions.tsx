"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { SceneCanvas } from "@/components/three/LazyCanvas";
import { SplitLines } from "@/components/ui/SplitLines";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";
import { useReducedMotion } from "@/hooks/useMediaQuery";
import { chain, type PayoutFeed } from "@/lib/chain";
import { formatAmount, formatTime, formatUsd, shortAddress } from "@/lib/distributions";

const PayoutScene = dynamic(() => import("@/components/three/PayoutScene"), {
  ssr: false,
});

const ROWS = 9;
const POLL_MS = 60_000;

export function Distributions() {
  const section = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // Nothing is rendered from data on the server: the feed is fetched after
  // mount, so the first paint is identical on both sides and hydration is quiet.
  const [feed, setFeed] = useState<PayoutFeed | null>(null);
  const [error, setError] = useState(false);
  const [live, setLive] = useState(false);

  useRevealOnScroll(copy, { stagger: 0.08, start: "top 82%" });

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setLive(entry.isIntersecting),
      { rootMargin: "240px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    const load = async () => {
      try {
        const r = await fetch("/api/payouts", { cache: "no-store" });
        if (!r.ok) throw new Error(String(r.status));
        const data = (await r.json()) as PayoutFeed;
        if (!cancelled) {
          setFeed(data);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
      if (!cancelled && live) timer = window.setTimeout(load, POLL_MS);
    };
    void load();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [live]);

  const rows = feed?.rows.slice(0, ROWS) ?? [];
  const usd = feed?.metaxUsd ?? null;
  const t = feed?.totals;

  const totals = [
    {
      label: "Distributed to date",
      value: t ? (t.distributedUsd != null ? formatUsd(t.distributedUsd) : `${formatAmount(t.distributedUi)} METAx`) : "—",
    },
    { label: "Holder payments", value: t ? t.payments.toLocaleString("en-US") : "—" },
    { label: "Rounds settled", value: t ? t.rounds.toLocaleString("en-US") : "—" },
    {
      label: "Last round",
      value: t?.lastRoundAt ? `${formatTime(t.lastRoundAt)} UTC` : "—",
    },
  ];

  return (
    <section
      ref={section}
      id="distributions"
      className="relative overflow-hidden border-t border-cold-500/15 bg-ink-deep py-24 md:py-32"
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-12">
        <div ref={copy} className="mb-12 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="label mb-6">Distributions</p>
            <SplitLines
              as="h2"
              text="Seventy percent goes back out."
              className="headline max-w-[15ch] text-[clamp(1.9rem,4.4vw,3.5rem)] text-cold-100"
              start="top 82%"
            />
          </div>
          <p
            data-reveal
            className="max-w-[40ch] text-[15px] leading-relaxed text-cold-300"
          >
            Every trade pays 2%. The program splits it on-chain: 70% to the
            payout wallet, which is emptied to holders pro rata in Meta stock,
            30% to the team. Nothing here is a promise — every row below is a
            transaction you can open.
          </p>
        </div>

        <div className="grid gap-px overflow-hidden border border-cold-500/20 bg-cold-500/20 lg:grid-cols-[1.05fr_1.35fr]">
          {/* The fan: the payout wallet at the centre, paying outward */}
          <div className="relative min-h-[320px] min-w-0 bg-ink-deep md:min-h-[420px]">
            <SceneCanvas
              className="absolute inset-0 h-full w-full"
              camera={{ position: [0, 0, 8.6], fov: 42 }}
            >
              <PayoutScene />
            </SceneCanvas>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-ink-deep via-ink-deep/70 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-start gap-1 p-5 sm:flex-row sm:items-end sm:justify-between">
              <p className="label text-[10px]">Outbound · {chain.tokenSymbol} holders</p>
              <p className="label text-[10px] text-amber">
                {rows[0] ? `${formatAmount(rows[0].amountUi)} METAx` : "awaiting first round"}
              </p>
            </div>
          </div>

          {/* The ledger */}
          <div className="min-w-0 bg-ink-deep">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-cold-500/20 px-5 py-4">
              <p className="label text-[10px]">Outbound transactions</p>
              <a
                href={`https://solscan.io/account/${chain.payoutWallet}`}
                target="_blank"
                rel="noopener noreferrer"
                className="label flex items-center gap-2 text-[10px] transition-colors duration-500 hover:text-amber"
              >
                <span
                  className="block h-1.5 w-1.5 rounded-full bg-amber"
                  style={{
                    animation:
                      live && !reduced && feed ? "pulse-dot 2s ease-in-out infinite" : undefined,
                  }}
                />
                On-chain · payout wallet {shortAddress(chain.payoutWallet)}
              </a>
            </div>

            <div className="min-w-0 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse">
                <caption className="sr-only">
                  Outbound Meta xStock distributions from the payout wallet to
                  {chain.tokenSymbol} holders, read from the Solana blockchain.
                </caption>
                <thead>
                  <tr className="border-b border-cold-500/15">
                    {["Time (UTC)", "Recipient", "METAx", "Value", "Tx"].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        className="label px-5 py-3 text-left text-[9px] font-normal"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={`${row.signature}-${row.recipient}`}
                      className="border-b border-cold-500/10 last:border-0"
                      style={{ opacity: Math.max(0.87, 1 - i * 0.018) }}
                    >
                      <td className="px-5 py-3 font-mono text-[11px] text-cold-350">
                        {formatTime(row.blockTime)}
                      </td>
                      <td className={`px-5 py-3 font-mono text-[11px] ${i === 0 ? "text-cold-100" : "text-cold-200"}`}>
                        <a
                          href={`https://solscan.io/account/${row.recipient}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="transition-colors duration-500 hover:text-amber"
                        >
                          {shortAddress(row.recipient)}
                        </a>
                      </td>
                      <td className="px-5 py-3 font-mono text-[11px] tabular-nums text-amber">
                        {formatAmount(row.amountUi)}
                      </td>
                      <td className="px-5 py-3 font-mono text-[11px] tabular-nums text-cold-200">
                        {usd ? formatUsd(row.amountUi * usd) : "—"}
                      </td>
                      <td className="px-5 py-3 font-mono text-[11px] text-cold-350">
                        <a
                          href={`https://solscan.io/tx/${row.signature}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="transition-colors duration-500 hover:text-amber"
                        >
                          {row.signature.slice(0, 8)}…
                        </a>
                      </td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center font-mono text-[11px] text-cold-350">
                        {error || feed?.degraded
                          ? "Feed unavailable — the chain is still the record. Try again shortly."
                          : feed
                            ? "No payouts yet. The first round settles once the pool has fees and holders."
                            : "Reading the chain…"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <dl className="mt-px grid grid-cols-2 gap-px bg-cold-500/20 lg:grid-cols-4">
          {totals.map((total) => (
            <div key={total.label} className="bg-ink-deep px-5 py-6">
              <dt className="label mb-3 text-[10px]">{total.label}</dt>
              <dd className="font-mono text-[clamp(1rem,1.7vw,1.4rem)] tabular-nums text-cold-100">
                {total.value}
              </dd>
            </div>
          ))}
        </dl>

        <p className="label mt-6 text-[10px] text-cold-350">
          Live from Solana mainnet, refreshed every two minutes. {chain.tokenSymbol} is a
          rehearsal token; amounts are small by design.
        </p>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes pulse-dot { 0%, 100% { opacity: 1; } }
        }
      `}</style>
    </section>
  );
}
