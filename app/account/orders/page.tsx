"use client";
import { storeData } from "@/data/storeData";

import { useEffect, useState } from "react";
import { ArrowLeft, Package, RefreshCw, Truck } from "lucide-react";
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

type StatusHistory = {
  id: string;
  status: string;
  changed_at: string;
  note: string | null;
};

type PaymentHistory = {
  id: string;
  status: string;
  changed_at: string;
  reference: string | null;
  note: string | null;
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
  refund_amount?: number | null;
  refund_reference?: string | null;
  refund_reason?: string | null;
  refunded_at?: string | null;
  refund_status?: string | null;
  refund_note?: string | null;
  refund_processed_at?: string | null;
  refund_initiated_at?: string | null;
  refund_completed_at?: string | null;
  return_reason?: string | null;
  return_status?: string | null;
  return_requested_at?: string | null;
  return_processed_at?: string | null;
  return_note?: string | null;
  notes: string | null;
  created_at: string;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  customer?: Customer | null;
  items?: OrderItem[];
  statusHistory?: StatusHistory[];
  paymentHistory?: PaymentHistory[];
};

const ORDER_STEPS = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
];

function getOrderStep(status: string) {
  return ORDER_STEPS.indexOf(status);
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getPaymentLabel(order: Order) {
  if (order.payment_status === "verified") return "Payment Confirmed";
  if (order.payment_status === "failed") return "Payment Failed";
  if (order.payment_status === "refunded") return "Payment Refunded";
  if (order.order_status === "cancelled") return "Payment Cancelled";
  return "Payment Pending";
}

export default function OrdersPage() {
  const router = useRouter();
  const supabase = createClient();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [reordering, setReordering] = useState<string | null>(null);

  const reorder = async (order: Order) => {
    if (!order.items?.length) {
      alert("No items found in this order.");
      return;
    }

    setReordering(order.id);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      for (const item of order.items) {
        const product = await supabase
          .from("products")
          .select("id")
          .eq("name", item.product_name)
          .maybeSingle();

        if (product.error || !product.data) continue;

        const { error } = await supabase
          .from("shopping_carts")
          .upsert(
            {
              user_id: user.id,
              product_id: product.data.id,
              size: item.size,
              color: item.color,
              quantity: item.quantity,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "user_id,product_id,size,color",
            }
          );

        if (error) {
          console.error("Reorder cart error:", error);
        }
      }

      alert("Items added to your cart.");
    } catch (error) {
      console.error("Reorder error:", error);
      alert("Unable to reorder this order.");
    } finally {
      setReordering(null);
    }
  };

  async function loadOrders() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    // Orders belong to the authenticated Supabase user.
    // Do not depend on phone-number matching.
    const customerId = user.id;

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (orderError) {
      console.error("Customer orders load error:", orderError);
      setOrders([]);
      setLoading(false);
      return;
    }

    const rawOrders = (orderData || []) as Order[];

    if (rawOrders.length === 0) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const orderIds = rawOrders.map((order) => order.id);

    const [{ data: customerData }, { data: itemData }, { data: historyData }] =
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
        supabase
          .from("order_status_history")
          .select("id, order_id, status, changed_at, note")
          .in("order_id", orderIds)
          .order("changed_at", { ascending: true }),
      ]);

    const customer = (customerData?.[0] || null) as Customer | null;
    const items = (itemData || []) as OrderItem[];
    const history = (historyData || []) as (StatusHistory & {
      order_id: string;
    })[];

    const finalOrders = rawOrders.map((order) => ({
      ...order,
      customer,
      items: items.filter((item) => item.order_id === order.id),
      statusHistory: history
        .filter((entry) => entry.order_id === order.id)
        .map(({ order_id, ...entry }) => entry),
    }));

    setOrders(finalOrders);
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();

    const interval = window.setInterval(() => {
      loadOrders();
    }, 30000);

    return () => window.clearInterval(interval);
  }, []);

  async function requestReturn(order: Order) {
    if (order.order_status !== "delivered") {
      return;
    }

    if (
      order.return_status &&
      ["requested", "approved", "processing", "completed"].includes(
        order.return_status
      )
    ) {
      alert("A return request already exists for this order.");
      return;
    }

    const reason = window.prompt(
      "Why do you want to return this order?"
    );

    if (!reason?.trim()) {
      return;
    }

    const confirmed = window.confirm(
      `Request return for order ${order.order_id}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch("/api/orders/return", {
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
        alert(result.error || "Unable to submit return request.");
        return;
      }

      alert("Return request submitted successfully.");
      await loadOrders();
    } catch (error) {
      console.error("Return request error:", error);
      alert("Unable to submit return request.");
    }
  }

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
      <main className="mtg-customer-page min-h-screen bg-[#f7f9fc] p-5">
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
                    {order.order_status === "out_for_delivery" && (
                      <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                        <p className="flex items-center gap-2 text-sm font-black text-blue-800">
                          <Truck className="h-4 w-4" />
                          Arriving Today
                        </p>
                        <p className="mt-1 text-xs font-medium text-blue-700">
                          Your order is out for delivery and should arrive today.
                        </p>
                      </div>
                    )}

                    {order.order_status === "delivered" && (
                      <div className="mb-5 rounded-2xl border border-green-100 bg-green-50 p-4">
                        <p className="text-sm font-black text-green-800">
                          ✓ Delivered
                        </p>
                        <p className="mt-1 text-xs font-medium text-green-700">
                          Your order has been delivered successfully.
                        </p>
                      </div>
                    )}

                    {order.order_status === "cancelled" && (
                      <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 p-4">
                        <p className="text-sm font-black text-red-700">
                          Order Cancelled
                        </p>
                        <p className="mt-1 text-xs font-medium text-red-600">
                          This order has been cancelled and is no longer active.
                        </p>
                      </div>
                    )}


                  <div className="mb-6">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black">Order Tracking</p>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Live Timeline
                      </span>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      {(() => {
                        const timelineSteps = [
                          "pending",
                          "confirmed",
                          "packed",
                          "shipped",
                          "out_for_delivery",
                          "delivered",
                        ];

                        const history = order.statusHistory || [];

                        return (
                          <div className="space-y-0">
                            {timelineSteps.map((step, index) => {
                              const entry = history
                                .filter((item) => item.status === step)
                                .slice(-1)[0];

                              const currentIndex = timelineSteps.indexOf(
                                order.order_status
                              );

                              const active =
                                currentIndex >= index ||
                                order.order_status === step;

                              const label = step
                                .replaceAll("_", " ")
                                .replace(/\\b\\w/g, (char) => char.toUpperCase());

                              return (
                                <div key={step} className="flex gap-3">
                                  <div className="flex flex-col items-center">
                                    <div
                                      className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
                                        active
                                          ? "bg-[#2563eb] ring-4 ring-blue-100"
                                          : "bg-slate-300"
                                      }`}
                                    />
                                    {index < timelineSteps.length - 1 && (
                                      <div
                                        className={`h-12 w-px ${
                                          currentIndex > index
                                            ? "bg-[#2563eb]"
                                            : "bg-slate-200"
                                        }`}
                                      />
                                    )}
                                  </div>

                                  <div className="min-w-0 pb-4">
                                    <p
                                      className={`text-xs font-black ${
                                        active
                                          ? "text-[#102a56]"
                                          : "text-slate-400"
                                      }`}
                                    >
                                      {label}
                                    </p>

                                    {entry ? (
                                      <p className="mt-1 text-[10px] font-medium text-slate-500">
                                        {new Date(entry.changed_at).toLocaleString(
                                          "en-IN",
                                          {
                                            dateStyle: "medium",
                                            timeStyle: "short",
                                          }
                                        )}
                                      </p>
                                    ) : (
                                      <p className="mt-1 text-[10px] text-slate-400">
                                        {active && step === "pending"
                                          ? new Date(
                                              order.created_at
                                            ).toLocaleString("en-IN", {
                                              dateStyle: "medium",
                                              timeStyle: "short",
                                            })
                                          : "Not reached yet"}
                                      </p>
                                    )}

                                    {entry?.note && (
                                      <p className="mt-1 text-[10px] text-slate-500">
                                        {entry.note}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}

                            {(order.order_status === "cancelled" ||
                              order.order_status === "returned") && (
                              <div className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-red-500 ring-4 ring-red-100" />
                                </div>

                                <div className="min-w-0 pb-1">
                                  <p className="text-xs font-black capitalize text-red-600">
                                    {order.order_status}
                                  </p>
                                  <p className="mt-1 text-[10px] font-medium text-slate-500">
                                    {order.cancelled_at
                                      ? new Date(
                                          order.cancelled_at
                                        ).toLocaleString("en-IN", {
                                          dateStyle: "medium",
                                          timeStyle: "short",
                                        })
                                      : "Status updated"}
                                  </p>
                                  {order.cancellation_reason && (
                                    <p className="mt-1 text-[10px] text-slate-500">
                                      {order.cancellation_reason}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
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
                        {order.payment_status === "verified"
                                                      ? "Payment Confirmed"
                                                      : order.order_status === "cancelled"
                                                        ? "Payment Cancelled"
                                                        : "Payment Pending"}
                      </p>

                      {(order.return_status || order.refund_status) && (
                        <div className="mt-3 rounded-xl border border-orange-100 bg-orange-50 p-3">
                          {order.return_status && (
                            <>
                              <p className="text-xs font-black text-orange-700">
                                RETURN STATUS
                              </p>
                              <p className="mt-1 text-xs font-semibold capitalize text-slate-600">
                                {order.return_status.replaceAll("_", " ")}
                              </p>
                              {order.return_reason && (
                                <p className="mt-1 text-xs text-slate-500">
                                  Reason: {order.return_reason}
                                </p>
                              )}
                              {order.return_note && (
                                <p className="mt-1 text-xs text-slate-500">
                                  Note: {order.return_note}
                                </p>
                              )}
                            </>
                          )}

                          {order.refund_status && (
                            <>
                              <p className="mt-3 text-xs font-black text-orange-700">
                                REFUND STATUS
                              </p>
                          <p className="text-xs font-black text-orange-700">
                            REFUND STATUS
                          </p>

                          <p className="mt-1 text-xs font-semibold capitalize text-slate-600">
                            Status: {order.refund_status.replaceAll("_", " ")}
                          </p>

                          {order.refund_amount != null && (
                            <p className="mt-1 text-xs font-semibold text-slate-600">
                              Amount: ₹{Number(order.refund_amount).toLocaleString("en-IN")}
                            </p>
                          )}

                          {order.refund_reference && (
                            <p className="mt-1 break-all text-xs text-slate-500">
                              Reference: {order.refund_reference}
                            </p>
                          )}

                          {order.refund_reason && (
                            <p className="mt-1 text-xs text-slate-500">
                              Reason: {order.refund_reason}
                            </p>
                          )}

                          {order.refund_note && (
                            <p className="mt-1 text-xs text-slate-500">
                              Note: {order.refund_note}
                            </p>
                          )}

                          {order.refund_completed_at && (
                            <p className="mt-1 text-xs text-slate-500">
                              Completed: {new Date(order.refund_completed_at).toLocaleString("en-IN", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </p>
                          )}
                            </>
                          )}
                        </div>
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
                    <button
                      type="button"
                      onClick={() => reorder(order)}
                      disabled={reordering === order.id}
                      className="flex flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-black text-[#102a56] transition hover:bg-slate-50 disabled:opacity-60"
                    >
                      {reordering === order.id ? "Adding…" : "Reorder"}
                    </button>

                    {order.payment_status === "verified" && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const response = await fetch(
                              `/api/orders/invoice?orderId=${encodeURIComponent(order.order_id)}`
                            );

                            const data = await response.json();

                            if (!response.ok) {
                              throw new Error(
                                data.error || "Unable to load invoice"
                              );
                            }

                            if (data.order?.payment_status !== "verified") {
                              throw new Error(
                                "Invoice is available only after payment is verified."
                              );
                            }

                            const customer = data.customer || {};
                            const items = data.items || [];
                            const invoiceWindow = window.open("", "_blank");

                            if (!invoiceWindow) {
                              alert("Please allow pop-ups for the invoice.");
                              return;
                            }

                            const rows = items
                              .map(
                                (item: any) => `
                                  <tr>
                                    <td>${item.product_name || "-"}</td>
                                    <td>${item.size || "-"}</td>
                                    <td>${item.color || "-"}</td>
                                    <td>${item.quantity || 0}</td>
                                    <td>₹${Number(item.unit_price || 0).toFixed(2)}</td>
                                    <td>₹${Number(item.total || 0).toFixed(2)}</td>
                                  </tr>
                                `
                              )
                              .join("");

                            invoiceWindow.document.write(`
                              <!doctype html>
                              <html>
                              <head>
                                <title>Invoice ${data.order.order_id}</title>
                                <meta name="viewport" content="width=device-width, initial-scale=1">
                                <style>
                                  body{
                                    font-family:Arial,sans-serif;
                                    padding:28px;
                                    color:#102a56;
                                    max-width:900px;
                                    margin:auto
                                  }
                                  .header{
                                    display:flex;
                                    justify-content:space-between;
                                    gap:30px;
                                    border-bottom:2px solid #102a56;
                                    padding-bottom:18px
                                  }
                                  .muted{
                                    color:#64748b;
                                    font-size:12px
                                  }
                                  .box{
                                    border:1px solid #e2e8f0;
                                    border-radius:10px;
                                    padding:15px;
                                    margin:20px 0
                                  }
                                  table{
                                    width:100%;
                                    border-collapse:collapse;
                                    margin-top:15px
                                  }
                                  th,td{
                                    border-bottom:1px solid #e2e8f0;
                                    padding:9px 5px;
                                    text-align:left;
                                    font-size:12px
                                  }
                                  th{background:#f8fafc}
                                  .total{
                                    margin-left:auto;
                                    max-width:320px;
                                    margin-top:20px
                                  }
                                  .total div{
                                    display:flex;
                                    justify-content:space-between;
                                    padding:5px
                                  }
                                  .grand{
                                    border-top:2px solid #102a56;
                                    font-size:17px;
                                    font-weight:bold;
                                    margin-top:7px;
                                    padding-top:10px!important
                                  }
                                  .verified{
                                    background:#ecfdf5;
                                    border:1px solid #bbf7d0;
                                    color:#166534
                                  }
                                  .print{
                                    background:#102a56;
                                    color:white;
                                    border:0;
                                    border-radius:8px;
                                    padding:10px 18px;
                                    margin-bottom:20px
                                  }
                                  @media print{
                                    .print{display:none}
                                    body{padding:8px}
                                  }
                                </style>
                              </head>
                              <body>
                                <button class="print" onclick="window.print()">
                                  Print / Save as PDF
                                </button>

                                <div class="header">
                                  <div>
                                    <h1>MODEL TOWN GARMENTS</h1>
                                    <div class="muted">
                                      Jama Masjid Road, Joya, Amroha, Uttar Pradesh
                                    </div>
                                    <div class="muted">
                                      Phone: 9917001830
                                    </div>
                                  </div>

                                  <div>
                                    <h2>INVOICE</h2>
                                    <div class="muted">
                                      Order: ${data.order.order_id}
                                    </div>
                                    <div class="muted">
                                      Date: ${new Date(
                                        data.order.created_at
                                      ).toLocaleString("en-IN")}
                                    </div>
                                  </div>
                                </div>

                                <div class="box">
                                  <h3>Bill To</h3>
                                  <div>${customer.name || "-"}</div>
                                  <div>${customer.email || "-"}</div>
                                  <div>${customer.phone || "-"}</div>
                                  <div class="muted">
                                    ${customer.address || ""},
                                    ${customer.city || ""},
                                    ${customer.state || ""} -
                                    ${customer.pincode || ""}
                                  </div>
                                </div>

                                <table>
                                  <thead>
                                    <tr>
                                      <th>Product</th>
                                      <th>Size</th>
                                      <th>Color</th>
                                      <th>Qty</th>
                                      <th>Price</th>
                                      <th>Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>${rows}</tbody>
                                </table>

                                <div class="total">
                                  <div>
                                    <span>Subtotal</span>
                                    <span>₹${Number(
                                      data.order.subtotal || 0
                                    ).toFixed(2)}</span>
                                  </div>

                                  <div>
                                    <span>Offer Discount</span>
                                    <span>-₹${Number(
                                      data.order.offer_discount || 0
                                    ).toFixed(2)}</span>
                                  </div>

                                  <div>
                                    <span>Coupon Discount</span>
                                    <span>-₹${Number(
                                      data.order.coupon_discount || 0
                                    ).toFixed(2)}</span>
                                  </div>

                                  <div>
                                    <span>Delivery</span>
                                    <span>₹${Number(
                                      data.order.delivery_charge || 0
                                    ).toFixed(2)}</span>
                                  </div>

                                  <div class="grand">
                                    <span>Grand Total</span>
                                    <span>₹${Number(
                                      data.order.total || 0
                                    ).toFixed(2)}</span>
                                  </div>
                                </div>

                                <div class="box verified">
                                  <strong>Payment Status:</strong>
                                  Payment verified.
                                  <br>
                                  Your order is confirmed.
                                </div>
                              </body>
                              </html>
                            `);

                            invoiceWindow.document.close();
                          } catch (error) {
                            console.error("Invoice error:", error);
                            alert(
                              error instanceof Error
                                ? error.message
                                : "Unable to generate invoice."
                            );
                          }
                        }}
                        className="flex flex-1 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3.5 text-sm font-black text-[#102a56] transition hover:bg-blue-100"
                      >
                        Download Invoice
                      </button>
                    )}

{order.payment_status !== "verified" && (
                    <a
                      href={`https://wa.me/${(() => {
                        const raw = String(
                          storeData.whatsapp || storeData.phone || ""
                        ).replace(/\D/g, "");
                        return raw.length === 10 ? `91${raw}` : raw;
                      })()}?text=${encodeURIComponent(
                        `Hello Model Town Garments, I want to make payment for my order ${order.order_id}. Please share the payment details.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-1 items-center justify-center rounded-2xl bg-[#102a56] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#173d79]"
                    >
                      PAY NOW ON WHATSAPP
                    </a>
                    )}

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
