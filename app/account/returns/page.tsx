"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RotateCcw, Package, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Order = {
  id: string;
  order_id: string;
  total: number;
  order_status: string;
  return_status?: string;
  refund_status?: string;
  created_at: string;
};

export default function ReturnsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();

      if (!auth.user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("orders")
        .select(
          "id, order_id, total, order_status, return_status, refund_status, created_at"
        )
        .eq("customer_id", auth.user.id)
        .order("created_at", { ascending: false });

      setOrders((data || []) as Order[]);
      setLoading(false);
    };

    load();
  }, []);

  const relevant = orders.filter(
    (o) =>
      o.return_status ||
      o.refund_status ||
      o.order_status === "delivered" ||
      o.order_status === "returned"
  );

  return (
    <main className="mtg-customer-page mt-account-simple-page">
      <div className="mt-simple-shell">
        <header className="mt-simple-header">
          <span>MY ACCOUNT</span>
          <h1>Returns & Refunds</h1>
          <p>View return requests and refund status.</p>
        </header>

        {loading ? (
          <div className="mt-orders-loading">
            <div />
            <div />
          </div>
        ) : relevant.length === 0 ? (
          <div className="mt-simple-empty">
            <RotateCcw size={30} />
            <h2>No returns or refunds</h2>
            <p>Your eligible return and refund information will appear here.</p>
            <Link href="/account/orders">View Orders</Link>
          </div>
        ) : (
          <div className="mt-return-list">
            {relevant.map((order) => (
              <Link
                href={`/account/orders?order=${order.id}`}
                className="mt-return-card"
                key={order.id}
              >
                <div className="mt-return-icon">
                  <Package size={20} />
                </div>

                <div>
                  <strong>{order.order_id}</strong>
                  <span>
                    {new Date(order.created_at).toLocaleDateString("en-IN")}
                  </span>

                  <div className="mt-return-statuses">
                    {order.return_status && (
                      <b>Return: {order.return_status}</b>
                    )}
                    {order.refund_status && (
                      <b>Refund: {order.refund_status}</b>
                    )}
                  </div>
                </div>

                <ChevronRight size={18} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
