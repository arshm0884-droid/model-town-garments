"use client";

import { useEffect, useState } from "react";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Address = {
  id: string;
  label?: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  is_default?: boolean;
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "Uttar Pradesh",
    pincode: "",
  });

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href =
          "/login?redirect=/account/addresses";
        return;
      }

      const { data, error } = await supabase
        .from("saved_addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Addresses load error:", error);
        setAddresses([]);
      } else {
        setAddresses((data || []) as Address[]);
      }

      setLoading(false);
    };

    load();
  }, []);

  const save = async () => {
    if (
      !form.name.trim() ||
      !/^\d{10}$/.test(form.phone.trim()) ||
      !form.address.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !/^\d{6}$/.test(form.pincode.trim())
    ) {
      alert("Please enter valid address details.");
      return;
    }

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href =
        "/login?redirect=/account/addresses";
      return;
    }

    const shouldBeDefault = addresses.length === 0;

    if (shouldBeDefault) {
      await supabase
        .from("saved_addresses")
        .update({ is_default: false })
        .eq("user_id", user.id);
    }

    const { data, error } = await supabase
      .from("saved_addresses")
      .insert({
        user_id: user.id,
        label: "Home",
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        is_default: shouldBeDefault,
      })
      .select()
      .single();

    if (error) {
      console.error("Address save error:", error);
      alert(error.message);
      return;
    }

    setAddresses((current) => [...current, data as Address]);
    setForm({
      name: "",
      phone: "",
      address: "",
      city: "",
      state: "Uttar Pradesh",
      pincode: "",
    });
    setOpen(false);
  };

  const remove = async (id: string) => {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("saved_addresses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Address delete error:", error);
      return;
    }

    setAddresses((current) =>
      current.filter((item) => item.id !== id)
    );
  };

  return (
    <main className="mtg-customer-page mt-account-simple-page">
      <div className="mt-simple-shell">
        <header className="mt-simple-header">
          <span>MY ACCOUNT</span>
          <h1>Saved Addresses</h1>
          <p>Manage your delivery addresses.</p>
        </header>

        <button
          type="button"
          className="mt-address-add"
          onClick={() => setOpen(!open)}
        >
          <Plus size={18} />
          Add New Address
        </button>

        {open && (
          <div className="mt-address-form">
            {[
              ["name", "Full name"],
              ["phone", "Phone number"],
              ["address", "Complete address"],
              ["city", "City"],
              ["state", "State"],
              ["pincode", "Pincode"],
            ].map(([key, label]) => (
              <input
                key={key}
                placeholder={label}
                value={form[key as keyof typeof form]}
                onChange={(e) =>
                  setForm({
                    ...form,
                    [key]: e.target.value,
                  })
                }
              />
            ))}

            <div className="mt-address-form-actions">
              <button
                type="button"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>

              <button type="button" onClick={save}>
                Save Address
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="mt-orders-loading">
            <div />
            <div />
          </div>
        ) : addresses.length === 0 ? (
          <div className="mt-simple-empty">
            <MapPin size={30} />
            <h2>No saved addresses</h2>
            <p>Add an address for faster checkout.</p>
          </div>
        ) : (
          <div className="mt-address-list">
            {addresses.map((item) => (
              <article
                className="mt-address-card"
                key={item.id}
              >
                <div className="mt-address-icon">
                  <MapPin size={19} />
                </div>

                <div>
                  <strong>{item.name}</strong>
                  <span>{item.phone}</span>

                  <p>
                    {item.address}, {item.city}, {item.state} -{" "}
                    {item.pincode}
                  </p>

                  {item.is_default && (
                    <small>Default address</small>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  aria-label="Remove address"
                >
                  <Trash2 size={17} />
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
