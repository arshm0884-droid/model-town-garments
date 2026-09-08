"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Search,
  Phone,
  Mail,
  MessageCircle,
  ShoppingBag,
  X,
  RefreshCw,
  UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Customer = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
};

type Order = {
  id: string;
  order_id: string;
  customer_id: string | null;
  total: number | null;
  order_status: string | null;
  payment_status: string | null;
  created_at: string;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function loadCustomers() {
    setLoading(true);

    const [{ data: customerData, error: customerError }, { data: orderData }] =
      await Promise.all([
        supabase
          .from("customers")
          .select("id,name,email,phone,created_at")
          .order("created_at", { ascending: false }),

        supabase
          .from("orders")
          .select(
            "id,order_id,customer_id,total,order_status,payment_status,created_at"
          )
          .order("created_at", { ascending: false }),
      ]);

    if (customerError) {
      alert(customerError.message);
    } else {
      setCustomers((customerData ?? []) as Customer[]);
    }

    setOrders((orderData ?? []) as Order[]);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  const stats = useMemo(() => {
    const totalSales = orders.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0
    );

    return {
      customers: customers.length,
      orders: orders.length,
      sales: totalSales,
    };
  }, [customers, orders]);

  const filtered = customers.filter((customer) => {
    const q = search.toLowerCase().trim();

    return (
      !q ||
      String(customer.name ?? "").toLowerCase().includes(q) ||
      String(customer.email ?? "").toLowerCase().includes(q) ||
      String(customer.phone ?? "").toLowerCase().includes(q)
    );
  });

  function customerOrders(customerId: string) {
    return orders.filter((order) => order.customer_id === customerId);
  }

  function customerSpent(customerId: string) {
    return customerOrders(customerId).reduce(
      (sum, order) => sum + Number(order.total || 0),
      0
    );
  }

  function whatsappUrl(phone: string | null) {
    if (!phone) return "#";
    const clean = phone.replace(/\D/g, "");
    return `https://wa.me/${clean}`;
  }

  function phoneUrl(phone: string | null) {
    return phone ? `tel:${phone}` : "#";
  }

  function emailUrl(email: string | null) {
    return email ? `mailto:${email}` : "#";
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-white/10 px-5 py-5 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <a
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-white/40 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Admin Dashboard
          </a>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white p-3 text-black">
                  <UserRound size={22} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Customers</h1>
                  <p className="mt-1 text-sm text-white/40">
                    Manage customer information, orders and communication.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setRefreshing(true);
                loadCustomers();
              }}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold transition hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-7 sm:px-8">
        <div className="mb-7 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/35">
              Customers
            </p>
            <p className="mt-2 text-3xl font-black">{stats.customers}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/35">
              Orders
            </p>
            <p className="mt-2 text-3xl font-black">{stats.orders}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/35">
              Order Value
            </p>
            <p className="mt-2 text-3xl font-black">
              ₹{stats.sales.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <div className="relative mb-6">
          <Search
            size={19}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email or phone..."
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 outline-none transition placeholder:text-white/25 focus:border-white/25"
          />
        </div>

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
              <table className="w-full min-w-[900px]">
                <thead className="border-b border-white/10 bg-white/[0.04]">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-white/40">
                      Customer
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-white/40">
                      Contact
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-white/40">
                      Orders
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-white/40">
                      Spent
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-white/40">
                      Joined
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-white/40">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((customer) => {
                    const customerOrderList = customerOrders(customer.id);

                    return (
                      <tr
                        key={customer.id}
                        className="border-b border-white/10 transition hover:bg-white/[0.025] last:border-0"
                      >
                        <td className="px-5 py-5">
                          <button
                            onClick={() => setSelected(customer)}
                            className="text-left"
                          >
                            <p className="font-bold hover:underline">
                              {customer.name || "Unnamed Customer"}
                            </p>
                            <p className="mt-1 text-xs text-white/35">
                              {customer.id.slice(0, 8)}...
                            </p>
                          </button>
                        </td>

                        <td className="px-5 py-5">
                          <p className="text-sm text-white/75">
                            {customer.email || "—"}
                          </p>
                          <p className="mt-1 text-sm text-white/45">
                            {customer.phone || "—"}
                          </p>
                        </td>

                        <td className="px-5 py-5">
                          <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-sm font-bold">
                            <ShoppingBag size={14} />
                            {customerOrderList.length}
                          </span>
                        </td>

                        <td className="px-5 py-5 text-sm font-bold">
                          ₹{customerSpent(customer.id).toLocaleString("en-IN")}
                        </td>

                        <td className="px-5 py-5 text-sm text-white/45">
                          {customer.created_at
                            ? new Date(
                                customer.created_at
                              ).toLocaleDateString("en-IN")
                            : "—"}
                        </td>

                        <td className="px-5 py-5 text-right">
                          <button
                            onClick={() => setSelected(customer)}
                            className="rounded-xl bg-white px-4 py-2 text-xs font-black text-black transition hover:bg-white/90"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] border border-white/10 bg-neutral-950 shadow-2xl sm:rounded-[2rem]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-neutral-950/95 px-6 py-5 backdrop-blur">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/35">
                  Customer Profile
                </p>
                <h2 className="mt-1 text-2xl font-black">
                  {selected.name || "Unnamed Customer"}
                </h2>
              </div>

              <button
                onClick={() => setSelected(null)}
                className="rounded-xl border border-white/10 p-2 text-white/60 hover:text-white"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid gap-3 sm:grid-cols-3">
                <a
                  href={phoneUrl(selected.phone)}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold"
                >
                  <Phone size={16} />
                  Call
                </a>

                <a
                  href={whatsappUrl(selected.phone)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold"
                >
                  <MessageCircle size={16} />
                  WhatsApp
                </a>

                <a
                  href={emailUrl(selected.email)}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold"
                >
                  <Mail size={16} />
                  Email
                </a>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs text-white/35">Email</p>
                  <p className="mt-2 break-all font-medium">
                    {selected.email || "—"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs text-white/35">Phone</p>
                  <p className="mt-2 font-medium">
                    {selected.phone || "—"}
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-bold">Order History</h3>
                  <span className="text-sm text-white/40">
                    {customerOrders(selected.id).length} orders
                  </span>
                </div>

                <div className="space-y-2">
                  {customerOrders(selected.id).map((order) => (
                    <a
                      key={order.id}
                      href={`/admin/orders?order=${encodeURIComponent(
                        order.order_id
                      )}`}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]"
                    >
                      <div>
                        <p className="font-bold">{order.order_id}</p>
                        <p className="mt-1 text-xs text-white/35">
                          {new Date(order.created_at).toLocaleDateString(
                            "en-IN"
                          )}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold">
                          ₹{Number(order.total || 0).toLocaleString("en-IN")}
                        </p>
                        <p className="mt-1 text-xs capitalize text-white/40">
                          {String(order.order_status || "pending").replace(
                            /_/g,
                            " "
                          )}
                        </p>
                      </div>
                    </a>
                  ))}

                  {customerOrders(selected.id).length === 0 && (
                    <div className="rounded-2xl border border-white/10 p-8 text-center text-sm text-white/35">
                      No orders yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/45">Total Spent</span>
                  <span className="text-xl font-black">
                    ₹{customerSpent(selected.id).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
