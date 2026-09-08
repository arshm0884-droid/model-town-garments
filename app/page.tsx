"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import Store from "@/components/Store";
import AuthButton from "@/components/AuthButton";
import { ArrowRight, MapPin, ShieldCheck, Truck, Sparkles, Menu } from "lucide-react";
import MobileMenu from "@/components/MobileMenu";
import { storeData } from "@/data/storeData";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="mtg-site min-h-screen bg-[#f7f8fb] text-slate-950">
      <header className="mtg-site-header sticky top-0 z-50 border-b border-slate-200/80 bg-white/92 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:h-[68px] lg:px-8">
          <Link href="/" className="shrink-0" aria-label="Model Town Garments home">
            <div className="text-[13px] font-black tracking-[0.16em] text-slate-950 sm:text-sm">MODEL TOWN</div>
            <div className="mt-0.5 text-[9px] font-extrabold tracking-[0.32em] text-blue-600">GARMENTS</div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-bold text-slate-500 md:flex">
            <a href="#shop" className="transition hover:text-slate-950">Shop</a>
            <Link href="/account/orders" className="transition hover:text-slate-950">Orders</Link>
            <Link href="/wishlist" className="transition hover:text-slate-950">Wishlist</Link>
            <Link href="/help" className="transition hover:text-slate-950">Help</Link>
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block"><AuthButton /></div>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="sm:hidden"><AuthButton /></div>
          </div>
        </div>
      </header>

      <section id="home" className="overflow-hidden border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-8 lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-2 text-[10px] font-black tracking-[0.16em] text-blue-700">
              <Sparkles className="h-3.5 w-3.5" />
              MEN&apos;S WEAR · EST. {storeData.since}
            </div>

            <h1 className="mt-5 max-w-3xl text-[42px] font-black leading-[0.98] tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-7xl">
              Everyday style,
              <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                made simple.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-[15px] leading-7 text-slate-500 sm:text-base">
              Shop shirts, T-shirts, jeans, trousers and more from Model Town Garments. Choose your style, add to cart and order in a few simple steps.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href="#shop"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#102a56] px-6 text-sm font-black text-white shadow-lg shadow-blue-950/10 transition hover:-translate-y-0.5 hover:bg-[#173d79]"
              >
                Shop Collection
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-8 grid max-w-xl grid-cols-3 gap-2 border-t border-slate-100 pt-6">
              <div className="pr-3">
                <Truck className="h-4 w-4 text-blue-600" />
                <p className="mt-2 text-xs font-black text-slate-900">All India</p>
                <p className="mt-1 text-[10px] text-slate-500">Delivery</p>
              </div>
              <div className="border-l border-slate-100 px-3">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <p className="mt-2 text-xs font-black text-slate-900">Secure</p>
                <p className="mt-1 text-[10px] text-slate-500">Checkout</p>
              </div>
              <div className="border-l border-slate-100 pl-3">
                <Sparkles className="h-4 w-4 text-violet-600" />
                <p className="mt-2 text-xs font-black text-slate-900">Curated</p>
                <p className="mt-1 text-[10px] text-slate-500">Menswear</p>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-8 rounded-full bg-gradient-to-br from-blue-200/50 via-violet-200/40 to-emerald-100/40 blur-3xl" />
            <div className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/10">
              <div className="relative aspect-[16/10] overflow-hidden rounded-[24px] bg-slate-100">
                <Image
                  src="/images/home-hero.png"
                  alt="Model Town Garments premium men's wear collection"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 48vw"
                  className="object-cover transition duration-700 hover:scale-[1.03]"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/75 via-slate-950/25 to-transparent p-6">
                  <p className="text-[10px] font-black tracking-[0.25em] text-blue-200">
                    MODEL TOWN GARMENTS
                  </p>
                  <p className="mt-1 text-xl font-black text-white sm:text-2xl">
                    Premium Men&apos;s Wear
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Store />

      <section id="brands" className="border-y border-slate-200 bg-white py-14 sm:py-18">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-[10px] font-black tracking-[0.25em] text-blue-600">BRANDS & COLLECTIONS</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Good brands. Better everyday style.</h2>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {storeData.brands.map((brand) => (
              <div key={brand} className="flex min-h-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-center text-xs font-black text-slate-700 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md">
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="bg-[#f7f8fb] py-14 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:px-8">
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3]">
              <Image
                src="/images/about-brand.png"
                alt="Model Town Garments store interior"
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
              />
            </div>
            <div className="p-6 sm:p-8">
              <p className="text-[10px] font-black tracking-[0.25em] text-blue-600">ABOUT MODEL TOWN GARMENTS</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Menswear without the clutter.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
              We focus on practical men&apos;s fashion, clear pricing and a straightforward shopping experience. Browse the collection online and get your order delivered across India.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {storeData.categories.filter((item) => item !== "All").slice(0, 6).map((item) => (
                <span key={item} className="rounded-full bg-slate-100 px-3 py-2 text-[10px] font-black text-slate-600">{item}</span>
              ))}
            </div>
            </div>
          </div>

          <div id="location" className="rounded-[28px] bg-[#102a56] p-6 text-white shadow-xl sm:p-8">
            <MapPin className="h-5 w-5 text-blue-300" />
            <p className="mt-5 text-[10px] font-black tracking-[0.25em] text-blue-300">VISIT OUR STORE</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">Joya, Amroha</h2>
            <p className="mt-4 text-sm leading-7 text-white/65">{storeData.address.line1}<br />{storeData.address.line2}<br />{storeData.address.state}</p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <a
                href="https://www.google.com/maps/search/?api=1&query=Model%20Town%20Garments%20Jama%20Masjid%20Road%20Joya%20Amroha%20Uttar%20Pradesh"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-black text-[#102a56]"
              >
                Get Directions
              </a>
              <a href={`tel:${storeData.phone}`} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-5 text-sm font-black text-white">
                Call Store
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm font-black tracking-[0.16em]">MODEL TOWN</div>
            <div className="mt-1 text-[9px] font-extrabold tracking-[0.3em] text-blue-600">GARMENTS</div>
            <p className="mt-4 max-w-sm text-xs leading-6 text-slate-500">{storeData.address.line1}, {storeData.address.line2}, {storeData.address.state}.</p>
          </div>
          <div className="text-xs leading-6 text-slate-500 sm:text-right">
            <div>WhatsApp / Phone: {storeData.phone}</div>
            <div>All India Delivery · {storeData.delivery.estimatedDays}</div>
            <div className="mt-2">© 2026 Model Town Garments</div>
          </div>
        </div>
      </footer>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </main>
  );
}
