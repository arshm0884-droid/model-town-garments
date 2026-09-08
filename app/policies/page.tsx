"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function PoliciesPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    supabase
      .from("store_settings")
      .select("shipping_policy,return_policy,refund_policy,privacy_policy,terms_policy")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setData(data));
  }, []);

  const sections = [
    ["Shipping Policy", data?.shipping_policy],
    ["Return Policy", data?.return_policy],
    ["Refund Policy", data?.refund_policy],
    ["Privacy Policy", data?.privacy_policy],
    ["Terms & Conditions", data?.terms_policy],
  ];

  return (
    <main className="mtg-customer-page min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
        <a href="/" className="inline-flex items-center gap-2 text-sm text-white/45 hover:text-white">
          <ArrowLeft size={16} /> Back to Store
        </a>

        <div className="mt-10 flex items-center gap-4">
          <div className="rounded-2xl bg-white p-3 text-black">
            <FileText size={24} />
          </div>
          <h1 className="text-3xl font-black">Policies</h1>
        </div>

        <div className="mt-8 space-y-5">
          {sections.map(([title, text]) => (
            <article
              key={title}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
            >
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="mt-4 whitespace-pre-wrap leading-7 text-white/65">
                {text || `${title} will be updated soon.`}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
