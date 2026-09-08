"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Category = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
};

type ProductCount = {
  category_id: string | null;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    slug: "",
  });

  async function loadCategories() {
    setLoading(true);

    const [categoriesResult, productsResult] = await Promise.all([
      supabase
        .from("categories")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("products")
        .select("category_id"),
    ]);

    if (categoriesResult.error) {
      alert(categoriesResult.error.message);
      setLoading(false);
      return;
    }

    const categoryData = (categoriesResult.data ?? []) as Category[];
    setCategories(categoryData);

    const counts: Record<string, number> = {};

    ((productsResult.data ?? []) as ProductCount[]).forEach((product) => {
      if (product.category_id) {
        counts[product.category_id] =
          (counts[product.category_id] || 0) + 1;
      }
    });

    setProductCounts(counts);
    setLoading(false);
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function resetForm() {
    setForm({
      name: "",
      slug: "",
    });
    setEditing(null);
  }

  function editCategory(category: Category) {
    setEditing(category);

    setForm({
      name: category.name || "",
      slug: category.slug || "",
    });

    setShowForm(true);
  }

  function makeSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  async function saveCategory() {
    const name = form.name.trim();

    if (!name) {
      alert("Category name is required.");
      return;
    }

    setSaving(true);

    const slug = form.slug.trim() || makeSlug(name);

    const payload = {
      name,
      slug,
    };

    const result = editing
      ? await supabase
          .from("categories")
          .update(payload)
          .eq("id", editing.id)
      : await supabase
          .from("categories")
          .insert({
            ...payload,
            is_active: true,
          });

    if (result.error) {
      alert(result.error.message);
      setSaving(false);
      return;
    }

    alert(editing ? "Category updated." : "Category added.");

    resetForm();
    setShowForm(false);
    setSaving(false);

    await loadCategories();
  }

  async function toggleCategory(category: Category) {
    const { error } = await supabase
      .from("categories")
      .update({
        is_active: !category.is_active,
      })
      .eq("id", category.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadCategories();
  }

  async function deleteCategory(category: Category) {
    const count = productCounts[category.id] || 0;

    if (count > 0) {
      alert(
        `"${category.name}" has ${count} product(s). Move those products to another category before deleting it.`
      );
      return;
    }

    if (!confirm(`Delete "${category.name}" permanently?`)) {
      return;
    }

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", category.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadCategories();
  }

  const filtered = categories.filter((category) =>
    `${category.name} ${category.slug}`
      .toLowerCase()
      .includes(search.toLowerCase().trim())
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
              <h1 className="text-3xl font-bold">Categories</h1>
              <p className="mt-1 text-sm text-white/40">
                Manage product categories without editing code.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="rounded-2xl bg-white px-5 py-3 font-semibold text-black"
            >
              + Add Category
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-7 sm:px-8">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories..."
          className="mb-6 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30"
        />

        {showForm && (
          <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-7">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {editing ? "Edit Category" : "Add Category"}
                </h2>
                <p className="mt-1 text-xs text-white/40">
                  Category changes will be reflected wherever categories are
                  loaded from Supabase.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="text-white/50 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <input
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                placeholder="Category name — Men"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30"
              />

              <input
                value={form.slug}
                onChange={(e) =>
                  setForm({
                    ...form,
                    slug: e.target.value,
                  })
                }
                placeholder="Slug — men"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30"
              />
            </div>

            <button
              type="button"
              onClick={saveCategory}
              disabled={saving}
              className="mt-5 w-full rounded-2xl bg-white py-3.5 font-semibold text-black disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editing
                  ? "Update Category"
                  : "Add Category"}
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-white/40">
            Loading categories...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] py-20 text-center">
            <p className="text-lg font-semibold">No categories found</p>
            <p className="mt-2 text-sm text-white/40">
              Create your first product category.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead className="border-b border-white/10 bg-white/[0.04]">
                  <tr>
                    <th className="px-5 py-4 text-left text-sm text-white/50">
                      Category
                    </th>

                    <th className="px-5 py-4 text-left text-sm text-white/50">
                      Slug
                    </th>

                    <th className="px-5 py-4 text-left text-sm text-white/50">
                      Products
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
                  {filtered.map((category) => {
                    const count = productCounts[category.id] || 0;

                    return (
                      <tr
                        key={category.id}
                        className="border-b border-white/10 last:border-0"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold">
                            {category.name}
                          </p>

                          <p className="mt-1 text-xs text-white/30">
                            Created{" "}
                            {new Date(
                              category.created_at
                            ).toLocaleDateString("en-IN")}
                          </p>
                        </td>

                        <td className="px-5 py-4 font-mono text-sm text-white/60">
                          {category.slug}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold">
                            {count}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => toggleCategory(category)}
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              category.is_active
                                ? "bg-green-500/10 text-green-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {category.is_active
                              ? "Active"
                              : "Inactive"}
                          </button>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => editCategory(category)}
                              className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteCategory(category)}
                              className="rounded-xl border border-red-500/20 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                            >
                              Delete
                            </button>
                          </div>
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
    </main>
  );
}
