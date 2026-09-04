"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Customer = {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
};

type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  unit_price: number;
  total: number;
};

type Order = {
  id: string;
  order_id: string;
  customer_id: string;
  subtotal: number;
  offer_discount: number;
  coupon_discount: number;
  delivery_charge: number;
  total: number;
  coupon_code: string | null;
  payment_method: string;
  payment_status: string;
  order_status: string;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
  customer?: Customer | null;
  items?: OrderItem[];
};

const statuses = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

const paymentStatuses = [
  "pending",
  "submitted",
  "verified",
  "failed",
  "refunded",
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  async function loadOrders() {
    setLoading(true);

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    const rawOrders = (data ?? []) as Order[];

    const customerIds = [
      ...new Set(
        rawOrders
          .map((order) => order.customer_id)
          .filter(Boolean)
      ),
    ];

    const orderIds = rawOrders.map((order) => order.id);

    let customers: Customer[] = [];
    let items: OrderItem[] = [];

    if (customerIds.length > 0) {
      const { data: customerData } = await supabase
        .from("customers")
        .select("*")
        .in("id", customerIds);

      customers = (customerData ?? []) as Customer[];
    }

    if (orderIds.length > 0) {
      const { data: itemData } = await supabase
        .from("order_items")
        .select("*")
        .in("order_id", orderIds);

      items = (itemData ?? []) as OrderItem[];
    }

    const finalOrders = rawOrders.map((order) => ({
      ...order,
      customer:
        customers.find(
          (customer) => customer.id === order.customer_id
        ) ?? null,
      items: items.filter(
        (item) => item.order_id === order.id
      ),
    }));

    setOrders(finalOrders);
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function updateOrderStatus(
    id: string,
    order_status: string
  ) {
    const { error } = await supabase
      .from("orders")
      .update({ order_status })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setOrders((current) =>
      current.map((order) =>
        order.id === id
          ? { ...order, order_status }
          : order
      )
    );
  }

  async function updatePaymentStatus(
    id: string,
    payment_status: string
  ) {
    const { error } = await supabase
      .from("orders")
      .update({ payment_status })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setOrders((current) =>
      current.map((order) =>
        order.id === id
          ? { ...order, payment_status }
          : order
      )
    );
  }

  const filteredOrders = orders.filter((order) => {
    const customer = order.customer;

    const text = search.toLowerCase().trim();

    return (
      order.order_id.toLowerCase().includes(text) ||
      order.id.toLowerCase().includes(text) ||
      String(customer?.name ?? "")
        .toLowerCase()
        .includes(text) ||
      String(customer?.phone ?? "")
        .toLowerCase()
        .includes(text)
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

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                Orders
              </h1>

              <p className="mt-1 text-sm text-white/40">
                Manage orders, customers and payments.
              </p>
            </div>

            <button
              onClick={loadOrders}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
            >
              ↻ Refresh
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-7 sm:px-8">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Order ID, customer or phone..."
          className="mb-6 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30"
        />

        {loading ? (
          <div className="py-20 text-center text-white/40">
            Loading orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] py-20 text-center">
            <p className="text-lg font-semibold">
              No orders found
            </p>

            <p className="mt-2 text-sm text-white/40">
              New customer orders will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const customer = order.customer;
              const isOpen = expanded === order.id;

              return (
                <div
                  key={order.id}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]"
                >
                  <div className="p-5">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-xs text-white/40">
                          ORDER ID
                        </p>

                        <p className="mt-1 font-mono text-lg font-bold">
                          {order.order_id}
                        </p>

                        <p className="mt-2 text-2xl font-bold">
                          ₹
                          {Number(
                            order.total ?? 0
                          ).toLocaleString("en-IN")}
                        </p>

                        <p className="mt-1 text-xs text-white/40">
                          {new Date(
                            order.created_at
                          ).toLocaleString("en-IN")}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs text-white/40">
                            Order Status
                          </label>

                          <select
                            value={
                              order.order_status ??
                              "pending"
                            }
                            onChange={(e) =>
                              updateOrderStatus(
                                order.id,
                                e.target.value
                              )
                            }
                            className="w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none"
                          >
                            {statuses.map(
                              (status) => (
                                <option
                                  key={status}
                                  value={status}
                                >
                                  {status
                                    .charAt(0)
                                    .toUpperCase() +
                                    status.slice(1)}
                                </option>
                              )
                            )}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs text-white/40">
                            Payment
                          </label>

                          <select
                            value={
                              order.payment_status ??
                              "pending"
                            }
                            onChange={(e) =>
                              updatePaymentStatus(
                                order.id,
                                e.target.value
                              )
                            }
                            className="w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none"
                          >
                            {paymentStatuses.map(
                              (status) => (
                                <option
                                  key={status}
                                  value={status}
                                >
                                  {status
                                    .charAt(0)
                                    .toUpperCase() +
                                    status.slice(1)}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      </div>
                    </div>

                    {customer && (
                      <div className="mt-5 border-t border-white/10 pt-5">
                        <p className="mb-3 text-xs font-semibold tracking-wider text-white/40">
                          CUSTOMER
                        </p>

                        <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <p className="text-xs text-white/40">
                              Name
                            </p>
                            <p className="mt-1 font-semibold">
                              {customer.name}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-white/40">
                              Phone
                            </p>
                            <p className="mt-1 font-semibold">
                              {customer.phone}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-white/40">
                              City
                            </p>
                            <p className="mt-1 font-semibold">
                              {customer.city}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-white/40">
                              Pincode
                            </p>
                            <p className="mt-1 font-semibold">
                              {customer.pincode}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() =>
                        setExpanded(
                          isOpen ? null : order.id
                        )
                      }
                      className="mt-5 w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold hover:bg-white/10"
                    >
                      {isOpen
                        ? "Hide Order Details ↑"
                        : "View Order Details ↓"}
                    </button>
                  </div>

                  {isOpen && (
                    <div className="border-t border-white/10 bg-black/20 p-5">
                      <div className="grid gap-6 lg:grid-cols-2">
                        <div>
                          <p className="mb-3 text-xs font-semibold tracking-wider text-white/40">
                            SHIPPING ADDRESS
                          </p>

                          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/70">
                            {customer?.address}
                            <br />
                            {customer?.city},{" "}
                            {customer?.state}
                            <br />
                            Pincode:{" "}
                            {customer?.pincode}
                          </div>
                        </div>

                        <div>
                          <p className="mb-3 text-xs font-semibold tracking-wider text-white/40">
                            PAYMENT
                          </p>

                          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                            <p>
                              Method:{" "}
                              <strong>
                                {order.payment_method}
                              </strong>
                            </p>

                            <p className="mt-2">
                              Status:{" "}
                              <strong>
                                {order.payment_status}
                              </strong>
                            </p>

                            {order.payment_reference && (
                              <p className="mt-2 break-all">
                                Reference:{" "}
                                {
                                  order.payment_reference
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <p className="mb-3 text-xs font-semibold tracking-wider text-white/40">
                          ORDER ITEMS
                        </p>

                        <div className="space-y-3">
                          {(order.items ?? []).map(
                            (item) => (
                              <div
                                key={item.id}
                                className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div>
                                  <p className="font-semibold">
                                    {
                                      item.product_name
                                    }
                                  </p>

                                  <p className="mt-1 text-xs text-white/40">
                                    Size:{" "}
                                    {item.size} ·
                                    Color:{" "}
                                    {item.color} ·
                                    Qty:{" "}
                                    {item.quantity}
                                  </p>
                                </div>

                                <p className="font-bold">
                                  ₹
                                  {Number(
                                    item.total ?? 0
                                  ).toLocaleString(
                                    "en-IN"
                                  )}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <div className="mt-6 grid gap-2 border-t border-white/10 pt-5 text-sm">
                        <div className="flex justify-between text-white/60">
                          <span>Subtotal</span>
                          <span>
                            ₹
                            {Number(
                              order.subtotal ?? 0
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </span>
                        </div>

                        <div className="flex justify-between text-white/60">
                          <span>Offer Discount</span>
                          <span>
                            -₹
                            {Number(
                              order.offer_discount ?? 0
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </span>
                        </div>

                        <div className="flex justify-between text-white/60">
                          <span>Coupon Discount</span>
                          <span>
                            -₹
                            {Number(
                              order.coupon_discount ?? 0
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </span>
                        </div>

                        <div className="flex justify-between text-white/60">
                          <span>Delivery</span>
                          <span>
                            ₹
                            {Number(
                              order.delivery_charge ?? 0
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </span>
                        </div>

                        {order.coupon_code && (
                          <div className="flex justify-between text-white/60">
                            <span>Coupon</span>
                            <span>
                              {order.coupon_code}
                            </span>
                          </div>
                        )}

                        <div className="mt-2 flex justify-between border-t border-white/10 pt-3 text-lg font-bold">
                          <span>Total</span>
                          <span>
                            ₹
                            {Number(
                              order.total ?? 0
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </span>
                        </div>
                      </div>

                      {order.notes && (
                        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                          <strong>Notes:</strong>{" "}
                          {order.notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
