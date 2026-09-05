"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Home,
  LogOut,
  MapPin,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AccountOrder = {
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
};

type Address = {
  id: string;
  label: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
};

export default function AccountPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [address, setAddress] = useState({
    label: "Home",
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "Uttar Pradesh",
    pincode: "",
    is_default: false,
  });

  useEffect(() => {
    async function loadAccount() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        router.replace("/login");
        return;
      }

      setUser(currentUser);

      const metadata = currentUser.user_metadata || {};
      setName(metadata.name || "");
      setPhone(metadata.phone || "");

      const { data, error: addressError } = await supabase
        .from("saved_addresses")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (!addressError) {
        setAddresses(data || []);
      }

      const normalizedPhone = (metadata.phone || "").replace(/\D/g, "");

      if (normalizedPhone) {
        const { data: customerRows } = await supabase
          .from("customers")
          .select("id")
          .eq("phone", normalizedPhone)
          .limit(1);

        const customerId = customerRows?.[0]?.id;

        if (customerId) {
          const { data: orderRows } = await supabase
            .from("orders")
            .select("*")
            .eq("customer_id", customerId)
            .order("created_at", { ascending: false });

          setOrders((orderRows || []) as AccountOrder[]);
        }
      }

      setOrdersLoading(false);
      setLoading(false);
    }

    loadAccount();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    setSavingProfile(true);

    const { data, error: updateError } = await supabase.auth.updateUser({
      data: {
        name: name.trim(),
        phone: phone.trim(),
      },
    });

    setSavingProfile(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setUser(data.user);
    setMessage("Profile updated successfully.");
  }

  async function saveAddress(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (
      !address.name.trim() ||
      !address.phone.trim() ||
      !address.address.trim() ||
      !address.city.trim() ||
      !address.state.trim() ||
      !/^\d{6}$/.test(address.pincode.trim())
    ) {
      setError("Please fill all address details correctly.");
      return;
    }

    if (!/^\d{10}$/.test(address.phone.trim())) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    setSavingAddress(true);

    if (address.is_default) {
      await supabase
        .from("saved_addresses")
        .update({ is_default: false })
        .eq("user_id", user.id);
    }

    const { data, error: insertError } = await supabase
      .from("saved_addresses")
      .insert({
        user_id: user.id,
        label: address.label,
        name: address.name.trim(),
        phone: address.phone.trim(),
        address: address.address.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        pincode: address.pincode.trim(),
        is_default: address.is_default || addresses.length === 0,
      })
      .select()
      .single();

    setSavingAddress(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setAddresses((current) => [
      ...(data.is_default
        ? current.map((item) => ({ ...item, is_default: false }))
        : current),
      data,
    ]);

    setAddress({
      label: "Home",
      name: name || "",
      phone: phone || "",
      address: "",
      city: "",
      state: "Uttar Pradesh",
      pincode: "",
      is_default: false,
    });

    setShowAddress(false);
    setMessage("Address saved successfully.");
  }

  async function deleteAddress(id: string) {
    setError("");
    setMessage("");

    const { error: deleteError } = await supabase
      .from("saved_addresses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setAddresses((current) => current.filter((item) => item.id !== id));
    setMessage("Address removed.");
  }

  async function setDefaultAddress(id: string) {
    setError("");
    setMessage("");

    const { error: resetError } = await supabase
      .from("saved_addresses")
      .update({ is_default: false })
      .eq("user_id", user.id);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    const { error: defaultError } = await supabase
      .from("saved_addresses")
      .update({ is_default: true })
      .eq("id", id)
      .eq("user_id", user.id);

    if (defaultError) {
      setError(defaultError.message);
      return;
    }

    setAddresses((current) =>
      current.map((item) => ({
        ...item,
        is_default: item.id === id,
      }))
    );

    setMessage("Default address updated.");
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f9fc] p-5">
        <div className="mx-auto max-w-5xl animate-pulse">
          <div className="h-8 w-40 rounded bg-slate-200" />
          <div className="mt-6 h-48 rounded-3xl bg-white" />
          <div className="mt-5 h-72 rounded-3xl bg-white" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] pb-16 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm font-bold text-slate-600"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to shop
          </button>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#102a56] text-sm font-black text-white">
            MT
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-7 sm:px-6 sm:pt-10">
        <div>
          <p className="text-xs font-black tracking-[0.22em] text-[#2563eb]">
            MY ACCOUNT
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Account
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage your profile and saved delivery addresses.
          </p>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <Check className="h-4 w-4" />
            {message}
          </div>
        )}

        <div className="mt-7 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#2563eb]">
                <User className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-black">Profile</h2>
                <p className="text-xs text-slate-500">
                  Your account information
                </p>
              </div>
            </div>

            <form onSubmit={saveProfile} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  Full name
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  Email
                </span>
                <input
                  value={user?.email || ""}
                  readOnly
                  className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3.5 text-sm text-slate-500 outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  Phone
                </span>
                <input
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  inputMode="numeric"
                  placeholder="10-digit mobile number"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:bg-white"
                />
              </label>

              <button
                disabled={savingProfile}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#102a56] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#173d79] disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {savingProfile ? "Saving…" : "Save Profile"}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm font-bold">Secure account</p>
                <p className="text-xs text-slate-500">
                  Email OTP authentication enabled
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 px-5 py-3.5 text-sm font-black text-red-600 transition hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#2563eb]">
                  <MapPin className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-black">Saved Addresses</h2>
                  <p className="text-xs text-slate-500">
                    {addresses.length} saved{" "}
                    {addresses.length === 1 ? "address" : "addresses"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAddress((value) => !value)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#102a56] text-white"
                aria-label="Add address"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            {showAddress && (
              <form
                onSubmit={saveAddress}
                className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 sm:p-5"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold">
                      Address label
                    </span>
                    <select
                      value={address.label}
                      onChange={(e) =>
                        setAddress((current) => ({
                          ...current,
                          label: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none"
                    >
                      <option>Home</option>
                      <option>Work</option>
                      <option>Other</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-bold">
                      Name
                    </span>
                    <input
                      value={address.name}
                      onChange={(e) =>
                        setAddress((current) => ({
                          ...current,
                          name: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-bold">
                      Phone
                    </span>
                    <input
                      value={address.phone}
                      onChange={(e) =>
                        setAddress((current) => ({
                          ...current,
                          phone: e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 10),
                        }))
                      }
                      inputMode="numeric"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none"
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-xs font-bold">
                      Complete address
                    </span>
                    <textarea
                      value={address.address}
                      onChange={(e) =>
                        setAddress((current) => ({
                          ...current,
                          address: e.target.value,
                        }))
                      }
                      rows={3}
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-bold">
                      City
                    </span>
                    <input
                      value={address.city}
                      onChange={(e) =>
                        setAddress((current) => ({
                          ...current,
                          city: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-bold">
                      State
                    </span>
                    <input
                      value={address.state}
                      onChange={(e) =>
                        setAddress((current) => ({
                          ...current,
                          state: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-bold">
                      Pincode
                    </span>
                    <input
                      value={address.pincode}
                      onChange={(e) =>
                        setAddress((current) => ({
                          ...current,
                          pincode: e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6),
                        }))
                      }
                      inputMode="numeric"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none"
                    />
                  </label>

                  <label className="flex items-center gap-2 self-end pb-3 text-sm font-bold">
                    <input
                      type="checkbox"
                      checked={address.is_default}
                      onChange={(e) =>
                        setAddress((current) => ({
                          ...current,
                          is_default: e.target.checked,
                        }))
                      }
                    />
                    Make default
                  </label>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    type="submit"
                    disabled={savingAddress}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#102a56] px-4 py-3 text-sm font-black text-white disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {savingAddress ? "Saving…" : "Save Address"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAddress(false)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 space-y-3">
              {addresses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center">
                  <Home className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-sm font-bold">
                    No saved addresses
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Add an address for faster checkout.
                  </p>
                </div>
              ) : (
                addresses.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-black">
                            {item.label}
                          </span>

                          {item.is_default && (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">
                              DEFAULT
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-sm font-bold">{item.name}</p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {item.address}, {item.city}, {item.state} -{" "}
                          {item.pincode}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {item.phone}
                        </p>
                      </div>

                      <button
                        onClick={() => deleteAddress(item.id)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-red-500 hover:bg-red-50"
                        aria-label="Delete address"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {!item.is_default && (
                      <button
                        onClick={() => setDefaultAddress(item.id)}
                        className="mt-4 text-xs font-black text-[#2563eb]"
                      >
                        Make default
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            ["Orders", "View your orders"],
            ["Wishlist", "Saved products"],
            ["Security", "Account protection"],
          ].map(([title, subtitle]) => (
            <button
              key={title}
              onClick={() => {
                if (title === "Orders") router.push("/account/orders");
                if (title === "Wishlist") router.push("/wishlist");
              }}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-sm font-black">{title}</p>
              <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
