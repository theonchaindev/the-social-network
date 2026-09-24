import type { Metadata } from "next";
import { BrandKit } from "@/components/brand/BrandKit";

export const metadata: Metadata = {
  title: "Brand kit — The Social Network",
  description: "Mark, palette, type, graphics and copy for The Social Network.",
  robots: { index: false },
};

export default function BrandPage() {
  return <BrandKit />;
}
