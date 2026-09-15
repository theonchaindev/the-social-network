export function Footer() {
  return (
    <footer className="relative border-t border-cold-500/15 bg-ink-deep px-6 pb-20 pt-16 md:px-12">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-mono text-[13px] tracking-[0.2em] text-cold-200">
              METAx
            </p>
            <p className="mt-4 max-w-[38ch] text-[13px] leading-relaxed text-cold-350">
              A design concept about the largest private map of human
              connection ever assembled, and what it would mean to price it.
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

        <div className="mt-14 space-y-4 border-t border-cold-500/15 pt-8">
          <p className="max-w-[80ch] text-[11px] leading-relaxed text-cold-350">
            <strong className="font-medium text-cold-200">
              METAx is not a real product.
            </strong>{" "}
            It is an original design concept. There is no token, no market, no
            custody arrangement and no reserve; the signup form has no backend
            and stores nothing. Nothing on this page is financial advice, an
            offer to sell securities, or a description of anything you can buy.
          </p>
          <p className="max-w-[80ch] text-[11px] leading-relaxed text-cold-350">
            Historical dates and figures about Facebook and Meta are drawn from
            the company&rsquo;s own disclosures and contemporaneous reporting,
            and are included as factual reference. Every METAx figure — price,
            volume, spread, reserve ratio, attestation block — is invented. The
            faces in the network are generated artwork, not photographs of real
            people.
          </p>
          <p className="max-w-[80ch] text-[11px] leading-relaxed text-cold-350">
            This site is independent. It is not affiliated with, endorsed by,
            or connected to Meta Platforms, Inc. or any of its products, and it
            is not associated with any film or its rights holders. No Meta or
            Facebook logos, trademarks or assets are used.
          </p>
        </div>
      </div>
    </footer>
  );
}
