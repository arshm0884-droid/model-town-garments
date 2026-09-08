"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Banner = {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  button_text: string | null;
  button_url: string | null;
  sort_order: number;
  is_active: boolean;
};

const emptyForm = {
  title: "",
  subtitle: "",
  image_url: "",
  button_text: "",
  button_url: "",
  sort_order: "0",
};

const blankForm = { ...emptyForm };

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function load() {
    const { data, error } = await supabase
      .from("store_banners")
      .select("*")
      .order("sort_order");

    if (error) alert(error.message);
    else setBanners((data ?? []) as Banner[]);
  }

  useEffect(() => {
    load();
  }, []);

  function editBanner(banner: Banner) {
    setEditingId(banner.id);
    setForm({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      image_url: banner.image_url || "",
      button_text: banner.button_text || "",
      button_url: banner.button_url || "",
      sort_order: String(banner.sort_order ?? 0),
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(blankForm);
    setShowForm(false);
  }

  async function saveBanner() {
    if (!form.title.trim() && !form.image_url.trim()) {
      alert("Banner title or image URL is required.");
      return;
    }

    setSaving(true);

    const payload = {
      title: form.title.trim() || null,
      subtitle: form.subtitle.trim() || null,
      image_url: form.image_url.trim() || null,
      button_text: form.button_text.trim() || null,
      button_url: form.button_url.trim() || null,
      sort_order: Number(form.sort_order || 0),
    };

    const query = editingId
      ? supabase.from("store_banners").update(payload).eq("id", editingId)
      : supabase.from("store_banners").insert({
          ...payload,
          is_active: true,
        });

    const { error } = await query;

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    setForm(blankForm);
    setEditingId(null);
    setShowForm(false);
    await load();
  }

  async function toggle(banner: Banner) {
    const { error } = await supabase
      .from("store_banners")
      .update({ is_active: !banner.is_active })
      .eq("id", banner.id);

    if (error) alert(error.message);
    else await load();
  }

  async function remove(banner: Banner) {
    if (!confirm("Delete this banner?")) return;

    const { error } = await supabase
      .from("store_banners")
      .delete()
      .eq("id", banner.id);

    if (error) alert(error.message);
    else await load();
  }

  const input =
    "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-white/25";

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-white/10 px-5 py-5 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <a href="/admin" className="text-sm text-white/40">
            ← Admin Dashboard
          </a>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Banners</h1>
              <p className="mt-1 text-sm text-white/40">
                Manage homepage promotional banners.
              </p>
            </div>

            <button
              onClick={() => {
              if (showForm) cancelEdit();
              else {
                setForm(blankForm);
                setEditingId(null);
                setShowForm(true);
              }
            }}
              className="rounded-2xl bg-white px-5 py-3 font-black text-black"
            >
              + Add Banner
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {showForm && (
          <div className="mb-7 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                placeholder="Title"
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                className={input}
              />
              <input
                placeholder="Subtitle"
                value={form.subtitle}
                onChange={(e) =>
                  setForm({ ...form, subtitle: e.target.value })
                }
                className={input}
              />
              <input
                placeholder="Image URL"
                value={form.image_url}
                onChange={(e) =>
                  setForm({ ...form, image_url: e.target.value })
                }
                className={input}
              />
              <input
                placeholder="Button Text"
                value={form.button_text}
                onChange={(e) =>
                  setForm({ ...form, button_text: e.target.value })
                }
                className={input}
              />
              <input
                placeholder="Button URL"
                value={form.button_url}
                onChange={(e) =>
                  setForm({ ...form, button_url: e.target.value })
                }
                className={input}
              />
              <input
                type="number"
                placeholder="Sort Order"
                value={form.sort_order}
                onChange={(e) =>
                  setForm({ ...form, sort_order: e.target.value })
                }
                className={input}
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={saveBanner}
                disabled={saving}
                className="rounded-2xl bg-white px-6 py-3 font-black text-black disabled:opacity-50"
              >
                {saving ? "Saving..." : editingId ? "Update Banner" : "Save Banner"}
              </button>

              <button
                onClick={cancelEdit}
                disabled={saving}
                className="rounded-2xl border border-white/10 px-6 py-3 font-bold text-white/70"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-bold">
                    {banner.title || "Untitled Banner"}
                  </h2>
                  <p className="mt-1 text-sm text-white/40">
                    {banner.subtitle || "No subtitle"}
                  </p>
                  <p className="mt-2 text-xs text-white/30">
                    Order: {banner.sort_order} ·{" "}
                    {banner.is_active ? "Active" : "Inactive"}
                  </p>

                  {banner.image_url && (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                      <img
                        src={banner.image_url}
                        alt={banner.title || "Banner preview"}
                        loading="lazy"
                        className="h-32 w-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggle(banner)}
                    className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold"
                  >
                    {banner.is_active ? "Disable" : "Enable"}
                  </button>

                  <button
                    onClick={() => remove(banner)}
                    className="rounded-xl bg-red-500 px-4 py-2 text-xs font-bold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {banners.length === 0 && (
            <div className="rounded-3xl border border-white/10 p-12 text-center text-white/40">
              No banners yet.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
