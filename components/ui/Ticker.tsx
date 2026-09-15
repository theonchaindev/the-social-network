"use client";

import { useReducedMotion } from "@/hooks/useMediaQuery";
import { tickerItems } from "@/lib/content";

/**
 * Data strip along the foot of the page. Duplicated once so the translate can
 * loop seamlessly at -50%.
 */
export function Ticker() {
  const reduced = useReducedMotion();
  const row = [...tickerItems, ...tickerItems];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 overflow-hidden border-t border-cold-500/20 bg-ink-deep/80 py-2 backdrop-blur-sm"
    >
      <div
        className="flex w-max gap-10 whitespace-nowrap will-change-transform"
        style={
          reduced
            ? undefined
            : { animation: "ticker-slide 48s linear infinite" }
        }
      >
        {row.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="label text-[10px] text-cold-350"
          >
            {item.includes("+") ? (
              <>
                {item.split("+")[0]}
                <span className="text-amber">+{item.split("+")[1]}</span>
              </>
            ) : (
              item
            )}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes ticker-slide {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-50%, 0, 0); }
        }
      `}</style>
    </div>
  );
}
