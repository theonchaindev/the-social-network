"use client";

import Link from "next/link";
import { useState } from "react";
import { brand } from "@/lib/brand";

function fill(text: string, ticker: string) {
  return text.replaceAll("{t}", ticker).replaceAll("{site}", brand.site);
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          window.setTimeout(() => setDone(false), 1400);
        } catch {
          /* clipboard blocked */
        }
      }}
      className="label border border-cold-500/40 px-3 py-2 text-[10px] transition-colors duration-500 hover:border-amber hover:text-amber"
    >
      {done ? "Copied" : "Copy"}
    </button>
  );
}

export function BrandKit() {
  const [ticker, setTicker] = useState<string>(brand.defaultTicker);

  return (
    <main className="min-h-screen bg-ink-deep text-cold-100">
      <div className="mx-auto max-w-[1400px] px-6 py-16 md:px-12 md:py-24">
        <header className="mb-20 border-b border-cold-500/20 pb-12">
          <p className="label mb-6">
            <Link href="/" className="transition-colors duration-500 hover:text-amber">← The Social Network</Link>
            <span className="mx-3 text-cold-500">·</span>Brand kit
          </p>
          <h1 className="headline max-w-[14ch] text-[clamp(2.4rem,6vw,5rem)]">
            Cold shadows. One warm thing.
          </h1>
          <p className="mt-8 max-w-[52ch] text-[15px] leading-relaxed text-cold-300">
            Everything on this page is original and cleared to post. It evokes an
            era, it does not reproduce anyone&rsquo;s property. The rules at the
            bottom are not optional.
          </p>
        </header>

        {/* The look */}
        <section className="mb-20">
          <div className="mb-8 grid gap-10 md:grid-cols-[1fr_1.1fr] md:items-end">
            <div>
              <p className="label mb-6">01 · The look</p>
              <h2 className="headline text-[clamp(1.6rem,3vw,2.4rem)]">
                There is no logo.
              </h2>
            </div>
            <p className="max-w-[48ch] text-[14px] leading-relaxed text-cold-300">
              The brand is two things the site actually renders: rain running
              down glass, and a network of faces. Both plates below are produced
              by the same maths the site runs — the refraction, the graph
              layout, the avatar tiles — so a graphic and the page it came from
              can never drift apart. Use them as grounds. Set type on top.
            </p>
          </div>
          <div className="grid gap-px bg-cold-500/20 md:grid-cols-2">
            {[
              { file: "rain.png", title: "Rain on glass", note: "A soft pane, sharp droplets, sodium and cold light out of focus behind it. The interstitial." },
              { file: "network.png", title: "The network", note: "Preferential attachment, force-directed, wearing generated profile pictures. Never real photographs of anyone." },
            ].map((p) => (
              <figure key={p.file} className="bg-ink-deep">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/brand/${p.file}`} alt={p.title} className="aspect-[16/9] w-full object-cover" />
                <figcaption className="p-5">
                  <p className="text-[13px] text-cold-100">{p.title}</p>
                  <p className="mt-2 max-w-[44ch] text-[12px] leading-relaxed text-cold-300">{p.note}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* Colour */}
        <section className="mb-20">
          <p className="label mb-6">02 · Colour</p>
          <div className="grid grid-cols-2 gap-px bg-cold-500/20 sm:grid-cols-4">
            {brand.colours.map((c) => (
              <div key={c.hex} className="bg-ink-deep">
                <div className="h-28" style={{ background: c.hex }} />
                <div className="p-4">
                  <p className="font-mono text-[12px] text-cold-100">{c.hex}</p>
                  <p className="label mt-1 text-[10px]">{c.name}</p>
                  <p className="mt-2 text-[12px] leading-relaxed text-cold-300">{c.use}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Type */}
        <section className="mb-20 grid gap-px bg-cold-500/20 md:grid-cols-3">
          <div className="bg-ink-deep p-8">
            <p className="label mb-6">03 · Editorial</p>
            <p className="headline text-[2.6rem] leading-[0.95]">Playfair Display</p>
            <p className="mt-4 text-[13px] leading-relaxed text-cold-300">Headlines only. Sentence case. Tight tracking, generous space around it.</p>
          </div>
          <div className="bg-ink-deep p-8">
            <p className="label mb-6">Body</p>
            <p className="text-[2rem] leading-tight">Inter</p>
            <p className="mt-4 text-[13px] leading-relaxed text-cold-300">Everything you read. Cold 300 on ink. Never bold for emphasis; use amber or a rule.</p>
          </div>
          <div className="bg-ink-deep p-8">
            <p className="label mb-6">Metadata</p>
            <p className="font-mono text-[1.6rem] tracking-[0.12em]">JetBrains Mono</p>
            <p className="mt-4 text-[13px] leading-relaxed text-cold-300">Timestamps, hashes, labels. Uppercase, 0.18em tracking, 10 to 11px.</p>
          </div>
        </section>

        {/* Graphics */}
        <section className="mb-20">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="label mb-6">04 · Graphics</p>
              <h2 className="headline text-[clamp(1.6rem,3vw,2.4rem)]">Ready to post.</h2>
            </div>
            <p className="label max-w-[36ch] text-cold-350 md:text-right">Rendered in the site&rsquo;s own fonts. Click to download.</p>
          </div>
          <div className="grid gap-px bg-cold-500/20 sm:grid-cols-2 lg:grid-cols-3">
            {brand.assets.map((a) => (
              <a
                key={a.file}
                href={`/brand/${a.file}`}
                download
                className="group block bg-ink-deep p-5 transition-colors duration-500 hover:bg-ink-raise"
              >
                <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-ink">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/brand/${a.file}`} alt={a.label} className="max-h-full max-w-full object-contain" loading="lazy" />
                </div>
                <div className="mt-4 flex items-baseline justify-between gap-4">
                  <p className="text-[13px] text-cold-100">{a.label}</p>
                  <p className="label text-[10px]">{a.size}</p>
                </div>
                <p className="label mt-2 text-[10px] text-amber opacity-0 transition-opacity duration-500 group-hover:opacity-100">Download ↓</p>
              </a>
            ))}
          </div>
        </section>

        {/* Voice */}
        <section className="mb-20 grid gap-px bg-cold-500/20 md:grid-cols-2">
          <div className="bg-ink-deep p-8">
            <p className="label mb-6">05 · Voice</p>
            <ul className="space-y-3">
              {brand.voice.map((v) => (
                <li key={v} className="flex gap-4 text-[14px] leading-relaxed text-cold-200">
                  <span className="text-amber">—</span>
                  {v}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-ink-deep p-8">
            <p className="label mb-6">The line</p>
            <p className="headline text-[clamp(1.4rem,2.6vw,2rem)]">{brand.line}</p>
            <p className="mt-6 text-[13px] leading-relaxed text-cold-300">Ours, and the only quote the brand uses. The headline is <em>{brand.headline}</em></p>
          </div>
        </section>

        {/* Tweets */}
        <section className="mb-20">
          <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="label mb-6">06 · Tweets</p>
              <h2 className="headline text-[clamp(1.6rem,3vw,2.4rem)]">Copy that is already in the voice.</h2>
            </div>
            <label className="flex items-center gap-4">
              <span className="label text-[10px]">Working ticker</span>
              <input
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                className="w-32 border border-cold-500/50 bg-transparent px-3 py-2 font-mono text-[13px] text-amber outline-none focus:border-amber"
                aria-label="Working ticker, substituted into every tweet"
              />
            </label>
          </div>
          <div className="grid gap-px bg-cold-500/20 md:grid-cols-2">
            {brand.tweets.map((tw) => {
              const text = fill(tw.text, ticker);
              return (
                <article key={tw.tag} className="flex flex-col bg-ink-deep p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="label text-[10px] text-amber">{tw.tag}</p>
                    <p className="label text-[10px] text-cold-350">{text.length} chars</p>
                  </div>
                  <p className="flex-1 whitespace-pre-wrap text-[14px] leading-relaxed text-cold-200">{text}</p>
                  <div className="mt-5 flex gap-3">
                    <CopyButton text={text} />
                    <a
                      href={`https://x.com/intent/post?text=${encodeURIComponent(text)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="label border border-cold-500/40 px-3 py-2 text-[10px] transition-colors duration-500 hover:border-amber hover:text-amber"
                    >
                      Open in X
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
          <p className="label mt-4 text-[10px] text-cold-350">
            The round card uses {"{n} {amount} {holders} {tx}"} — fill from the admin page after a round settles.
          </p>
        </section>

        {/* Rules */}
        <section className="border-t border-cold-500/20 pt-12">
          <p className="label mb-6">07 · Not optional</p>
          <ul className="grid gap-4 md:grid-cols-2">
            {brand.rules.map((r) => (
              <li key={r} className="border-l border-amber/60 pl-5 text-[14px] leading-relaxed text-cold-200">{r}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
