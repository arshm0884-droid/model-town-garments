"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  ShoppingBag,
  Users,
  Package,
  Tags,
  Megaphone,
  Image,
  Settings,
  Truck,
  RotateCcw,
  MessageCircle,
  FileText,
  ChevronRight,
  AlertTriangle,
  Plus,
  ExternalLink,
  RefreshCw,
  IndianRupee,
  Clock3,
  CheckCircle,
  XCircle,
  PackageCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Order = {
  id: string;
  order_id: string;
  total: number | null;
  order_status: string | null;
  payment_status: string | null;
  refund_status: string | null;
  return_status: string | null;
  created_at: string;
};

type Product = {
  id: string;
  name: string;
  stock: number | null;
};

const modules = [
  {
    title: "Orders",
    description: "Orders, status, delivery and customer communication.",
    href: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    title: "Products",
    description: "Products, pricing, stock, sizes, colors and visibility.",
    href: "/admin/products",
    icon: Package,
  },
  {
    title: "Customers",
    description: "Customer profiles, orders, addresses and activity.",
    href: "/admin/customers",
    icon: Users,
  },
  {
    title: "Banners",
    description: "Homepage banners and promotional sections.",
    href: "/admin/banners",
    icon: Image,
  },
  {
    title: "Offers",
    description: "Campaigns, discounts and promotional offers.",
    href: "/admin/offers",
    icon: Megaphone,
  },
  {
    title: "Coupons",
    description: "Discount coupon codes and usage controls.",
    href: "/admin/coupons",
    icon: Tags,
  },
  {
    title: "Returns & Refunds",
    description: "Review returns and manage refund status.",
    href: "/account/returns",
    icon: RotateCcw,
  },
  {
    title: "WhatsApp",
    description: "Customer communication and order messaging.",
    href: "/admin/settings",
    icon: MessageCircle,
  },
  {
    title: "Website Settings",
    description: "Store, shipping, policies and website controls.",
    href: "/admin/settings",
    icon: Settings,
  },
];

function money(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function statusLabel(value: string | null) {
  if (!value) return "Pending";
  return value.replaceAll("_", " ").replace(/\b\w/g, (x) => x.toUpperCase());
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));

  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [dateFilter, setDateFilter] = useState<
    "today" | "yesterday" | "all" | "custom"
  >("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  async function loadDashboard(showRefresh = false) {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      setError("");

      const supabase = createClient();

      const [ordersResult, productsResult, customersResult] = await Promise.all(
        [
          supabase
            .from("orders")
            .select(
              "id, order_id, total, order_status, payment_status, refund_status, return_status, created_at",
            )
            .order("created_at", { ascending: false })
            .limit(100),

          supabase
            .from("products")
            .select("id, name, stock")
            .order("name", { ascending: true }),

          supabase
            .from("orders")
            .select("customer_id", { count: "exact", head: true })
            .not("customer_id", "is", null),
        ],
      );

      if (ordersResult.error) throw ordersResult.error;
      if (productsResult.error) throw productsResult.error;

      setOrders((ordersResult.data || []) as Order[]);
      setProducts((productsResult.data || []) as Product[]);
      setCustomerCount(customersResult.count || 0);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();

    const interval = window.setInterval(() => {
      loadDashboard(true);
    }, 60000);

    <style jsx global>{`
      .admin-dashboard-filter-fix select,
      .admin-dashboard-filter-fix button,
      .admin-dashboard-filter-fix label {
        color: #334155 !important;
      }

      .admin-dashboard-filter-fix select {
        background: #ffffff !important;
        border-color: #e2e8f0 !important;
      }

      .admin-dashboard-filter-fix button {
        background: #ffffff !important;
      }
    `}</style>;

    return () => window.clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const now = new Date();

    const dateKey = (value: string | null | undefined) => {
      if (!value) return "";
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(value));
    };

    const today = dateKey(now.toISOString());

    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = dateKey(yesterdayDate.toISOString());

    const todayKey = dateKey(now.toISOString());
    const yesterdayKey = dateKey(yesterdayDate.toISOString());

    const customRangeValid =
      dateFilter !== "custom" ||
      (!!customFrom && !!customTo && customFrom <= customTo);

    const filteredOrders = !customRangeValid
      ? []
      : dateFilter === "today"
        ? orders.filter((order) => dateKey(order.created_at) === todayKey)
        : dateFilter === "yesterday"
          ? orders.filter((order) => dateKey(order.created_at) === yesterdayKey)
          : dateFilter === "custom"
            ? orders.filter((order) => {
                const date = dateKey(order.created_at);
                return date >= customFrom && date <= customTo;
              })
            : orders;

    const paidOrders = filteredOrders.filter(
      (order) => order.payment_status === "verified",
    );

    const sales = paidOrders.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0,
    );

    const pending = filteredOrders.filter(
      (order) =>
        order.payment_status !== "verified" &&
        ["pending", "submitted"].includes(order.order_status || ""),
    ).length;

    const rejected = filteredOrders.filter(
      (order) =>
        ["failed", "rejected"].includes(order.payment_status || "") ||
        ["failed", "rejected"].includes(order.order_status || ""),
    ).length;

    const cancelled = filteredOrders.filter(
      (order) => order.order_status === "cancelled",
    ).length;

    const refunded = filteredOrders.filter(
      (order) =>
        order.payment_status === "refunded" ||
        order.refund_status === "refunded",
    ).length;

    const delivered = filteredOrders.filter(
      (order) => order.order_status === "delivered",
    ).length;

    const confirmedOrders = filteredOrders.filter(
      (order) => order.order_status === "confirmed",
    ).length;

    const packedOrders = filteredOrders.filter(
      (order) => order.order_status === "packed",
    ).length;

    const shippedOrders = filteredOrders.filter(
      (order) => order.order_status === "shipped",
    ).length;

    const outForDeliveryOrders = filteredOrders.filter(
      (order) => order.order_status === "out_for_delivery",
    ).length;

    const deliveredOrders = filteredOrders.filter(
      (order) => order.order_status === "delivered",
    ).length;

    const cancelledOrders = filteredOrders.filter(
      (order) => order.order_status === "cancelled",
    ).length;

    const failedOrders = filteredOrders.filter(
      (order) =>
        ["failed", "rejected"].includes(order.payment_status || "") ||
        ["failed", "rejected"].includes(order.order_status || ""),
    ).length;

    const refundedOrders = filteredOrders.filter(
      (order) =>
        order.payment_status === "refunded" ||
        order.refund_status === "refunded",
    ).length;

    const lowStock = products.filter(
      (product) => Number(product.stock || 0) <= 5,
    ).length;

    const returns = filteredOrders.filter(
      (order) =>
        ["requested", "approved", "processing"].includes(
          order.return_status || "",
        ) || ["requested", "processing"].includes(order.refund_status || ""),
    ).length;

    return {
      totalOrders: filteredOrders.length,
      todayOrders: filteredOrders.length,
      todaySales: sales,
      sales,
      paidOrders: paidOrders.length,
      pending,
      rejected,
      cancelled,
      refunded,
      delivered,
      confirmedOrders,
      packedOrders,
      shippedOrders,
      outForDeliveryOrders,
      deliveredOrders,
      cancelledOrders,
      failedOrders,
      refundedOrders,
      lowStock,
      returns,
    };
  }, [orders, products, dateFilter, customFrom, customTo]);

  const recentOrders = orders.slice(0, 8);

  const lowStockProducts = products
    .filter((product) => Number(product.stock || 0) <= 5)
    .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0))
    .slice(0, 6);

  return (
    <main className="mt-admin">
      <div className="mt-admin-shell">
        <header className="mt-admin-header">
          <div>
            <span className="mt-admin-eyebrow">MODEL TOWN GARMENTS</span>
            <h1>Admin Control Center</h1>
            <p>Complete store management from one place.</p>
          </div>

          <div className="mt-admin-header-actions">
            <button
              className="mt-admin-outline-btn"
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
            >
              <RefreshCw
                size={16}
                className={refreshing ? "mt-admin-spin" : ""}
              />
              {refreshing ? "Refreshing" : "Refresh"}
            </button>

            <Link href="/" className="mt-admin-outline-btn">
              <ExternalLink size={16} />
              View Store
            </Link>

            <Link href="/admin/products" className="mt-admin-primary-btn">
              <Plus size={17} />
              Add Product
            </Link>
          </div>
        </header>

        {error && (
          <div className="mt-admin-error">
            <AlertTriangle size={18} />
            <div>
              <strong>Dashboard data could not be loaded</strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="mr-2 text-xs font-semibold uppercase tracking-wider text-white/40">
            Order Date
          </span>

          <button
            type="button"
            onClick={() => setDateFilter("today")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              dateFilter === "today"
                ? "bg-white text-black"
                : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            Today
          </button>

          <button
            type="button"
            onClick={() => setDateFilter("yesterday")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              dateFilter === "yesterday"
                ? "bg-white text-black"
                : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            Yesterday
          </button>

          <button
            type="button"
            onClick={() => setDateFilter("all")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              dateFilter === "all"
                ? "bg-white text-black"
                : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            All Orders
          </button>

          <button
            type="button"
            onClick={() => setDateFilter("custom")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              dateFilter === "custom"
                ? "bg-white text-black"
                : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            Custom
          </button>

          {dateFilter === "custom" && (
            <>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white outline-none"
              />
              <span className="text-xs font-bold text-white/40">TO</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white outline-none"
              />
            </>
          )}
        </div>

        <section className="mt-admin-stat-grid">
          <div className="mt-admin-stat-card">
            <div className="mt-admin-stat-icon">
              <CheckCircle size={19} />
            </div>
            <span>Confirmed Orders</span>
            <strong>{loading ? "…" : stats.confirmedOrders}</strong>
            <small>Payment verified</small>
          </div>

          <div className="mt-admin-stat-card">
            <div className="mt-admin-stat-icon">
              <Package size={19} />
            </div>
            <span>Packed Orders</span>
            <strong>{loading ? "…" : stats.packedOrders}</strong>
            <small>Ready for dispatch</small>
          </div>

          <div className="mt-admin-stat-card">
            <div className="mt-admin-stat-icon">
              <Truck size={19} />
            </div>
            <span>Shipped Orders</span>
            <strong>{loading ? "…" : stats.shippedOrders}</strong>
            <small>In transit</small>
          </div>

          <div className="mt-admin-stat-card">
            <div className="mt-admin-stat-icon">
              <Truck size={19} />
            </div>
            <span>Out for Delivery</span>
            <strong>{loading ? "…" : stats.outForDeliveryOrders}</strong>
            <small>Arriving today</small>
          </div>

          <div className="mt-admin-stat-card">
            <div className="mt-admin-stat-icon">
              <PackageCheck size={19} />
            </div>
            <span>Delivered Orders</span>
            <strong>{loading ? "…" : stats.deliveredOrders}</strong>
            <small>Successfully delivered</small>
          </div>

          <div className="mt-admin-stat-card">
            <div className="mt-admin-stat-icon">
              <XCircle size={19} />
            </div>
            <span>Cancelled Orders</span>
            <strong>{loading ? "…" : stats.cancelledOrders}</strong>
            <small>Cancelled</small>
          </div>

          <div className="mt-admin-stat-card">
            <div className="mt-admin-stat-icon">
              <AlertTriangle size={19} />
            </div>
            <span>Rejected / Failed</span>
            <strong>{loading ? "…" : stats.failedOrders}</strong>
            <small>Failed orders</small>
          </div>

          <div className="mt-admin-stat-card">
            <div className="mt-admin-stat-icon">
              <IndianRupee size={19} />
            </div>
            <span>Refunded Orders</span>
            <strong>{loading ? "…" : stats.refundedOrders}</strong>
            <small>Refund processed</small>
          </div>

          <div className="mt-admin-stat-card">
            <div className="mt-admin-stat-icon">
              <ShoppingBag size={19} />

              {dateFilter === "custom" &&
                customFrom &&
                customTo &&
                customFrom > customTo && (
                  <span className="basis-full text-xs font-bold text-red-300">
                    From date cannot be later than To date.
                  </span>
                )}
            </div>
            <span>Total Orders</span>
            <strong>{loading ? "…" : stats.totalOrders}</strong>
            <small>
              {dateFilter === "today"
                ? "Orders today"
                : dateFilter === "yesterday"
                  ? "Orders yesterday"
                  : "All orders"}
            </small>
          </div>

          <div className="mt-admin-stat-card">
            <div className="mt-admin-stat-icon">
              <IndianRupee size={19} />
            </div>
            <span>Sales</span>
            <strong>{loading ? "…" : money(stats.sales)}</strong>
            <small>Verified payments only</small>
          </div>

          <div className="mt-admin-stat-card">
            <div className="mt-admin-stat-icon">
              <CheckCircle size={19} />
            </div>
            <span>Paid Orders</span>
            <strong>{loading ? "…" : stats.paidOrders}</strong>
            <small>Payment verified</small>
          </div>

          <div className="mt-admin-stat-card">
            <div className="mt-admin-stat-icon">
              <Users size={19} />
            </div>
            <span>Customers</span>
            <strong>{loading ? "…" : customerCount}</strong>
            <small>Customers with orders</small>
          </div>
        </section>

        <section className="mt-admin-alert-grid">
          <div className="mt-admin-alert-card">
            <Clock3 size={18} />
            <div>
              <strong>Pending Orders</strong>
              <span>{loading ? "…" : stats.pending}</span>
            </div>
          </div>

          <div className="mt-admin-alert-card">
            <AlertTriangle size={18} />
            <div>
              <strong>Rejected / Failed</strong>
              <span>{loading ? "…" : stats.rejected}</span>
            </div>
          </div>

          <div className="mt-admin-alert-card">
            <XCircle size={18} />
            <div>
              <strong>Cancelled</strong>
              <span>{loading ? "…" : stats.cancelled}</span>
            </div>
          </div>

          <div className="mt-admin-alert-card">
            <RotateCcw size={18} />
            <div>
              <strong>Refunded</strong>
              <span>{loading ? "…" : stats.refunded}</span>
            </div>
          </div>

          <div className="mt-admin-alert-card">
            <PackageCheck size={18} />
            <div>
              <strong>Delivered</strong>
              <span>{loading ? "…" : stats.delivered}</span>
            </div>
          </div>

          <div className="mt-admin-alert-card">
            <Package size={18} />
            <div>
              <strong>Low Stock</strong>
              <span>{loading ? "…" : stats.lowStock}</span>
            </div>
          </div>
        </section>

        <section className="mt-admin-live-grid">
          <div className="mt-admin-panel">
            <div className="mt-admin-panel-heading">
              <div>
                <span>ORDERS</span>
                <h2>Recent orders</h2>
              </div>
              <Link href="/admin/orders">
                View all <ChevronRight size={15} />
              </Link>
            </div>

            {loading ? (
              <div className="mt-admin-empty">Loading orders…</div>
            ) : recentOrders.length === 0 ? (
              <div className="mt-admin-empty">No orders found yet.</div>
            ) : (
              <div className="mt-admin-order-list">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders?order=${order.id}`}
                    className="mt-admin-order-row"
                  >
                    <div className="mt-admin-order-main">
                      <strong>{order.order_id}</strong>
                      <span>
                        <Clock3 size={12} />
                        {timeAgo(order.created_at)}
                      </span>
                    </div>

                    <div className="mt-admin-order-right">
                      <strong>{money(Number(order.total || 0))}</strong>
                      <span
                        className={`mt-admin-status status-${order.order_status || "pending"}`}
                      >
                        {statusLabel(order.order_status)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="mt-admin-panel">
            <div className="mt-admin-panel-heading">
              <div>
                <span>INVENTORY</span>
                <h2>Stock alerts</h2>
              </div>
              <Link href="/admin/products">
                Manage <ChevronRight size={15} />
              </Link>
            </div>

            {loading ? (
              <div className="mt-admin-empty">Loading inventory…</div>
            ) : lowStockProducts.length === 0 ? (
              <div className="mt-admin-empty">
                <Package size={20} />
                <span>All products have healthy stock.</span>
              </div>
            ) : (
              <div className="mt-admin-stock-list">
                {lowStockProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/admin/products?edit=${product.id}`}
                    className="mt-admin-stock-row"
                  >
                    <div>
                      <strong>{product.name}</strong>
                      <span>Inventory warning</span>
                    </div>

                    <b
                      className={
                        Number(product.stock || 0) === 0
                          ? "mt-stock-zero"
                          : "mt-stock-low"
                      }
                    >
                      {Number(product.stock || 0) === 0
                        ? "OUT"
                        : `${Number(product.stock || 0)} left`}
                    </b>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-admin-quick">
          <div className="mt-admin-section-heading">
            <div>
              <span>QUICK ACTIONS</span>
              <h2>Run your store faster</h2>
            </div>
          </div>

          <div className="mt-admin-quick-grid">
            <Link href="/admin/products" className="mt-admin-quick-card">
              <Package size={20} />
              <div>
                <strong>Add Product</strong>
                <span>Create a new product</span>
              </div>
              <ChevronRight size={17} />
            </Link>

            <Link href="/admin/orders" className="mt-admin-quick-card">
              <ShoppingBag size={20} />
              <div>
                <strong>Manage Orders</strong>
                <span>Process customer orders</span>
              </div>
              <ChevronRight size={17} />
            </Link>

            <Link href="/admin/banners" className="mt-admin-quick-card">
              <Image size={20} />
              <div>
                <strong>Homepage</strong>
                <span>Update banners and sections</span>
              </div>
              <ChevronRight size={17} />
            </Link>

            <Link href="/admin/settings" className="mt-admin-quick-card">
              <Settings size={20} />
              <div>
                <strong>Store Settings</strong>
                <span>Control website configuration</span>
              </div>
              <ChevronRight size={17} />
            </Link>
          </div>
        </section>

        <section className="mt-admin-module-section">
          <div className="mt-admin-section-heading">
            <div>
              <span>STORE MANAGEMENT</span>
              <h2>Everything in one place</h2>
            </div>
          </div>

          <div className="mt-admin-module-grid">
            {modules.map((module) => {
              const Icon = module.icon;

              return (
                <Link
                  key={module.title}
                  href={module.href}
                  className="mt-admin-module-card"
                >
                  <div className="mt-admin-module-icon">
                    <Icon size={20} />
                  </div>

                  <div className="mt-admin-module-copy">
                    <h3>{module.title}</h3>
                    <p>{module.description}</p>
                  </div>

                  <ChevronRight size={18} className="mt-admin-arrow" />
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-admin-notice">
          <div className="mt-admin-notice-icon">
            <Settings size={20} />
          </div>
          <div>
            <strong>Admin-first architecture</strong>
            <p>
              Store configuration is being moved into centralized controls. The
              goal is to manage products, orders, customers, homepage, offers,
              shipping, WhatsApp and content without editing source code.
            </p>
          </div>
        </section>

        <footer className="mt-admin-footer">
          <div>
            <Truck size={17} />
            <span>Orders & Shipping</span>
          </div>
          <div>
            <FileText size={17} />
            <span>Policies & Content</span>
          </div>
          <div>
            <MessageCircle size={17} />
            <span>WhatsApp Commerce</span>
          </div>
          <div>
            <Settings size={17} />
            <span>Store Configuration</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
