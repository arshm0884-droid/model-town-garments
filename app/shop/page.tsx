"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Store from "@/components/Store";

export default function ShopPage() {
  return (
    <div className="mtg-customer-page min-h-screen bg-[#f7f8fb] text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/92 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:h-[68px] lg:px-8">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-black text-slate-800">
            <ArrowLeft className="h-4 w-4" />
            <span>Model Town Garments</span>
          </Link>
          <Link href="/account" className="inline-flex min-h-11 items-center rounded-xl bg-[#102a56] px-4 py-2.5 text-sm font-black text-white">
            My Account
          </Link>
        </div>
      </header>
      <Store />
    </div>
  );
}
