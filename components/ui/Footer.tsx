export function Footer() {
  return (
    <footer className="relative border-t border-cold-500/15 bg-ink-deep px-6 pb-20 pt-16 md:px-12">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-mono text-[13px] tracking-[0.2em] text-cold-200">
              METAx
            </p>
            <p className="mt-4 max-w-[36ch] text-[13px] leading-relaxed text-cold-350">
              A tokenized-equity hub for the world&rsquo;s largest connection
              graph.
            </p>
          </div>

          <ul className="flex flex-wrap gap-x-10 gap-y-3">
            {["Docs", "Attestations", "Status", "Press"].map((item) => (
              <li key={item}>
                <a
                  href="#community"
                  className="label text-[10px] transition-colors duration-500 hover:text-amber"
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-14 max-w-[76ch] border-t border-cold-500/15 pt-8 text-[11px] leading-relaxed text-cold-350">
          Independent concept site. Not affiliated with, endorsed by, or
          connected to Meta Platforms, Inc. or any of its products, and not
          associated with any film or its rights holders. Nothing here is
          financial advice or an offer to sell securities; every figure, price
          and attestation shown is illustrative and does not describe a real
          product.
        </p>
      </div>
    </footer>
  );
}
