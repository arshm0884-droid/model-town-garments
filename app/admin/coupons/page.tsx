"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Coupon = {
  id: string;
  code: string;
  type: string;
  value: number;
  minimum_order_amount: number;
  is_active: boolean;
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    code: "",
    type: "percentage",
    value: "",
    minimum_order_amount: "0",
  });

  async function loadCoupons() {
    setLoading(true);

    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) alert(error.message);
    else setCoupons((data ?? []) as Coupon[]);

    setLoading(false);
  }

  useEffect(() => {
    loadCoupons();
  }, []);

  async function addCoupon() {
    if (!form.code || !form.value) {
      alert("Coupon code and value are required.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("coupons")
      .insert({
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: Number(form.value),
        minimum_order_amount: Number(
          form.minimum_order_amount || 0
        ),
        is_active: true,
      });

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    setForm({
      code: "",
      type: "percentage",
      value: "",
      minimum_order_amount: "0",
    });

    setShowForm(false);
    await loadCoupons();
  }

  async function toggleCoupon(coupon: Coupon) {
    const { error } = await supabase
      .from("coupons")
      .update({
        is_active: !coupon.is_active,
      })
      .eq("id", coupon.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadCoupons();
  }

  async function deleteCoupon(coupon: Coupon) {
    if (!confirm(`Delete ${coupon.code}?`)) return;

    const { error } = await supabase
      .from("coupons")
      .delete()
      .eq("id", coupon.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadCoupons();
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-white/10 px-5 py-5 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <a
            href="/admin"
            className="text-sm text-white/40"
          >
            ← Admin Dashboard
          </a>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                Coupons
              </h1>
              <p className="mt-1 text-sm text-white/40">
                Manage discount coupons.
              </p>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="rounded-2xl bg-white px-5 py-3 font-semibold text-black"
            >
              + Add Coupon
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-7 sm:px-8">
        {showForm && (
          <div className="mb-7 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="mb-5 text-xl font-bold">
              New Coupon
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <input
                placeholder="Coupon code"
                value={form.code}
                onChange={(e) =>
                  setForm({
                    ...form,
                    code: e.target.value,
                  })
                }
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
              />

              <select
                value={form.type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    type: e.target.value,
                  })
                }
                className="rounded-2xl border border-white/10 bg-neutral-900 px-4 py-3 outline-none"
              >
                <option value="percentage">
                  Percentage
                </option>
                <option value="flat">
                  Flat Amount
                </option>
              </select>

              <input
                type="number"
                placeholder="Discount value"
                value={form.value}
                onChange={(e) =>
                  setForm({
                    ...form,
                    value: e.target.value,
                  })
                }
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
              />

              <input
                type="number"
                placeholder="Minimum order amount"
                value={form.minimum_order_amount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    minimum_order_amount: e.target.value,
                  })
                }
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
              />
            </div>

            <button
              onClick={addCoupon}
              disabled={saving}
              className="mt-5 w-full rounded-2xl bg-white py-3 font-semibold text-black disabled:opacity-50"
            >
              {saving ? "Saving..." : "Create Coupon"}
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-white/40">
            Loading coupons...
          </div>
        ) : (
          <div className="space-y-4">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-xl font-bold">
                    {coupon.code}
                  </p>

                  <p className="mt-1 text-sm text-white/50">
                    {coupon.type === "percentage"
                      ? `${coupon.value}% OFF`
                      : `₹${coupon.value} OFF`}
                    {" • "}
                    Min ₹
                    {coupon.minimum_order_amount}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      toggleCoupon(coupon)
                    }
                    className={`rounded-xl px-4 py-2 text-sm ${
                      coupon.is_active
                        ? "bg-green-500/10 text-green-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {coupon.is_active
                      ? "Active"
                      : "Inactive"}
                  </button>

                  <button
                    onClick={() =>
                      deleteCoupon(coupon)
                    }
                    className="rounded-xl border border-red-500/20 px-4 py-2 text-sm text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {coupons.length === 0 && (
              <div className="py-20 text-center text-white/40">
                No coupons found.
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
