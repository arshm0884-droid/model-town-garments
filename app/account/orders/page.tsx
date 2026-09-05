"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Package, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type OrderItem = {
  id: string;
  order_id: string;
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  unit_price: number;
  total: number;
};

type Customer = {
  id: string;
  name: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
};

type Order = {
  id: string;
  order_id: string;
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

export default function OrdersPage() {
  const router = useRouter();
  const supabase = createClient();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  async function loadOrders() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const metadata = user.user_metadata || {};
    const phone = (metadata.phone || "").replace(/\D/g, "");

    if (!phone) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const { data: customers } = await supabase
      .from("customers")
      .select("id")
      .eq("phone", phone)
      .limit(1);

    const customerId = customers?.[0]?.id;

    if (!customerId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const { data: orderData } = await supabase
      .from("orders")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    const rawOrders = (orderData || []) as Order[];

    if (rawOrders.length === 0) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const orderIds = rawOrders.map((order) => order.id);

    const [{ data: customerData }, { data: itemData }] =
      await Promise.all([
        supabase
          .from("customers")
          .select("*")
          .eq("id", customerId)
          .limit(1),
        supabase
          .from("order_items")
          .select("*")
          .in("order_id", orderIds),
      ]);

    const customer = (customerData?.[0] || null) as Customer | null;
    const items = (itemData || []) as OrderItem[];

    const finalOrders = rawOrders.map((order) => ({
      ...order,
      customer,
      items: items.filter((item) => item.order_id === order.id),
    }));

    setOrders(finalOrders);
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function cancelOrder(order: Order) {
    if (!["pending", "confirmed"].includes(order.order_status)) {
      return;
    }

    const reason = window.prompt(
      "Why do you want to cancel this order?"
    );

    if (!reason?.trim()) {
      return;
    }

    const confirmed = window.confirm(
      `Cancel order ${order.order_id}?`
    );

    if (!confirmed) {
      return;
    }

    setCancelling(order.id);

    try {
      const response = await fetch("/api/orders/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: order.order_id,
          reason: reason.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || "Unable to cancel order.");
        return;
      }

      alert("Order cancelled successfully.");
      await loadOrders();
    } catch (error) {
      console.error("Cancel order error:", error);
      alert("Unable to cancel order.");
    } finally {
      setCancelling(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f9fc] p-5">
        <div className="mx-auto max-w-5xl animate-pulse">
          <div className="h-8 w-40 rounded bg-slate-200" />
          <div className="mt-6 h-40 rounded-3xl bg-white" />
          <div className="mt-4 h-40 rounded-3xl bg-white" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] pb-16 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => router.push("/account")}
            className="flex items-center gap-2 text-sm font-bold text-slate-600"
          >
            <ArrowLeft className="h-5 w-5" />
            My Account
          </button>

          <button
            type="button"
            onClick={loadOrders}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white"
            aria-label="Refresh orders"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-7 sm:px-6 sm:pt-10">
        <p className="text-xs font-black tracking-[0.22em] text-[#2563eb]">
          MY ACCOUNT
        </p>

        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          My Orders
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Track and manage your complete order history.
        </p>

        {orders.length === 0 ? (
          <div className="mt-7 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <Package className="mx-auto h-10 w-10 text-slate-300" />

            <p className="mt-4 text-lg font-black">
              No orders yet
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Your orders will appear here after you place an order.
            </p>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-6 rounded-2xl bg-[#102a56] px-6 py-3 text-sm font-black text-white"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="mt-7 space-y-5">
            {orders.map((order) => (
              <div
                key={order.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="border-b border-slate-100 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black tracking-wider text-slate-400">
                        ORDER ID
                      </p>

                      <p className="mt-1 text-sm font-black">
                        {order.order_id}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(order.created_at).toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-black uppercase text-amber-700">
                        Payment: {order.payment_status}
                      </span>

                      <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase text-blue-700">
                        Order: {order.order_status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="mb-6">
                    <p className="text-sm font-black">Order Tracking</p>

                    <div className="mt-4 grid grid-cols-5 gap-1">
                      {[
                        "pending",
                        "confirmed",
                        "packed",
                        "shipped",
                        "delivered",
                      ].map((step, index) => {
                        const steps = [
                          "pending",
                          "confirmed",
                          "packed",
                          "shipped",
                          "delivered",
                        ];

                        const currentIndex = steps.indexOf(order.order_status);
                        const active = currentIndex >= index;

                        return (
                          <div key={step} className="text-center">
                            <div
                              className={`mx-auto h-3 w-3 rounded-full ${
                                active ? "bg-[#2563eb]" : "bg-slate-200"
                              }`}
                            />

                            <p
                              className={`mt-2 text-[9px] font-bold capitalize sm:text-[10px] ${
                                active ? "text-[#102a56]" : "text-slate-400"
                              }`}
                            >
                              {step}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mb-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs font-black text-slate-400">
                        DELIVERY ADDRESS
                      </p>

                      <p className="mt-2 text-sm font-bold">
                        {order.customer?.name || "Customer"}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {order.customer?.address || "Address not available"}
                        {order.customer?.city
                          ? `, ${order.customer.city}`
                          : ""}
                        {order.customer?.state
                          ? `, ${order.customer.state}`
                          : ""}
                        {order.customer?.pincode
                          ? ` - ${order.customer.pincode}`
                          : ""}
                      </p>

                      {order.customer?.phone && (
                        <p className="mt-2 text-xs font-semibold text-slate-500">
                          {order.customer.phone}
                        </p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs font-black text-slate-400">
                        PAYMENT
                      </p>

                      <p className="mt-2 text-sm font-bold capitalize">
                        {order.payment_method || "UPI"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Status: {order.payment_status}
                      </p>

                      {order.payment_reference && (
                        <p className="mt-2 break-all text-xs text-slate-500">
                          Reference: {order.payment_reference}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-sm font-black">Items</p>

                    <div className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-100">
                      {(order.items || []).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-4 p-4"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold">
                              {item.product_name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Size: {item.size} · Color: {item.color} · Qty:{" "}
                              {item.quantity}
                            </p>
                          </div>

                          <p className="shrink-0 text-sm font-black">
                            ₹{Number(item.total).toLocaleString("en-IN")}
                          </p>
                        </div>
                      ))}

                      {(order.items || []).length === 0 && (
                        <p className="p-4 text-xs text-slate-500">
                          Order items unavailable.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mb-6 flex flex-col gap-3 sm:flex-row">
                    <a
                      href={`https://wa.me/919917001830?text=${encodeURIComponent(
                        `Hello Model Town Garments, I want to make payment for my order ${order.order_id}. Please send me the payment QR for ₹${Number(order.total).toFixed(2)}.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-1 items-center justify-center rounded-2xl bg-[#102a56] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#173d79]"
                    >
                      Request Payment QR on WhatsApp
                    </a>

                    <button
                      type="button"
                      onClick={loadOrders}
                      className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-black text-slate-700"
                    >
                      Refresh Status
                    </button>

                    {["pending", "confirmed"].includes(order.order_status) && (
                      <button
                        type="button"
                        disabled={cancelling === order.id}
                        onClick={() => cancelOrder(order)}
                        className="rounded-2xl border border-red-200 bg-white px-5 py-3.5 text-sm font-black text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                      >
                        {cancelling === order.id
                          ? "Cancelling…"
                          : "Cancel Order"}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-slate-400">Subtotal</p>
                      <p className="mt-1 font-black">
                        ₹{Number(order.subtotal).toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Discount</p>
                      <p className="mt-1 font-black">
                        ₹
                        {(
                          Number(order.offer_discount || 0) +
                          Number(order.coupon_discount || 0)
                        ).toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Delivery</p>
                      <p className="mt-1 font-black">
                        ₹{Number(order.delivery_charge || 0).toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Total</p>
                      <p className="mt-1 text-lg font-black text-[#102a56]">
                        ₹{Number(order.total).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
