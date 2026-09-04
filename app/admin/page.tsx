"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    products: 0,
    orders: 0,
    customers: 0,
    revenue: 0,
  });

  useEffect(() => {
    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);

      if (session) {
        const [products, orders, customers, revenue] =
          await Promise.all([
            supabase
              .from("products")
              .select("id", { count: "exact", head: true }),

            supabase
              .from("orders")
              .select("id", { count: "exact", head: true }),

            supabase
              .from("customers")
              .select("id", { count: "exact", head: true }),

            supabase
              .from("orders")
              .select("total")
              .eq("payment_status", "verified"),
          ]);

        const totalRevenue = (revenue.data ?? []).reduce(
          (sum, order) =>
            sum + Number(order.total ?? 0),
          0
        );

        setCounts({
          products: products.count ?? 0,
          orders: orders.count ?? 0,
          customers: customers.count ?? 0,
          revenue: totalRevenue,
        });
      }

      setLoading(false);
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading admin...
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-5">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-7">
          <p className="text-sm font-semibold tracking-[0.25em] text-white/50">
            MTG ADMIN
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Admin Login
          </h1>

          <p className="mt-2 text-sm text-white/50">
            Please login from the admin page.
          </p>

          <a
            href="/admin"
            className="mt-6 block rounded-2xl bg-white py-3 text-center font-semibold text-black"
          >
            Go to Login
          </a>
        </div>
      </main>
    );
  }

  const cards = [
    ["Products", counts.products, "/admin/products"],
    ["Orders", counts.orders, "/admin/orders"],
    ["Customers", counts.customers, "/admin/customers"],
    [
      "Revenue",
      `₹${counts.revenue.toLocaleString("en-IN")}`,
      "/admin/orders",
    ],
  ];

  const sections = [
    [
      "Products",
      "Manage products, prices and stock.",
      "/admin/products",
    ],
    [
      "Orders",
      "Manage customer orders and statuses.",
      "/admin/orders",
    ],
    [
      "Customers",
      "View customer information.",
      "/admin/customers",
    ],
    [
      "Coupons",
      "Create and manage discount coupons.",
      "/admin/coupons",
    ],
    [
      "Offers",
      "Manage category offers.",
      "/admin/offers",
    ],
  ];

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-white/10 px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-white/40">
              MODEL TOWN GARMENTS
            </p>

            <h1 className="mt-1 text-2xl font-bold">
              Admin Dashboard
            </h1>

            <p className="mt-1 text-xs text-white/40">
              {session.user.email}
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
          >
            Logout
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(([title, value, href]) => (
            <a
              key={title}
              href={href as string}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:bg-white/[0.08]"
            >
              <p className="text-sm text-white/45">
                {title}
              </p>

              <p className="mt-2 text-3xl font-bold">
                {value}
              </p>
            </a>
          ))}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map(([title, description, href]) => (
            <a
              key={title}
              href={href}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:bg-white/[0.08]"
            >
              <h2 className="text-lg font-semibold">
                {title}
              </h2>

              <p className="mt-2 text-sm text-white/45">
                {description}
              </p>

              <p className="mt-5 text-sm font-medium">
                Manage →
              </p>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
