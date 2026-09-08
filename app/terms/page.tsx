"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function TermsPage() {
  const [text, setText] = useState("");

  useEffect(() => {
    supabase
      .from("store_settings")
      .select("terms_policy")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setText(data?.terms_policy || ""));
  }, []);

  return (
    <main className="mtg-customer-page min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
        <a href="/" className="inline-flex items-center gap-2 text-sm text-white/45 hover:text-white">
          <ArrowLeft size={16} /> Back to Store
        </a>

        <h1 className="mt-10 text-3xl font-black">Terms & Conditions</h1>

        <article className="mt-7 whitespace-pre-wrap rounded-3xl border border-white/10 bg-white/[0.04] p-6 leading-7 text-white/70">
          {text || "Terms & Conditions will be updated soon."}
        </article>
      </section>
    </main>
  );
}
