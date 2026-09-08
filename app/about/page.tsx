"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function AboutPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    supabase
      .from("store_settings")
      .select("business_name,about_text")
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
            <Building2 size={24} />
          </div>
          <h1 className="text-3xl font-black">
            About {data?.business_name || "Us"}
          </h1>
        </div>

        <article className="mt-7 whitespace-pre-wrap rounded-3xl border border-white/10 bg-white/[0.04] p-6 leading-7 text-white/70">
          {data?.about_text || "About information will be updated soon."}
        </article>
      </section>
    </main>
  );
}
