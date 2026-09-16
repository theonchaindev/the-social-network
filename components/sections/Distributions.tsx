"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { SceneCanvas } from "@/components/three/LazyCanvas";
import { SplitLines } from "@/components/ui/SplitLines";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";
import { useReducedMotion } from "@/hooks/useMediaQuery";
import {
  CLOCK_START,
  DISTRIBUTION_INTERVAL,
  formatAmount,
  formatClock,
  formatUsd,
  nextPayout,
  Payout,
  seedPayouts,
} from "@/lib/distributions";

const PayoutScene = dynamic(() => import("@/components/three/PayoutScene"), {
  ssr: false,
});

const ROWS = 9;
/** Where the running totals start, so the counters are not at zero on load. */
const BASE_DISTRIBUTED = 41_882_140.55;
const BASE_HOLDERS = 184_902;
const BASE_ROUNDS = 6_114;

export function Distributions() {
  const section = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // Seeded, so server and client render the same table and hydration is quiet.
  const [rows, setRows] = useState<Payout[]>(() => seedPayouts(ROWS));
  const clock = useRef(CLOCK_START);
  const [distributed, setDistributed] = useState(BASE_DISTRIBUTED);
  const [paid, setPaid] = useState(BASE_HOLDERS);
  const [countdown, setCountdown] = useState(252);
  const [live, setLive] = useState(false);

  useRevealOnScroll(copy, { stagger: 0.08, start: "top 82%" });

  // Only run the stream while the section is actually on screen.
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setLive(entry.isIntersecting),
      { rootMargin: "120px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!live || reduced) return;

    let timer = 0;

    const tick = () => {
      const gap = 900 + Math.random() * 1700;
      timer = window.setTimeout(() => {
        clock.current += 1 + Math.floor(Math.random() * 4);
        const row = nextPayout(clock.current);
        setRows((prev) => [row, ...prev].slice(0, ROWS));
        setDistributed((d) => d + row.usd);
        setPaid((p) => p + 1);
        tick();
      }, gap);
    };

    tick();
    return () => window.clearTimeout(timer);
  }, [live, reduced]);

  useEffect(() => {
    if (!live || reduced) return;
    const id = window.setInterval(() => {
      setCountdown((c) => (c <= 1 ? DISTRIBUTION_INTERVAL : c - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [live, reduced]);

  const rounds = BASE_ROUNDS + Math.floor((paid - BASE_HOLDERS) / 40);

  const totals = [
    { label: "Distributed to date", value: formatUsd(distributed) },
    { label: "Holder payments", value: paid.toLocaleString("en-US") },
    { label: "Rounds settled", value: rounds.toLocaleString("en-US") },
    { label: "Next round", value: formatClock(countdown).slice(3) },
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
              text="Every fee goes back out."
              className="headline max-w-[15ch] text-[clamp(1.9rem,4.4vw,3.5rem)] text-cold-100"
              start="top 82%"
            />
          </div>
          <p
            data-reveal
            className="max-w-[40ch] text-[15px] leading-relaxed text-cold-300"
          >
            The contract holds nothing. Fees collected on every METAx trade are
            swept on a fixed cadence and sent straight out to holders, pro rata,
            in one batch. Its only job is to empty itself.
          </p>
        </div>

        <div className="grid gap-px overflow-hidden border border-cold-500/20 bg-cold-500/20 lg:grid-cols-[1.05fr_1.35fr]">
          {/* The fan: the contract at the centre, paying outward */}
          <div className="relative min-h-[320px] min-w-0 bg-ink-deep md:min-h-[420px]">
            <SceneCanvas
              className="absolute inset-0 h-full w-full"
              camera={{ position: [0, 0, 8.6], fov: 42 }}
            >
              <PayoutScene />
            </SceneCanvas>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-ink-deep via-ink-deep/70 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-start gap-1 p-5 sm:flex-row sm:items-end sm:justify-between">
              <p className="label text-[10px]">Outbound · live view</p>
              <p className="label text-[10px] text-amber">
                {rows.length ? formatAmount(rows[0].amount) : "0.0000"} METAx
              </p>
            </div>
          </div>

          {/* The ledger */}
          <div className="min-w-0 bg-ink-deep">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-cold-500/20 px-5 py-4">
              <p className="label text-[10px]">Outbound transactions</p>
              <p className="label flex items-center gap-2 text-[10px]">
                <span
                  className="block h-1.5 w-1.5 rounded-full bg-amber"
                  style={{
                    animation:
                      live && !reduced ? "pulse-dot 2s ease-in-out infinite" : undefined,
                  }}
                />
                Simulated feed
              </p>
            </div>

            <div className="min-w-0 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse">
                <caption className="sr-only">
                  Simulated outbound METAx distributions to holder wallets. This
                  is a concept site; these transactions are not real.
                </caption>
                <thead>
                  <tr className="border-b border-cold-500/15">
                    {["Time", "Recipient", "Amount", "Value", "Tx"].map((h) => (
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
                      key={row.id}
                      className="border-b border-cold-500/10 last:border-0"
                      style={{
                        // Capped: any dimmer and the 11px mono drops under the
                        // 4.5:1 contrast floor on this background.
                        opacity: Math.max(0.87, 1 - i * 0.018),
                        animation:
                          i === 0 && live && !reduced
                            ? "row-in 0.7s cubic-bezier(0.16,1,0.3,1)"
                            : undefined,
                      }}
                    >
                      <td className="px-5 py-3 font-mono text-[11px] text-cold-350">
                        {formatClock(row.clock)}
                      </td>
                      <td
                        className={`px-5 py-3 font-mono text-[11px] ${
                          i === 0 ? "text-cold-100" : "text-cold-200"
                        }`}
                      >
                        {row.wallet}
                      </td>
                      <td className="px-5 py-3 font-mono text-[11px] tabular-nums text-amber">
                        {formatAmount(row.amount)}
                      </td>
                      <td className="px-5 py-3 font-mono text-[11px] tabular-nums text-cold-200">
                        {formatUsd(row.usd)}
                      </td>
                      <td className="px-5 py-3 font-mono text-[11px] text-cold-350">
                        {row.hash}
                      </td>
                    </tr>
                  ))}
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
          Illustrative. No transaction shown here has taken place.
        </p>
      </div>

      <style>{`
        @keyframes row-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: none; }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes row-in { from { opacity: 1; } to { opacity: 1; } }
          @keyframes pulse-dot { 0%, 100% { opacity: 1; } }
        }
      `}</style>
    </section>
  );
}
