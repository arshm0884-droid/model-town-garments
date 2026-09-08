"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function ShippingPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    supabase
      .from("store_settings")
      .select("business_name,delivery_available,delivery_estimate,delivery_charge,free_delivery_above,shipping_policy")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setData(data));
  }, []);

  return (
    <main className="mtg-customer-page min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
        <a href="/" className="inline-flex items-center gap-2 text-sm text-white/45 hover:text-white">
          <ArrowLeft size={16} /> Back to Store
        </a>

        <div className="mt-10 flex items-center gap-4">
          <div className="rounded-2xl bg-white p-3 text-black">
            <Truck size={24} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
              Delivery
            </p>
            <h1 className="text-3xl font-black">Shipping Information</h1>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs text-white/40">Delivery</p>
            <p className="mt-2 font-bold">
              {data?.delivery_available === false ? "Unavailable" : "Available"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs text-white/40">Estimated Time</p>
            <p className="mt-2 font-bold">
              {data?.delivery_estimate || "3-7 business days"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs text-white/40">Delivery Charge</p>
            <p className="mt-2 font-bold">
              ₹{Number(data?.delivery_charge || 0).toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {Number(data?.free_delivery_above || 0) > 0 && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            Free delivery on orders above{" "}
            <strong>₹{Number(data.free_delivery_above).toLocaleString("en-IN")}</strong>.
          </div>
        )}

        <article className="mt-6 whitespace-pre-wrap rounded-3xl border border-white/10 bg-white/[0.04] p-6 leading-7 text-white/70">
          {data?.shipping_policy || "Shipping information will be updated soon."}
        </article>
      </section>
    </main>
  );
}
