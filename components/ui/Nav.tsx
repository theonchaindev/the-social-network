"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { MagneticButton } from "./MagneticButton";
import { social } from "@/lib/content";

const links = [
  { href: "#idea", label: "The idea" },
  { href: "#numbers", label: "Numbers" },
  { href: "#product", label: "Product" },
  { href: "#distributions", label: "Payouts" },
  { href: "#timeline", label: "Timeline" },
];

export function Nav({ ready }: { ready: boolean }) {
  const [hidden, setHidden] = useState(false);

  // The bar is mix-blend-difference over a full-bleed page, so leaving it up
  // permanently means it lands on top of whatever is passing underneath.
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) > 6) {
        setHidden(y > last && y > 160);
        last = y;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={ready ? { opacity: hidden ? 0 : 1, y: hidden ? -28 : 0 } : {}}
      transition={{ duration: 0.7, delay: hidden ? 0 : 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50 mix-blend-difference"
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-6 md:px-12"
      >
        <a href="#hero" className="font-mono text-[13px] tracking-[0.2em] text-white">
          METAx
        </a>

        <ul className="hidden items-center gap-9 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="label text-[10px] text-white/70 transition-colors duration-500 hover:text-white"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <MagneticButton
          href={social.url}
          external
          variant="ghost"
          strength={0.22}
          className="!border-white/30 !px-5 !py-2.5 !text-[11px] !text-white hover:!border-white hover:!text-white"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-3 w-3 fill-current"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Follow
        </MagneticButton>
      </nav>
    </motion.header>
  );
}
