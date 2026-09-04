"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Customer = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadCustomers() {
    setLoading(true);

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
    } else {
      setCustomers((data ?? []) as Customer[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  const filtered = customers.filter((customer) => {
    const q = search.toLowerCase();

    return (
      String(customer.name ?? "")
        .toLowerCase()
        .includes(q) ||
      String(customer.email ?? "")
        .toLowerCase()
        .includes(q) ||
      String(customer.phone ?? "")
        .toLowerCase()
        .includes(q)
    );
  });

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-white/10 px-5 py-5 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <a
            href="/admin"
            className="text-sm text-white/40 hover:text-white"
          >
            ← Admin Dashboard
          </a>

          <h1 className="mt-4 text-3xl font-bold">
            Customers
          </h1>

          <p className="mt-1 text-sm text-white/40">
            View registered customer information.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-7 sm:px-8">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email or phone..."
          className="mb-6 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30"
        />

        {loading ? (
          <div className="py-20 text-center text-white/40">
            Loading customers...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] py-20 text-center text-white/40">
            No customers found.
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="border-b border-white/10 bg-white/[0.04]">
                  <tr>
                    <th className="px-5 py-4 text-left text-sm text-white/50">
                      Name
                    </th>
                    <th className="px-5 py-4 text-left text-sm text-white/50">
                      Email
                    </th>
                    <th className="px-5 py-4 text-left text-sm text-white/50">
                      Phone
                    </th>
                    <th className="px-5 py-4 text-left text-sm text-white/50">
                      Joined
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-white/10 last:border-0"
                    >
                      <td className="px-5 py-4 font-medium">
                        {customer.name || "—"}
                      </td>

                      <td className="px-5 py-4 text-sm text-white/70">
                        {customer.email || "—"}
                      </td>

                      <td className="px-5 py-4 text-sm text-white/70">
                        {customer.phone || "—"}
                      </td>

                      <td className="px-5 py-4 text-sm text-white/50">
                        {customer.created_at
                          ? new Date(
                              customer.created_at
                            ).toLocaleDateString("en-IN")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
