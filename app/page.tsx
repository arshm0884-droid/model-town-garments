import Link from "next/link";
import Gallery from "@/components/Gallery";
import Store from "@/components/Store";
import { storeData } from "@/data/storeData";
import AuthButton from "@/components/AuthButton";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8f9fb] text-[#111827]">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#102a56] text-lg font-black text-white">
              MT
            </div>
            <div>
              <div className="text-sm font-black tracking-tight sm:text-base">
                MODEL TOWN
              </div>
              <div className="text-[9px] font-bold tracking-[0.28em] text-[#2563eb]">
                GARMENTS
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
            <a href="#home" className="transition hover:text-[#2563eb]">
              Home
            </a>
            <a href="#shop" className="transition hover:text-[#2563eb]">
              Shop
            </a>
            <a href="#brands" className="transition hover:text-[#2563eb]">
              Brands
            </a>
            <a href="#about" className="transition hover:text-[#2563eb]">
              About
            </a>
            <a href="#location" className="transition hover:text-[#2563eb]">
              Location
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <AuthButton />

            <a
              href={`https://wa.me/${storeData.whatsapp}?text=${encodeURIComponent(
                "Hello Model Town Garments, I would like to know more about your collection."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#102a56] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#173d79]"
            >
              <span className="hidden sm:inline">WhatsApp</span>
              <span className="sm:hidden">WA</span>
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section id="home" className="overflow-hidden bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:py-24">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-black tracking-[0.16em] text-[#2563eb]">
              MEN&apos;S WEAR · EST. {storeData.since}
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
              Style that fits
              <br />
              <span className="text-[#2563eb]">your everyday.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-slate-500 sm:text-lg">
              Quality men&apos;s wear for everyday style — from shirts and
              T-shirts to jeans, trousers and jackets.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#shop"
                className="rounded-full bg-[#102a56] px-7 py-4 text-center text-sm font-black text-white transition hover:-translate-y-1 hover:bg-[#173d79]"
              >
                SHOP COLLECTION
              </a>

              <a
                href={`https://wa.me/${storeData.whatsapp}?text=${encodeURIComponent(
                  "Hello Model Town Garments, I would like to know more about your collection."
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-slate-200 bg-white px-7 py-4 text-center text-sm font-black text-[#102a56] transition hover:border-blue-200 hover:bg-blue-50"
              >
                CHAT ON WHATSAPP
              </a>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-xs font-bold text-slate-500">
              <span>✓ All India Delivery</span>
              <span>✓ Quality Menswear</span>
              <span>✓ Trusted Since {storeData.since}</span>
            </div>
          </div>

          {/* HERO VISUAL */}
          <div className="relative">
            <div className="absolute -inset-5 rounded-[3rem] bg-blue-100/70 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[#eef3fa] p-3 shadow-xl">
              <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#dbe5f3] via-[#f8fafc] to-[#c9d6e8]">
                <div className="text-center">
                  <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[2rem] bg-[#102a56] text-5xl font-black text-white shadow-2xl">
                    MT
                  </div>

                  <div className="mt-7 text-2xl font-black">
                    MODEL TOWN
                  </div>

                  <div className="mt-2 text-xs font-black tracking-[0.35em] text-[#2563eb]">
                    GARMENTS
                  </div>

                  <div className="mt-5 text-sm font-semibold text-slate-500">
                    Premium Brands · Best Quality
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="border-y border-slate-200 bg-[#f8f9fb]">
        <div className="mx-auto grid max-w-7xl gap-px sm:grid-cols-3">
          {[
            [
              "🇮🇳",
              "All India Delivery",
              "Get your order delivered across India.",
            ],
            [
              "✓",
              "Quality First",
              "Explore quality menswear collections.",
            ],
            [
              "💬",
              "Easy Ordering",
              "Order directly through WhatsApp.",
            ],
          ].map(([icon, title, text]) => (
            <div key={title} className="p-7 sm:p-9">
              <div className="text-2xl">{icon}</div>
              <h2 className="mt-4 text-lg font-black">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* STORE / PRODUCTS / CART */}
      <Store />

      {/* BRANDS */}
      <section id="brands" className="border-y border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="text-center">
            <div className="text-xs font-black tracking-[0.28em] text-[#2563eb]">
              BRANDS WE CARRY
            </div>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.04em]">
              Trusted names. Everyday style.
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {storeData.brands.map((brand) => (
              <div
                key={brand}
                className="flex min-h-20 items-center justify-center rounded-2xl border border-slate-200 bg-[#f8f9fb] px-4 text-center text-xs font-black tracking-wide text-slate-700 transition hover:-translate-y-1 hover:bg-white hover:shadow-md"
              >
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="text-xs font-black tracking-[0.28em] text-[#2563eb]">
              ABOUT US
            </div>

            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              Menswear made simple.
            </h2>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-500">
              Model Town Garments is a men&apos;s wear store on Jama Masjid
              Road, Joya, Amroha. Explore shirts, T-shirts, jeans, trousers
              and jackets from a range of well-known brands.
            </p>

            <a
              href={`https://wa.me/${storeData.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex rounded-full bg-[#102a56] px-6 py-3 text-sm font-black text-white"
            >
              Chat on WhatsApp
            </a>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              {[
                ["👔", "Shirts"],
                ["👕", "T-Shirts"],
                ["👖", "Jeans"],
                ["🧥", "Jackets"],
              ].map(([icon, label]) => (
                <div
                  key={label}
                  className="rounded-3xl bg-[#f4f6f9] p-8 text-center"
                >
                  <div className="text-4xl">{icon}</div>
                  <div className="mt-3 text-sm font-black text-slate-700">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* LOCATION */}
      <section id="location" className="bg-[#102a56] py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="text-xs font-black tracking-[0.28em] text-blue-300">
              VISIT OUR STORE
            </div>

            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              Come find us.
            </h2>

            <p className="mt-6 text-base leading-8 text-white/65">
              Jama Masjid Road,
              <br />
              Joya, Amroha,
              <br />
              Uttar Pradesh
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="https://www.google.com/maps/search/?api=1&query=Model%20Town%20Garments%20Jama%20Masjid%20Road%20Joya%20Amroha%20Uttar%20Pradesh"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white px-6 py-3 text-sm font-black text-[#102a56]"
              >
                Get Directions
              </a>

              <a
                href={`tel:${storeData.phone}`}
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-black"
              >
                Call {storeData.phone}
              </a>
            </div>
          </div>

          <div className="flex min-h-72 items-center justify-center rounded-[2rem] border border-white/10 bg-white/5">
            <div className="text-center">
              <div className="text-6xl">📍</div>
              <div className="mt-4 text-xl font-black">
                MODEL TOWN GARMENTS
              </div>
              <div className="mt-2 text-sm text-white/45">
                Jama Masjid Road · Joya · Amroha
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-[#f8f9fb] px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200 sm:p-12 lg:p-16">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <div className="text-xs font-black tracking-[0.25em] text-[#2563eb]">
                READY TO SHOP?
              </div>

              <h2 className="mt-3 text-3xl font-black sm:text-4xl">
                Find your next favourite.
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
                Browse the collection or contact Model Town Garments directly
                on WhatsApp.
              </p>
            </div>

            <a
              href={`https://wa.me/${storeData.whatsapp}?text=${encodeURIComponent(
                "Hello Model Town Garments, I would like to place an order."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#2563eb] px-7 py-4 text-center text-sm font-black text-white transition hover:bg-[#1d4ed8]"
            >
              ORDER ON WHATSAPP →
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#102a56] text-sm font-black text-white">
                MT
              </div>

              <div>
                <div className="text-sm font-black">
                  MODEL TOWN GARMENTS
                </div>
                <div className="text-[9px] font-bold tracking-[0.25em] text-[#2563eb]">
                  MEN&apos;S WEAR
                </div>
              </div>
            </div>

            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">
              Jama Masjid Road, Joya, Amroha, Uttar Pradesh.
            </p>
          </div>

          <div className="text-sm text-slate-500 sm:text-right">
            <div>WhatsApp: {storeData.phone}</div>
            <div className="mt-2">🇮🇳 All India Delivery</div>
            <div className="mt-2 text-xs">
              Demo catalogue · Products & prices can be customized
            </div>
            <div className="mt-2">© 2026 Model Town Garments</div>
          </div>
        </div>
      </footer>
    </main>
  );
}
