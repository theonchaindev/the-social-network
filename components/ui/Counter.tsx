"use client";

import { useRef } from "react";
import { useCountUp } from "@/hooks/useCountUp";

type Props = {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  label: string;
};

export function Counter({ value, decimals, prefix, suffix, className, label }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  useCountUp(ref, { value, decimals, prefix, suffix });

  const readable = `${prefix ?? ""}${value.toLocaleString("en-US")}${suffix ?? ""}`;

  return (
    <span className={className}>
      <span className="sr-only">{`${label}: ${readable}`}</span>
      <span ref={ref} aria-hidden="true" className="tabular-nums" />
    </span>
  );
}
