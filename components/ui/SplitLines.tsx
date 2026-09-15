"use client";

import { useCallback, useRef, useState } from "react";
import { useIsoLayoutEffect } from "@/hooks/useIsoLayoutEffect";
import { useLineReveal } from "@/hooks/useLineReveal";

/** The tags this is ever used as — a full ElementType union blows up TS here. */
type Tag = "p" | "h1" | "h2" | "h3" | "h4" | "span" | "div" | "blockquote";

type Props = {
  text: string;
  as?: Tag;
  className?: string;
  immediate?: boolean;
  /** Hold the reveal until the preloader has cut. */
  play?: boolean;
  delay?: number;
  stagger?: number;
  start?: string;
};

/**
 * Splits copy into *visual* lines by measuring word positions, then masks each
 * line so it can rise independently. Re-measures on resize because a reflow
 * changes where the lines actually break.
 *
 * The container carries the full string as an aria-label and the split spans
 * are hidden from assistive tech, so screen readers get one clean sentence.
 */
export function SplitLines({
  text,
  as: Tag = "p",
  className,
  immediate = false,
  play = true,
  delay = 0,
  stagger = 0.075,
  start,
}: Props) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = text.split(/\s+/).filter(Boolean);
  // null => flat measuring pass; array => grouped into visual lines
  const [lines, setLines] = useState<string[][] | null>(null);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const wordEls = Array.from(el.querySelectorAll<HTMLElement>("[data-word]"));
    if (!wordEls.length) return;

    const grouped: string[][] = [];
    let lastTop: number | null = null;
    wordEls.forEach((wordEl) => {
      const top = wordEl.offsetTop;
      if (lastTop === null || Math.abs(top - lastTop) > 2) {
        grouped.push([]);
        lastTop = top;
      }
      grouped[grouped.length - 1].push(wordEl.textContent?.trim() ?? "");
    });
    setLines(grouped);
  }, []);

  useIsoLayoutEffect(() => {
    if (lines === null) measure();
  }, [lines, measure]);

  useIsoLayoutEffect(() => {
    let frame = 0;
    const onResize = () => {
      cancelAnimationFrame(frame);
      // Drop back to the flat pass so the next measure sees real line breaks.
      frame = requestAnimationFrame(() => setLines(null));
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frame);
    };
  }, []);

  useLineReveal(ref, {
    immediate,
    delay,
    stagger,
    start,
    ready: lines !== null && play,
  });

  const renderWords = (list: string[]) =>
    list.map((word, i) => (
      <span key={`${word}-${i}`} data-word style={{ display: "inline-block" }}>
        {word}
        {i < list.length - 1 ? " " : ""}
      </span>
    ));

  const body =
    lines === null ? (
      <span className="split-line" aria-hidden="true">
        <span style={{ opacity: 0 }}>{renderWords(words)}</span>
      </span>
    ) : (
      lines.map((line, i) => (
        <span className="split-line" key={i} aria-hidden="true">
          <span style={{ opacity: 0 }}>{renderWords(line)}</span>
        </span>
      ))
    );

  // Narrowed to one concrete intrinsic element so TypeScript resolves a single
  // prop shape; the real tag is still whatever `as` was.
  const Component = Tag as "p";

  return (
    <Component ref={ref} className={className}>
      {/* Assistive tech reads one clean string; the split spans are decorative.
          An aria-label on a paragraph or heading is prohibited, hence this. */}
      <span className="sr-only">{text}</span>
      {body}
    </Component>
  );
}
