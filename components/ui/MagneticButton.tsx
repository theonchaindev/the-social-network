"use client";

import { ReactNode, useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useHasFinePointer, useReducedMotion } from "@/hooks/useMediaQuery";

type Props = {
  children: ReactNode;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "ghost";
  className?: string;
  strength?: number;
};

export function MagneticButton({
  children,
  href,
  external = false,
  onClick,
  type = "button",
  variant = "primary",
  className = "",
  strength = 0.32,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const inner = useRef<HTMLSpanElement>(null);
  const fine = useHasFinePointer();
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    const label = inner.current;
    if (!el || !label || !fine || reduced) return;

    const moveX = gsap.quickTo(el, "x", { duration: 0.7, ease: "expo.out" });
    const moveY = gsap.quickTo(el, "y", { duration: 0.7, ease: "expo.out" });
    const labelX = gsap.quickTo(label, "x", { duration: 0.9, ease: "expo.out" });
    const labelY = gsap.quickTo(label, "y", { duration: 0.9, ease: "expo.out" });

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      moveX(dx * strength);
      moveY(dy * strength);
      labelX(dx * strength * 0.45);
      labelY(dy * strength * 0.45);
    };

    const onLeave = () => {
      moveX(0);
      moveY(0);
      labelX(0);
      labelY(0);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [fine, reduced, strength]);

  const base =
    "group relative inline-flex shrink-0 items-center justify-center gap-3 whitespace-nowrap px-8 py-4 text-[13px] font-medium uppercase tracking-[0.08em] transition-colors duration-500";
  const styles =
    variant === "primary"
      ? "bg-amber text-ink-deep hover:bg-amber-soft"
      : "border border-cold-500/60 text-cold-200 hover:border-amber/70 hover:text-amber-soft";

  const content = (
    <span ref={inner} className="pointer-events-none inline-flex items-center gap-3">
      {children}
    </span>
  );

  if (href) {
    return (
      <a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className={`${base} ${styles} ${className}`}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type={type}
      onClick={onClick}
      className={`${base} ${styles} ${className}`}
    >
      {content}
    </button>
  );
}
