"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Offer = {
  id: string;
  name: string;
  category_id: string | null;
  discount_type: string;
  discount_value: number;
  is_active: boolean;
};

type Category = {
  id: string;
  name: string;
};

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category_id: "",
    discount_type: "percentage",
    discount_value: "",
  });

  async function loadData() {
    setLoading(true);

    const [offersResult, categoriesResult] =
      await Promise.all([
        supabase
          .from("offers")
          .select("*")
          .order("created_at", { ascending: false }),

        supabase
          .from("categories")
          .select("id,name")
          .eq("is_active", true)
          .order("name"),
      ]);

    if (offersResult.error) {
      alert(offersResult.error.message);
    } else {
      setOffers((offersResult.data ?? []) as Offer[]);
    }

    if (categoriesResult.error) {
      alert(categoriesResult.error.message);
    } else {
      setCategories(
        (categoriesResult.data ?? []) as Category[]
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function addOffer() {
    if (
      !form.name.trim() ||
      !form.discount_value
    ) {
      alert("Offer name and discount are required.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("offers")
      .insert({
        name: form.name.trim(),
        category_id: form.category_id || null,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        is_active: true,
      });

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    setForm({
      name: "",
      category_id: "",
      discount_type: "percentage",
      discount_value: "",
    });

    setShowForm(false);
    await loadData();
  }

  async function toggleOffer(offer: Offer) {
    const { error } = await supabase
      .from("offers")
      .update({
        is_active: !offer.is_active,
      })
      .eq("id", offer.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadData();
  }

  async function deleteOffer(offer: Offer) {
    if (!confirm(`Delete "${offer.name}"?`)) {
      return;
    }

    const { error } = await supabase
      .from("offers")
      .delete()
      .eq("id", offer.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadData();
  }

  function categoryName(categoryId: string | null) {
    if (!categoryId) return "All categories";

    return (
      categories.find(
        (category) => category.id === categoryId
      )?.name || "Category"
    );
  }

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

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                Offers
              </h1>

              <p className="mt-1 text-sm text-white/40">
                Manage category and store offers.
              </p>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="rounded-2xl bg-white px-5 py-3 font-semibold text-black"
            >
              + Add Offer
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-7 sm:px-8">
        {showForm && (
          <div className="mb-7 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="mb-5 text-xl font-bold">
              New Offer
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <input
                placeholder="Offer name"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
              />

              <select
                value={form.category_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category_id: e.target.value,
                  })
                }
                className="rounded-2xl border border-white/10 bg-neutral-900 px-4 py-3 outline-none"
              >
                <option value="">
                  All categories
                </option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>

              <select
                value={form.discount_type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    discount_type: e.target.value,
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
                min="0"
                placeholder="Discount value"
                value={form.discount_value}
                onChange={(e) =>
                  setForm({
                    ...form,
                    discount_value: e.target.value,
                  })
                }
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
              />
            </div>

            <button
              onClick={addOffer}
              disabled={saving}
              className="mt-5 w-full rounded-2xl bg-white py-3 font-semibold text-black disabled:opacity-50"
            >
              {saving ? "Saving..." : "Create Offer"}
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-white/40">
            Loading offers...
          </div>
        ) : offers.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] py-20 text-center text-white/40">
            No offers found.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold">
                      {offer.name}
                    </h2>

                    <p className="mt-2 text-sm text-white/50">
                      {categoryName(
                        offer.category_id
                      )}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      offer.is_active
                        ? "bg-green-500/10 text-green-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {offer.is_active
                      ? "Active"
                      : "Inactive"}
                  </span>
                </div>

                <p className="mt-5 text-2xl font-bold">
                  {offer.discount_type ===
                  "percentage"
                    ? `${offer.discount_value}% OFF`
                    : `₹${offer.discount_value} OFF`}
                </p>

                <div className="mt-5 flex gap-2">
                  <button
                    onClick={() =>
                      toggleOffer(offer)
                    }
                    className="flex-1 rounded-xl border border-white/10 px-3 py-2 text-sm"
                  >
                    {offer.is_active
                      ? "Deactivate"
                      : "Activate"}
                  </button>

                  <button
                    onClick={() =>
                      deleteOffer(offer)
                    }
                    className="rounded-xl border border-red-500/20 px-3 py-2 text-sm text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
