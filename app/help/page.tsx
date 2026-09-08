"use client";

import { useState } from "react";
import { ChevronDown, MessageCircle, Mail, Phone, ArrowLeft, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { storeData } from "@/data/storeData";

const faqs = [
  {
    q: "How can I place an order?",
    a: "Add your products to the cart, continue to checkout, enter your delivery details, review your order, and confirm it on WhatsApp. Our team will confirm the order with you there."
  },
  {
    q: "How will my order be confirmed?",
    a: "After submitting your order, WhatsApp will open with your order details. Send the message to our team and wait for confirmation."
  },
  {
    q: "How can I track my order?",
    a: "Open Account → Orders. You can view your order status and the latest available delivery progress there."
  },
  {
    q: "Can I cancel my order?",
    a: "Cancellation is available while the order is in an eligible early stage. Open your order and use the Cancel Order option when available."
  },
  {
    q: "Can I return a delivered order?",
    a: "If your delivered order is eligible for return, open the order in Account → Orders and submit a return request with the reason."
  },
  {
    q: "How long does delivery take?",
    a: "Delivery time depends on your location and current availability. Our team can provide the latest delivery estimate when confirming your order."
  },
];

export default function HelpPage() {
  const router = useRouter();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <main className="mtg-customer-page min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">

        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-[#102a56]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <section className="rounded-3xl bg-[#102a56] px-6 py-10 text-white shadow-xl sm:px-10">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                Customer Support
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                How can we help?
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
                Find answers about orders, delivery, cancellations, returns and refunds.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <a
            href={`https://wa.me/${String(storeData.whatsapp || storeData.phone).replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <MessageCircle className="h-6 w-6 text-emerald-600" />
            <h2 className="mt-4 text-sm font-black">WhatsApp</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Chat with our team about your order.
            </p>
          </a>

          <a
            href="mailto:info@modeltowngarments.shop"
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <Mail className="h-6 w-6 text-[#2563eb]" />
            <h2 className="mt-4 text-sm font-black">Email Support</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Send us your question by email.
            </p>
          </a>

          <a
            href={`tel:${storeData.phone}`}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <Phone className="h-6 w-6 text-[#102a56]" />
            <h2 className="mt-4 text-sm font-black">Call Us</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Contact our team for assistance.
            </p>
          </a>
        </section>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Frequently Asked Questions
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">
              Common questions
            </h2>
          </div>

          <div className="mt-6 divide-y divide-slate-100">
            {faqs.map((faq, index) => {
              const active = open === index;

              return (
                <div key={faq.q}>
                  <button
                    type="button"
                    onClick={() => setOpen(active ? null : index)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  >
                    <span className="text-sm font-black text-slate-800">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${
                        active ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {active && (
                    <p className="pb-5 pr-8 text-sm leading-6 text-slate-500">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h2 className="text-lg font-black text-slate-900">
            Still need help?
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Our team is available to help with your order or account.
          </p>
          <button
            type="button"
            onClick={() => router.push("/contact")}
            className="mt-5 rounded-2xl bg-[#102a56] px-6 py-3 text-sm font-black text-white transition hover:bg-[#173d79]"
          >
            Contact Us
          </button>
        </section>

      </div>
    </main>
  );
}
