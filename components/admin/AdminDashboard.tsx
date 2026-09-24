"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PayoutFeed } from "@/lib/chain";
import { formatAmount, formatTime, formatUsd, shortAddress } from "@/lib/distributions";

type Stats = {
  signerConfigured: boolean;
  wallets: { payout: WalletStat; dev: WalletStat };
  pool: {
    address: string; token: string; quoteInCurve: number; progress: number; migrated: boolean;
    creatorUnclaimed: number; creatorClaimed: number; partnerUnclaimed: number; partnerClaimed: number;
  };
};
type WalletStat = { address: string; sol: number; metax: number };
type Holder = { owner: string; balance: number; share: number };

const Card = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="bg-ink-deep px-5 py-6">
    <p className="label mb-3 text-[10px]">{label}</p>
    <p className="font-mono text-[clamp(1rem,1.6vw,1.35rem)] tabular-nums text-cold-100">{value}</p>
    {sub && <p className="label mt-2 text-[10px] text-cold-350">{sub}</p>}
  </div>
);

export function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [feed, setFeed] = useState<PayoutFeed | null>(null);
  const [holders, setHolders] = useState<Holder[] | null>(null);
  const [holdersBusy, setHoldersBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const say = (line: string) => setLog((l) => [...l, `${new Date().toISOString().slice(11, 19)}  ${line}`]);

  const loadStats = useCallback(async () => {
    const [s, f] = await Promise.all([fetch("/api/admin/stats", { cache: "no-store" }), fetch("/api/payouts", { cache: "no-store" })]);
    if (s.status === 401) return router.replace("/admin/login");
    if (!s.ok) { setError((await s.json()).error ?? "stats failed"); return; }
    setStats(await s.json());
    if (f.ok) setFeed(await f.json());
  }, [router]);

  const loadHolders = useCallback(async () => {
    setHoldersBusy(true);
    try {
      const r = await fetch("/api/admin/holders", { cache: "no-store" });
      if (r.ok) setHolders((await r.json()).holders);
      else say(`holders: ${(await r.json()).error}`);
    } finally {
      setHoldersBusy(false);
    }
  }, []);

  // Fetch-on-mount. The compiler lint cannot see the awaits inside loadStats
  // and reads its state updates as synchronous; they run after the network.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadStats(); }, [loadStats]);

  const runRound = async () => {
    if (running) return;
    if (!confirm("Claim the creator stream and pay it out to every holder now?")) return;
    setRunning(true);
    setLog([]);
    try {
      say("claiming creator fees…");
      const c = await fetch("/api/admin/claim", { method: "POST" });
      const cj = await c.json();
      if (!c.ok) throw new Error(cj.error);
      say(cj.signature ? `claimed ${formatAmount(cj.claimed)} METAx  ${cj.signature.slice(0, 12)}…` : "nothing to claim");

      say("snapshotting holders and paying out (the free RPC makes this slow)…");
      const d = await fetch("/api/admin/distribute", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      const dj = await d.json();
      if (!d.ok) throw new Error(dj.error);
      if (!dj.paid?.length) say(`pot ${formatAmount(dj.pot)} METAx — nobody eligible (${dj.holders ?? 0} holders, ${dj.belowFloor ?? 0} below floor)`);
      for (const p of dj.paid) say(`paid ${shortAddress(p.owner)}  ${formatAmount(p.amount)} METAx  ${p.signature.slice(0, 12)}…`);
      for (const s of dj.skipped ?? []) say(`skipped ${shortAddress(s.owner)}: ${s.reason}`);
      say(`round complete · ${dj.paid?.length ?? 0} paid`);
      await loadStats();
      setHolders(null);
    } catch (e) {
      say(`failed: ${String(e)}`);
    } finally {
      setRunning(false);
    }
  };

  const usd = feed?.metaxUsd ?? null;
  const money = (m: number) => `${formatAmount(m)} METAx${usd ? ` · ${formatUsd(m * usd)}` : ""}`;
  const p = stats?.pool;
  const rounds = feed && !feed.degraded ? Array.from(new Map(feed.rows.map((r) => [r.signature, r])).values()) : [];

  return (
    <main className="min-h-screen bg-ink-deep text-cold-100">
      <div className="mx-auto max-w-[1400px] px-6 py-12 md:px-12 md:py-16">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-cold-500/20 pb-8">
          <div>
            <p className="label mb-4">
              <Link href="/" className="transition-colors duration-500 hover:text-amber">← Site</Link>
              <span className="mx-3 text-cold-500">·</span>Admin
            </p>
            <h1 className="headline text-[clamp(1.8rem,4vw,3rem)]">{p?.token ?? "…"} · operations</h1>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => { void loadStats(); }} className="label border border-cold-500/40 px-4 py-2.5 text-[10px] transition-colors duration-500 hover:border-amber hover:text-amber">Refresh</button>
            <button type="button" onClick={async () => { await fetch("/api/admin/logout", { method: "POST" }); router.replace("/admin/login"); }} className="label border border-cold-500/40 px-4 py-2.5 text-[10px] transition-colors duration-500 hover:border-amber hover:text-amber">Sign out</button>
          </div>
        </header>

        {error && <p className="mb-8 border border-amber/50 p-4 font-mono text-[12px] text-amber" role="alert">{error}</p>}

        {/* Wallets */}
        <section className="mb-10">
          <p className="label mb-4">Wallets</p>
          <div className="grid gap-px bg-cold-500/20 sm:grid-cols-2 lg:grid-cols-4">
            <Card label="Payout wallet · METAx" value={stats ? money(stats.wallets.payout.metax) : "—"} sub="holders' money, awaiting a round" />
            <Card label="Payout wallet · SOL" value={stats ? `${stats.wallets.payout.sol.toFixed(4)} SOL` : "—"} sub="pays its own fees and rent" />
            <Card label="Dev wallet · METAx" value={stats ? money(stats.wallets.dev.metax) : "—"} sub="the 30% stream, yours" />
            <Card label="Dev wallet · SOL" value={stats ? `${stats.wallets.dev.sol.toFixed(4)} SOL` : "—"} sub={stats ? shortAddress(stats.wallets.dev.address) : ""} />
          </div>
        </section>

        {/* Pool */}
        <section className="mb-10">
          <p className="label mb-4">Pool · {p ? shortAddress(p.address) : "…"}</p>
          <div className="grid gap-px bg-cold-500/20 sm:grid-cols-2 lg:grid-cols-4">
            <Card label="In the curve" value={p ? money(p.quoteInCurve) : "—"} sub={p ? `${(p.progress * 100).toFixed(2)}% to graduation${p.migrated ? " · migrated" : ""}` : ""} />
            <Card label="Creator fees unclaimed (70%)" value={p ? money(p.creatorUnclaimed) : "—"} sub={p ? `claimed to date ${formatAmount(p.creatorClaimed)}` : ""} />
            <Card label="Partner fees unclaimed (30%)" value={p ? money(p.partnerUnclaimed) : "—"} sub="claimed locally, not from here" />
            <Card
              label="Paid to holders to date"
              value={feed && !feed.degraded ? (feed.totals.distributedUsd != null ? formatUsd(feed.totals.distributedUsd) : `${formatAmount(feed.totals.distributedUi)} METAx`) : "—"}
              sub={feed?.degraded ? "feed read failed on the RPC — refresh" : feed ? `${feed.totals.rounds} rounds · ${feed.totals.payments} payments` : ""}
            />
          </div>
        </section>

        {/* Run */}
        <section className="mb-10 grid gap-px bg-cold-500/20 lg:grid-cols-[1fr_1.4fr]">
          <div className="bg-ink-deep p-6">
            <p className="label mb-4">Payout round</p>
            <p className="mb-6 text-[13px] leading-relaxed text-cold-300">
              Claims the creator stream into the payout wallet, snapshots every holder, and sends the
              whole balance out pro rata in METAx. One confirmation, then it runs.
            </p>
            {stats && !stats.signerConfigured ? (
              <p className="border border-cold-500/40 p-4 font-mono text-[11px] text-cold-350">
                Read-only: the payout wallet&rsquo;s signer is not configured on this server.
              </p>
            ) : (
              <button
                type="button"
                onClick={runRound}
                disabled={running || !stats}
                className="w-full bg-amber px-5 py-4 text-[12px] font-medium uppercase tracking-[0.1em] text-ink-deep transition-colors duration-500 hover:bg-amber-soft disabled:opacity-60"
              >
                {running ? "Running…" : "Run payout round"}
              </button>
            )}
          </div>
          <div className="bg-ink-deep p-6">
            <p className="label mb-4">Log</p>
            <pre className="min-h-[9rem] whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-cold-200">
              {log.length ? log.join("\n") : "—"}
            </pre>
          </div>
        </section>

        {/* Holders */}
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <p className="label">Holders {holders ? `· ${holders.length}` : ""}</p>
            <button type="button" onClick={() => { void loadHolders(); }} disabled={holdersBusy} className="label border border-cold-500/40 px-4 py-2.5 text-[10px] transition-colors duration-500 hover:border-amber hover:text-amber disabled:opacity-60">
              {holdersBusy ? "Scanning chain…" : holders ? "Rescan" : "Load holders"}
            </button>
          </div>
          <div className="overflow-x-auto border border-cold-500/20">
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr className="border-b border-cold-500/15">
                  {["Holder", `${p?.token ?? "Token"} balance`, "Share", "Would receive now"].map((h) => (
                    <th key={h} scope="col" className="label px-5 py-3 text-left text-[9px] font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(holders ?? []).map((h) => (
                  <tr key={h.owner} className="border-b border-cold-500/10 last:border-0">
                    <td className="px-5 py-3 font-mono text-[11px] text-cold-200"><a href={`https://solscan.io/account/${h.owner}`} target="_blank" rel="noopener noreferrer" className="hover:text-amber">{shortAddress(h.owner)}</a></td>
                    <td className="px-5 py-3 font-mono text-[11px] tabular-nums text-cold-200">{h.balance.toLocaleString("en-US", { maximumFractionDigits: 0 })}</td>
                    <td className="px-5 py-3 font-mono text-[11px] tabular-nums text-cold-200">{(h.share * 100).toFixed(2)}%</td>
                    <td className="px-5 py-3 font-mono text-[11px] tabular-nums text-amber">{stats ? formatAmount((stats.wallets.payout.metax + stats.pool.creatorUnclaimed) * h.share) : "—"}</td>
                  </tr>
                ))}
                {!holders && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center font-mono text-[11px] text-cold-350">Not loaded. The scan reads the pool&rsquo;s trade history, about 30 seconds on the free RPC.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* History */}
        <section>
          <p className="label mb-4">Rounds · {rounds.length}</p>
          <div className="overflow-x-auto border border-cold-500/20">
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr className="border-b border-cold-500/15">
                  {["Time (UTC)", "Recipients", "METAx", "Value", "Tx"].map((h) => (
                    <th key={h} scope="col" className="label px-5 py-3 text-left text-[9px] font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rounds.map((r) => {
                  const rows = feed!.rows.filter((x) => x.signature === r.signature);
                  const total = rows.reduce((s, x) => s + x.amountUi, 0);
                  return (
                    <tr key={r.signature} className="border-b border-cold-500/10 last:border-0">
                      <td className="px-5 py-3 font-mono text-[11px] text-cold-350">{formatTime(r.blockTime)}</td>
                      <td className="px-5 py-3 font-mono text-[11px] text-cold-200">{rows.length}</td>
                      <td className="px-5 py-3 font-mono text-[11px] tabular-nums text-amber">{formatAmount(total)}</td>
                      <td className="px-5 py-3 font-mono text-[11px] tabular-nums text-cold-200">{usd ? formatUsd(total * usd) : "—"}</td>
                      <td className="px-5 py-3 font-mono text-[11px] text-cold-350"><a href={`https://solscan.io/tx/${r.signature}`} target="_blank" rel="noopener noreferrer" className="hover:text-amber">{r.signature.slice(0, 10)}…</a></td>
                    </tr>
                  );
                })}
                {!rounds.length && <tr><td colSpan={5} className="px-5 py-8 text-center font-mono text-[11px] text-cold-350">{feed?.degraded ? "Feed read failed on the RPC — refresh." : "No rounds yet."}</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
