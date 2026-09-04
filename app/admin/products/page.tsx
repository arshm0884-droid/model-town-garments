"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Product = {
  id: string;
  name: string;
  slug: string;
  category_id: string | null;
  description: string | null;
  price: number;
  old_price: number | null;
  images: string[] | null;
  sizes: string[] | null;
  colors: string[] | null;
  stock: number;
  is_active: boolean;
  fabric: string | null;
  fit: string | null;
  pattern: string | null;
  wash_care: string | null;
  rating: number;
  review_count: number;
  badge: string | null;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    old_price: "",
    images: "",
    sizes: "",
    colors: "",
    stock: "0",
    fabric: "",
    fit: "",
    pattern: "",
    wash_care: "",
    badge: "",
  });

  async function loadProducts() {
    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
    } else {
      setProducts((data ?? []) as Product[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function resetForm() {
    setForm({
      name: "",
      slug: "",
      description: "",
      price: "",
      old_price: "",
      images: "",
      sizes: "",
      colors: "",
      stock: "0",
      fabric: "",
      fit: "",
      pattern: "",
      wash_care: "",
      badge: "",
    });
    setEditing(null);
  }

  function editProduct(product: Product) {
    setEditing(product);

    setForm({
      name: product.name ?? "",
      slug: product.slug ?? "",
      description: product.description ?? "",
      price: String(product.price ?? ""),
      old_price: String(product.old_price ?? ""),
      images: (product.images ?? []).join(", "),
      sizes: (product.sizes ?? []).join(", "),
      colors: (product.colors ?? []).join(", "),
      stock: String(product.stock ?? 0),
      fabric: product.fabric ?? "",
      fit: product.fit ?? "",
      pattern: product.pattern ?? "",
      wash_care: product.wash_care ?? "",
      badge: product.badge ?? "",
    });

    setShowForm(true);
  }

  async function saveProduct() {
    if (!form.name.trim() || !form.price) {
      alert("Product name and price are required.");
      return;
    }

    setSaving(true);

    const payload = {
      name: form.name.trim(),
      slug:
        form.slug.trim() ||
        form.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      description: form.description.trim() || null,
      price: Number(form.price),
      old_price: form.old_price
        ? Number(form.old_price)
        : null,
      images: form.images
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      sizes: form.sizes
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      colors: form.colors
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      stock: Number(form.stock || 0),
      fabric: form.fabric.trim() || null,
      fit: form.fit.trim() || null,
      pattern: form.pattern.trim() || null,
      wash_care: form.wash_care.trim() || null,
      badge: form.badge.trim() || null,
    };

    const result = editing
      ? await supabase
          .from("products")
          .update(payload)
          .eq("id", editing.id)
      : await supabase
          .from("products")
          .insert({
            ...payload,
            is_active: true,
            rating: 0,
            review_count: 0,
          });

    if (result.error) {
      alert(result.error.message);
    } else {
      alert(editing ? "Product updated." : "Product added.");
      resetForm();
      setShowForm(false);
      await loadProducts();
    }

    setSaving(false);
  }

  async function toggleProduct(product: Product) {
    const { error } = await supabase
      .from("products")
      .update({ is_active: !product.is_active })
      .eq("id", product.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadProducts();
  }

  async function deleteProduct(product: Product) {
    if (
      !confirm(
        `Delete "${product.name}" permanently?`
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadProducts();
  }

  const filtered = products.filter((product) =>
    product.name
      .toLowerCase()
      .includes(search.toLowerCase())
  );

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
                Products
              </h1>
              <p className="mt-1 text-sm text-white/40">
                Manage your complete product catalog.
              </p>
            </div>

            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="rounded-2xl bg-white px-5 py-3 font-semibold text-black"
            >
              + Add Product
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-7 sm:px-8">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="mb-6 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30"
        />

        {showForm && (
          <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-7">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editing ? "Edit Product" : "Add Product"}
              </h2>

              <button
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="text-white/50"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["name", "Product name"],
                ["slug", "Slug"],
                ["price", "Price"],
                ["old_price", "Old price"],
                ["stock", "Stock"],
                ["fabric", "Fabric"],
                ["fit", "Fit"],
                ["pattern", "Pattern"],
                ["wash_care", "Wash care"],
                ["badge", "Badge"],
                ["sizes", "Sizes — S, M, L, XL"],
                ["colors", "Colors — Black, White"],
                ["images", "Image URLs — comma separated"],
              ].map(([key, placeholder]) => (
                <input
                  key={key}
                  value={form[key as keyof typeof form]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      [key]: e.target.value,
                    })
                  }
                  placeholder={placeholder}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30"
                />
              ))}

              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
                placeholder="Description"
                rows={4}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 sm:col-span-2"
              />
            </div>

            <button
              onClick={saveProduct}
              disabled={saving}
              className="mt-5 w-full rounded-2xl bg-white py-3.5 font-semibold text-black disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editing
                  ? "Update Product"
                  : "Add Product"}
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-white/40">
            Loading products...
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="border-b border-white/10 bg-white/[0.04]">
                  <tr>
                    <th className="px-5 py-4 text-left text-sm text-white/50">
                      Product
                    </th>
                    <th className="px-5 py-4 text-left text-sm text-white/50">
                      Price
                    </th>
                    <th className="px-5 py-4 text-left text-sm text-white/50">
                      Stock
                    </th>
                    <th className="px-5 py-4 text-left text-sm text-white/50">
                      Status
                    </th>
                    <th className="px-5 py-4 text-right text-sm text-white/50">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-white/10 last:border-0"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="h-14 w-14 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="h-14 w-14 rounded-xl bg-white/10" />
                          )}

                          <div>
                            <p className="font-medium">
                              {product.name}
                            </p>
                            <p className="text-xs text-white/40">
                              {product.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        ₹{product.price}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={
                            product.stock <= 0
                              ? "text-red-400"
                              : "text-white"
                          }
                        >
                          {product.stock}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <button
                          onClick={() =>
                            toggleProduct(product)
                          }
                          className={`rounded-full px-3 py-1 text-xs ${
                            product.is_active
                              ? "bg-green-500/10 text-green-400"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {product.is_active
                            ? "Active"
                            : "Inactive"}
                        </button>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() =>
                              editProduct(product)
                            }
                            className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              deleteProduct(product)
                            }
                            className="rounded-xl border border-red-500/20 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filtered.length === 0 && (
              <div className="py-16 text-center text-white/40">
                No products found.
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
