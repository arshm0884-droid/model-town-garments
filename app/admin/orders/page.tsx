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
  cancellation_reason: string | null;
  cancelled_at: string | null;
  created_at: string;
  customer?: Customer | null;
  items?: OrderItem[];
};

const statuses = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
];

function formatStatusLabel(status: string) {
  return status
    .replaceAll("_", " ")
    .replace(/\\b\\w/g, (char) => char.toUpperCase());
}

const paymentStatuses = [
  "pending",
  "submitted",
  "verified",
  "failed",
  "refunded",
];

export default function OrdersPage() {
  const [paymentQr, setPaymentQr] = useState<{
    orderId: string;
    amount: number;
    qr: string;
  } | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentForm, setPaymentForm] = useState<{
    orderId: string;
    utr: string;
    amount: string;
    date: string;
    details: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

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
      ...new Set(rawOrders.map((order) => order.customer_id).filter(Boolean)),
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
        customers.find((customer) => customer.id === order.customer_id) ?? null,
      items: items.filter((item) => item.order_id === order.id),
    }));

    setOrders(finalOrders);
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  function getNextStatus(status: string) {
    const next: Record<string, string> = {
      pending: "confirmed",
      submitted: "confirmed",
      confirmed: "packed",
      packed: "shipped",
      shipped: "out_for_delivery",
      out_for_delivery: "delivered",
    };

    return next[status] || "";
  }

  async function updateOrderStatus(id: string, order_status: string) {
    const currentOrder = orders.find((order) => order.id === id);

    if (!currentOrder) {
      alert("Order not found.");
      return;
    }

    const allowedTransitions: Record<string, string[]> = {
      pending: ["confirmed", "cancelled"],
      submitted: ["confirmed", "cancelled"],
      confirmed: ["packed", "cancelled"],
      packed: ["shipped"],
      shipped: ["out_for_delivery"],
      out_for_delivery: ["delivered"],
      delivered: [],
      cancelled: [],
      returned: [],
    };

    const currentStatus = currentOrder.order_status || "pending";

    if (
      order_status !== currentStatus &&
      !allowedTransitions[currentStatus]?.includes(order_status)
    ) {
      alert(
        `Invalid status change: ${currentStatus.replaceAll("_", " ")} → ${order_status.replaceAll("_", " ")}`,
      );
      return;
    }

    if (
      [
        "confirmed",
        "packed",
        "shipped",
        "out_for_delivery",
        "delivered",
      ].includes(order_status) &&
      currentOrder.payment_status !== "verified"
    ) {
      alert("Payment must be verified before this order can be processed.");
      return;
    }

    const response = await fetch("/api/admin/orders/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId: id,
        status: order_status,
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      alert(result.error || "Unable to update order status.");
      return;
    }

    setOrders((current) =>
      current.map((order) =>
        order.id === id ? { ...order, order_status } : order,
      ),
    );

    alert(`Order ${order_status.replaceAll("_", " ")} successfully.`);
  }
  async function updatePaymentStatus(
    id: string,
    payment_status: string,
    paymentData?: {
      paymentReference?: string;
      paymentAmount?: number;
      paymentDate?: string;
      paymentMethodDetails?: string;
    },
  ) {
    const currentOrder = orders.find((order) => order.id === id);

    if (!currentOrder) {
      alert("Order not found.");
      return;
    }

    if (payment_status === "verified") {
      if (!paymentData?.paymentReference?.trim()) {
        alert("UTR / Transaction ID is required.");
        return;
      }

      const response = await fetch("/api/admin/orders/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: id,
          paymentStatus: "verified",
          paymentReference: paymentData.paymentReference.trim(),
          paymentAmount:
            paymentData.paymentAmount ?? Number(currentOrder.total || 0),
          paymentDate: paymentData.paymentDate
            ? new Date(paymentData.paymentDate).toISOString()
            : new Date().toISOString(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || "Payment verification failed.");
        return;
      }

      setOrders((current) =>
        current.map((order) =>
          order.id === id
            ? {
                ...order,
                payment_status: "verified",
                payment_reference: paymentData.paymentReference!.trim(),
              }
            : order,
        ),
      );

      setPaymentForm(null);

      try {
        const emailResponse = await fetch("/api/admin/orders/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            order: {
              ...currentOrder,
              payment_status: "verified",
              payment_reference: paymentData.paymentReference!.trim(),
              payment_amount:
                paymentData.paymentAmount ?? Number(currentOrder.total || 0),
              payment_verified_at: paymentData.paymentDate
                ? new Date(paymentData.paymentDate).toISOString()
                : new Date().toISOString(),
              payment_method_details:
                paymentData.paymentMethodDetails?.trim() ||
                currentOrder.payment_method ||
                "UPI",
            },
          }),
        });

        const emailResult = await emailResponse.json();

        if (!emailResponse.ok) {
          alert(
            `Payment verified, but email failed: ${
              emailResult.error || "Unknown error"
            }`,
          );
          return;
        }

        await supabase
          .from("orders")
          .update({
            payment_confirmation_sent_at: new Date().toISOString(),
          })
          .eq("id", id);

        alert("Payment verified and invoice email sent.");
      } catch (error) {
        console.error("Payment email error:", error);
        alert("Payment verified, but invoice email failed.");
      }

      return;
    }

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
        order.id === id ? { ...order, payment_status } : order,
      ),
    );
  }

  async function updateOrderNotes(id: string, notes: string) {
    const { error } = await supabase
      .from("orders")
      .update({ notes: notes.trim() || null })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setOrders((current) =>
      current.map((order) =>
        order.id === id ? { ...order, notes: notes.trim() || null } : order,
      ),
    );

    alert("Order remarks saved.");
  }

  async function generatePaymentQr(order: Order) {
    try {
      const upiUrl = `upi://pay?pa=9917001812@fam&pn=MODEL%20TOWN%20GARMENTS&am=${Number(order.total).toFixed(2)}&cu=INR&tn=${encodeURIComponent(order.order_id)}`;
      const QRCode = (await import("qrcode")).default;
      const qr = await QRCode.toDataURL(upiUrl, { width: 500, margin: 2 });
      setPaymentQr({
        orderId: order.order_id,
        amount: Number(order.total),
        qr,
      });
    } catch (error) {
      console.error("QR generation error:", error);
      alert("Payment QR generate nahi hua.");
    }
  }

  const filteredOrders = orders.filter((order) => {
    const text = search.toLowerCase().trim();
    const matchesSearch =
      !text ||
      order.order_id?.toLowerCase().includes(text) ||
      order.id?.toLowerCase().includes(text) ||
      order.customer?.name?.toLowerCase().includes(text) ||
      order.customer?.phone?.includes(text);

    const matchesStatus =
      statusFilter === "all" || order.order_status === statusFilter;

    const matchesPayment =
      paymentFilter === "all" || order.payment_status === paymentFilter;

    const dateKey = (value: string) =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(value));

    const orderDateKey = dateKey(order.created_at);
    const now = new Date();
    const todayKey = dateKey(now.toISOString());
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayKey = dateKey(yesterdayDate.toISOString());

    const matchesDate =
      dateFilter === "all"
        ? true
        : dateFilter === "today"
          ? orderDateKey === todayKey
          : dateFilter === "yesterday"
            ? orderDateKey === yesterdayKey
            : dateFilter === "custom"
              ? (!customFrom || orderDateKey >= customFrom) &&
                (!customTo || orderDateKey <= customTo)
              : true;

    return matchesSearch && matchesStatus && matchesPayment && matchesDate;
  });

  const orderCounts = {
    all: filteredOrders.length,
    pending: filteredOrders.filter((o) => o.order_status === "pending").length,
    confirmed: filteredOrders.filter((o) => o.order_status === "confirmed").length,
    packed: filteredOrders.filter((o) => o.order_status === "packed").length,
    shipped: filteredOrders.filter((o) => o.order_status === "shipped").length,
    out: filteredOrders.filter((o) => o.order_status === "out_for_delivery").length,
    delivered: filteredOrders.filter((o) => o.order_status === "delivered").length,
    cancelled: filteredOrders.filter((o) => o.order_status === "cancelled").length,
  };

  return (
    <main className="admin-orders-page">
      <header className="border-b border-white/10 px-5 py-5 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <a href="/admin" className="text-sm text-white/40 hover:text-white">
            ← Admin Dashboard
          </a>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Orders</h1>

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
        <div className="mt-admin-date-filter mb-5">
          <div className="mt-admin-date-title">Order Date</div>
          <div className="mt-admin-date-buttons">
            {([
              ["today", "Today"],
              ["yesterday", "Yesterday"],
              ["all", "All Orders"],
              ["custom", "Custom"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setDateFilter(value)}
                className={dateFilter === value ? "active" : ""}
              >
                {label}
              </button>
            ))}
          </div>
          {dateFilter === "custom" && (
            <div className="mt-admin-custom-dates">
              <label>
                <span>From</span>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
              </label>
              <label>
                <span>To</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
              </label>
            </div>
          )}
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Order ID, customer or phone..."
          className="mb-6 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400"
        />

        {loading ? (
          <div className="py-20 text-center text-white/40">
            Loading orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] py-20 text-center">
            <p className="text-lg font-semibold">No orders found</p>

            <p className="mt-2 text-sm text-white/40">
              New customer orders will appear here.
            </p>
          </div>
        ) : (
          <>
            <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Order Management
                  </h2>
                  <p className="text-sm text-slate-500">
                    {filteredOrders.length} of {orders.length} orders shown
                  </p>
                </div>

                <button
                  type="button"
                  onClick={loadOrders}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  ↻ Refresh
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
                {[
                  ["All", orderCounts.all, "all"],
                  ["Pending", orderCounts.pending, "pending"],
                  ["Confirmed", orderCounts.confirmed, "confirmed"],
                  ["Packed", orderCounts.packed, "packed"],
                  ["Shipped", orderCounts.shipped, "shipped"],
                  ["Out", orderCounts.out, "out"],
                  ["Delivered", orderCounts.delivered, "delivered"],
                  ["Cancelled", orderCounts.cancelled, "cancelled"],
                ].map(([label, count, tone]) => (
                  <div
                    key={String(label)}
                    className={`mt-order-count-card tone-${tone}`}
                  >
                    <div className="text-xs font-semibold">{label}</div>
                    <div className="mt-1 text-xl font-extrabold">{count}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search order, customer, phone..."
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                >
                  <option value="all">All Order Status</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {formatStatusLabel(status)}
                    </option>
                  ))}
                </select>

                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                >
                  <option value="all">All Payment Status</option>
                  {paymentStatuses.map((status) => (
                    <option key={status} value={status}>
                      {formatStatusLabel(status)}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setPaymentFilter("all");
                    setDateFilter("today");
                    setCustomFrom("");
                    setCustomTo("");
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Clear Filters
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-700">
                  Total: {filteredOrders.length}
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700">
                  Paid:{" "}
                  {
                    filteredOrders.filter(
                      (order) => order.payment_status === "verified",
                    ).length
                  }
                </span>
                <span className="rounded-full bg-amber-50 px-3 py-1.5 font-semibold text-amber-700">
                  Payment Pending:{" "}
                  {
                    filteredOrders.filter(
                      (order) =>
                        !["verified", "failed", "refunded"].includes(
                          order.payment_status || "",
                        ),
                    ).length
                  }
                </span>
                <span className="rounded-full bg-blue-50 px-3 py-1.5 font-semibold text-blue-700">
                  Revenue: ₹
                  {filteredOrders
                    .filter((order) => order.payment_status === "verified")
                    .reduce((sum, order) => sum + Number(order.total || 0), 0)
                    .toLocaleString("en-IN")}
                </span>
              </div>
            </section>

            <section className="space-y-4">
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
                          <p className="text-xs text-white/40">ORDER ID</p>

                          <p className="mt-1 font-mono text-lg font-bold">
                            {order.order_id}
                          </p>

                          <p className="mt-2 text-2xl font-bold">
                            ₹{Number(order.total ?? 0).toLocaleString("en-IN")}
                          </p>

                          <p className="mt-1 text-xs text-white/40">
                            {new Date(order.created_at).toLocaleString("en-IN")}
                          </p>
                        </div>

                        <div className="mb-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => generatePaymentQr(order)}
                            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                          >
                            GENERATE PAYMENT QR
                          </button>
                        </div>

                        {paymentQr?.orderId === order.order_id && (
                          <div className="mb-5 rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4">
                            <p className="text-sm font-semibold">PAYMENT QR</p>
                            <p className="mt-1 text-sm text-white/60">
                              Order: {paymentQr.orderId} · Amount: ₹
                              {paymentQr.amount.toLocaleString("en-IN")}
                            </p>
                            <img
                              src={paymentQr.qr}
                              alt="UPI Payment QR"
                              className="mt-4 h-64 w-64 rounded-xl bg-white p-3"
                            />
                            <div className="mt-4 flex flex-wrap gap-2">
                              <a
                                href={paymentQr.qr}
                                download={`payment-${paymentQr.orderId}.png`}
                                className="inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
                              >
                                DOWNLOAD QR
                              </a>

                              <button
                                type="button"
                                onClick={() => {
                                  const phone = String(
                                    order.customer?.whatsapp ||
                                      order.customer?.phone ||
                                      "",
                                  ).replace(/\D/g, "");

                                  if (!phone) {
                                    alert(
                                      "Customer WhatsApp number available nahi hai.",
                                    );
                                    return;
                                  }

                                  const message =
                                    `*MODEL TOWN GARMENTS*\n` +
                                    `Payment Request\n\n` +
                                    `Order ID: ${paymentQr.orderId}\n` +
                                    `Amount: ₹${paymentQr.amount.toLocaleString("en-IN")}\n\n` +
                                    `Please pay the exact amount using the payment QR sent by us.\n` +
                                    `After payment, please share the payment screenshot/UTR.`;

                                  window.open(
                                    `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
                                    "_blank",
                                  );
                                }}
                                className="inline-flex rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white"
                              >
                                SEND ON WHATSAPP
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs text-white/40">
                              Order Status
                            </label>

                            <select
                              value={order.order_status ?? "pending"}
                              onChange={(e) =>
                                updateOrderStatus(order.id, e.target.value)
                              }
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-slate-400"
                            >
                              {statuses.map((status) => (
                                <option key={status} value={status}>
                                  {status.charAt(0).toUpperCase() +
                                    status.slice(1)}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="mb-1 block text-xs text-white/40">
                              Payment
                            </label>

                            <select
                              value={order.payment_status ?? "pending"}
                              onChange={(e) => {
                                const value = e.target.value;

                                if (value === "verified") {
                                  setPaymentForm({
                                    orderId: order.id,
                                    utr: order.payment_reference || "",
                                    amount: String(order.total || ""),
                                    date: new Date().toISOString().slice(0, 16),
                                    details: order.payment_method || "UPI",
                                  });
                                  return;
                                }

                                updatePaymentStatus(order.id, value);
                              }}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-slate-400"
                            >
                              {paymentStatuses.map((status) => (
                                <option key={status} value={status}>
                                  {formatStatusLabel(status)}
                                </option>
                              ))}
                            </select>

                            {paymentForm?.orderId === order.id &&
                              order.payment_status !== "verified" && (
                                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                  <p className="mb-4 text-sm font-bold text-white">
                                    VERIFY PAYMENT
                                  </p>

                                  <div className="grid gap-3">
                                    <div>
                                      <label className="mb-1 block text-xs text-white/50">
                                        UTR / Transaction ID *
                                      </label>
                                      <input
                                        value={paymentForm.utr}
                                        onChange={(e) =>
                                          setPaymentForm({
                                            ...paymentForm,
                                            utr: e.target.value,
                                          })
                                        }
                                        placeholder="Enter UTR / Transaction ID"
                                        className="w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-white outline-none"
                                      />
                                    </div>

                                    <div>
                                      <label className="mb-1 block text-xs text-white/50">
                                        Payment Amount *
                                      </label>
                                      <input
                                        type="number"
                                        value={paymentForm.amount}
                                        onChange={(e) =>
                                          setPaymentForm({
                                            ...paymentForm,
                                            amount: e.target.value,
                                          })
                                        }
                                        placeholder="Payment amount"
                                        className="w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-white outline-none"
                                      />
                                    </div>

                                    <div>
                                      <label className="mb-1 block text-xs text-white/50">
                                        Payment Date & Time
                                      </label>
                                      <input
                                        type="datetime-local"
                                        value={paymentForm.date}
                                        onChange={(e) =>
                                          setPaymentForm({
                                            ...paymentForm,
                                            date: e.target.value,
                                          })
                                        }
                                        className="w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-white outline-none"
                                      />
                                    </div>

                                    <div>
                                      <label className="mb-1 block text-xs text-white/50">
                                        Payment Method / Details
                                      </label>
                                      <input
                                        value={paymentForm.details}
                                        onChange={(e) =>
                                          setPaymentForm({
                                            ...paymentForm,
                                            details: e.target.value,
                                          })
                                        }
                                        placeholder="UPI / Bank / Cash / Other"
                                        className="w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-white outline-none"
                                      />
                                    </div>

                                    <div className="flex gap-2 pt-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const amount = Number(
                                            paymentForm.amount,
                                          );

                                          if (!paymentForm.utr.trim()) {
                                            alert(
                                              "UTR / Transaction ID is required.",
                                            );
                                            return;
                                          }

                                          if (!amount || amount <= 0) {
                                            alert(
                                              "Enter a valid payment amount.",
                                            );
                                            return;
                                          }

                                          updatePaymentStatus(
                                            order.id,
                                            "verified",
                                            {
                                              paymentReference:
                                                paymentForm.utr.trim(),
                                              paymentAmount: amount,
                                              paymentDate: paymentForm.date,
                                              paymentMethodDetails:
                                                paymentForm.details.trim(),
                                            },
                                          );
                                        }}
                                        className="flex-1 rounded-xl bg-green-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-green-500"
                                      >
                                        VERIFY & CONFIRM PAYMENT
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => setPaymentForm(null)}
                                        className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-white/70 hover:bg-white/5"
                                      >
                                        CANCEL
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
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
                              <p className="text-xs text-white/40">Name</p>
                              <p className="mt-1 font-semibold">
                                {customer.name}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-white/40">Phone</p>
                              <p className="mt-1 font-semibold">
                                {customer.phone}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-white/40">City</p>
                              <p className="mt-1 font-semibold">
                                {customer.city}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-white/40">Pincode</p>
                              <p className="mt-1 font-semibold">
                                {customer.pincode}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => setExpanded(isOpen ? null : order.id)}
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
                              {customer?.city}, {customer?.state}
                              <br />
                              Pincode: {customer?.pincode}
                            </div>
                          </div>

                          <div>
                            <p className="mb-3 text-xs font-semibold tracking-wider text-white/40">
                              PAYMENT
                            </p>

                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                              <p>
                                Method: <strong>{order.payment_method}</strong>
                              </p>

                              <p className="mt-2">
                                Status: <strong>{order.payment_status}</strong>
                              </p>

                              {order.payment_reference && (
                                <p className="mt-2 break-all">
                                  Reference: {order.payment_reference}
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
                            {(order.items ?? []).map((item) => (
                              <div
                                key={item.id}
                                className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div>
                                  <p className="font-semibold">
                                    {item.product_name}
                                  </p>

                                  <p className="mt-1 text-xs text-white/40">
                                    Size: {item.size} · Color: {item.color} ·
                                    Qty: {item.quantity}
                                  </p>
                                </div>

                                <p className="font-bold">
                                  ₹
                                  {Number(item.total ?? 0).toLocaleString(
                                    "en-IN",
                                  )}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-6 grid gap-2 border-t border-white/10 pt-5 text-sm">
                          <div className="flex justify-between text-white/60">
                            <span>Subtotal</span>
                            <span>
                              ₹
                              {Number(order.subtotal ?? 0).toLocaleString(
                                "en-IN",
                              )}
                            </span>
                          </div>

                          <div className="flex justify-between text-white/60">
                            <span>Offer Discount</span>
                            <span>
                              -₹
                              {Number(order.offer_discount ?? 0).toLocaleString(
                                "en-IN",
                              )}
                            </span>
                          </div>

                          <div className="flex justify-between text-white/60">
                            <span>Coupon Discount</span>
                            <span>
                              -₹
                              {Number(
                                order.coupon_discount ?? 0,
                              ).toLocaleString("en-IN")}
                            </span>
                          </div>

                          <div className="flex justify-between text-white/60">
                            <span>Delivery</span>
                            <span>
                              ₹
                              {Number(
                                order.delivery_charge ?? 0,
                              ).toLocaleString("en-IN")}
                            </span>
                          </div>

                          {order.coupon_code && (
                            <div className="flex justify-between text-white/60">
                              <span>Coupon</span>
                              <span>{order.coupon_code}</span>
                            </div>
                          )}

                          <div className="mt-2 flex justify-between border-t border-white/10 pt-3 text-lg font-bold">
                            <span>Total</span>
                            <span>
                              ₹
                              {Number(order.total ?? 0).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>

                        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="text-sm font-black text-white">
                            Admin Remarks
                          </p>

                          <textarea
                            defaultValue={order.notes || ""}
                            id={`order-notes-${order.id}`}
                            rows={3}
                            placeholder="Add an internal/customer order remark..."
                            className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-black/10 px-3 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30"
                          />

                          <button
                            type="button"
                            onClick={() => {
                              const element = document.getElementById(
                                `order-notes-${order.id}`,
                              ) as HTMLTextAreaElement | null;

                              updateOrderNotes(order.id, element?.value || "");
                            }}
                            className="mt-3 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-[#102a56] transition hover:bg-slate-100"
                          >
                            Save Remarks
                          </button>
                        </div>

                        {order.order_status === "cancelled" &&
                          (order.cancellation_reason || order.cancelled_at) && (
                            <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm">
                              <p className="font-black text-red-300">
                                Cancellation Details
                              </p>

                              {order.cancellation_reason && (
                                <p className="mt-2 text-white/70">
                                  <strong>Reason:</strong>{" "}
                                  {order.cancellation_reason}
                                </p>
                              )}

                              {order.cancelled_at && (
                                <p className="mt-1 text-white/50">
                                  <strong>Cancelled:</strong>{" "}
                                  {new Date(order.cancelled_at).toLocaleString(
                                    "en-IN",
                                  )}
                                </p>
                              )}
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          </>
        )}
      </section>
    </main>
  );
}
