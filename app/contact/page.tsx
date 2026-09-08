"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Mail, MessageCircle, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function ContactPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    supabase
      .from("store_settings")
      .select("business_name,phone,whatsapp,email,address,contact_text")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setData(data));
  }, []);

  const whatsapp = String(data?.whatsapp || "").replace(/\D/g, "");

  return (
    <main className="mtg-customer-page min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
        <a href="/" className="inline-flex items-center gap-2 text-sm text-white/45 hover:text-white">
          <ArrowLeft size={16} /> Back to Store
        </a>

        <h1 className="mt-10 text-3xl font-black">Contact Us</h1>

        <p className="mt-3 text-white/50">
          {data?.contact_text || "We're here to help."}
        </p>

        <div className="mt-8 grid gap-3">
          {data?.phone && (
            <a href={`tel:${data.phone}`} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <Phone size={20} />
              <span>{data.phone}</span>
            </a>
          )}

          {data?.email && (
            <a href={`mailto:${data.email}`} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <Mail size={20} />
              <span>{data.email}</span>
            </a>
          )}

          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5"
            >
              <MessageCircle size={20} />
              <span>WhatsApp</span>
            </a>
          )}

          {data?.address && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-white/65">
              {data.address}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
