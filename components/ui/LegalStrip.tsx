/**
 * What survives of the footer. The page names Meta throughout and shows a
 * simulated payment ledger, so the disclaimer has to stay somewhere even once
 * the footer slab is gone.
 */
export function LegalStrip() {
  return (
    <div className="border-t border-cold-500/15 bg-ink-deep px-6 pb-32 pt-8 md:px-12">
      <p className="mx-auto max-w-[1400px] text-[11px] leading-relaxed text-cold-350">
        <strong className="font-medium text-cold-200">
          METAx is not a real product.
        </strong>{" "}
        No token, no market, no custody arrangement, no reserve — nothing here
        is financial advice or an offer to sell securities. Historical dates and
        figures about Facebook and Meta are drawn from the company&rsquo;s own
        disclosures; every METAx figure is invented and the faces are generated artwork. The
        distributions feed is the exception: it reads real transactions from a
        small rehearsal token on Solana mainnet, shown so the mechanism can be
        verified, not as an offer of anything. This is an independent
        concept site, not affiliated with or endorsed by Meta Platforms, Inc.,
        and not associated with any film or its rights holders.
      </p>
    </div>
  );
}
