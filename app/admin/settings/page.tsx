"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Settings,
  Store,
  MessageCircle,
  Truck,
  CreditCard,
  FileText,
  Globe,
  Bell,
  Save,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type FormState = {
  business_name: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;

  delivery_charge: string;
  free_delivery_above: string;
  delivery_available: boolean;
  delivery_estimate: string;

  logo_url: string;
  favicon_url: string;

  instagram_url: string;
  facebook_url: string;
  youtube_url: string;

  announcement_text: string;
  announcement_enabled: boolean;

  payment_instructions: string;
  payment_qr_url: string;
  upi_id: string;
  payment_enabled: boolean;

  about_text: string;
  contact_text: string;
  shipping_policy: string;
  return_policy: string;
  refund_policy: string;
  privacy_policy: string;
  terms_policy: string;

  order_confirmation_message: string;
  whatsapp_order_message: string;

  currency: string;
  tax_enabled: boolean;
  tax_percentage: string;

  maintenance_mode: boolean;
  maintenance_message: string;
  store_open: boolean;
};

const defaults: FormState = {
    upi_id: "",
  business_name: "MODEL TOWN GARMENTS",
  phone: "",
  whatsapp: "",
  email: "",
  address: "",

  delivery_charge: "99",
  free_delivery_above: "0",
  delivery_available: true,
  delivery_estimate: "3-7 business days",

  logo_url: "",
  favicon_url: "",

  instagram_url: "",
  facebook_url: "",
  youtube_url: "",

  announcement_text: "",
  announcement_enabled: false,

  payment_instructions: "",
  payment_qr_url: "",
  payment_enabled: true,

  about_text: "",
  contact_text: "",
  shipping_policy: "",
  return_policy: "",
  refund_policy: "",
  privacy_policy: "",
  terms_policy: "",

  order_confirmation_message:
    "Thank you for your order. Our team will contact you on WhatsApp for confirmation.",

  whatsapp_order_message:
    "Hello, I want to confirm my Model Town Garments order.",

  currency: "INR",
  tax_enabled: false,
  tax_percentage: "0",

  maintenance_mode: false,
  maintenance_message: "We are updating our store. Please check back soon.",
  store_open: true,
};

export default function SettingsPage() {
  const [id, setId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("store");

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      if (data) {
        setId(data.id);

        setForm({
          ...defaults,
          business_name: data.business_name || "",
          phone: data.phone || "",
          whatsapp: data.whatsapp || "",
          email: data.email || "",
          address: data.address || "",

          delivery_charge: String(data.delivery_charge ?? 99),
          free_delivery_above: String(data.free_delivery_above ?? 0),
          delivery_available: Boolean(data.delivery_available),
          delivery_estimate:
            data.delivery_estimate || "3-7 business days",

          logo_url: data.logo_url || "",
          favicon_url: data.favicon_url || "",

          instagram_url: data.instagram_url || "",
          facebook_url: data.facebook_url || "",
          youtube_url: data.youtube_url || "",

          announcement_text: data.announcement_text || "",
          announcement_enabled: Boolean(data.announcement_enabled),

          payment_instructions: data.payment_instructions || "",
          payment_qr_url: data.payment_qr_url || "",
          upi_id: data.upi_id || "",
          payment_enabled: data.payment_enabled !== false,

          about_text: data.about_text || "",
          contact_text: data.contact_text || "",
          shipping_policy: data.shipping_policy || "",
          return_policy: data.return_policy || "",
          refund_policy: data.refund_policy || "",
          privacy_policy: data.privacy_policy || "",
          terms_policy: data.terms_policy || "",

          order_confirmation_message:
            data.order_confirmation_message ||
            defaults.order_confirmation_message,

          whatsapp_order_message:
            data.whatsapp_order_message ||
            defaults.whatsapp_order_message,

          currency: data.currency || "INR",
          tax_enabled: Boolean(data.tax_enabled),
          tax_percentage: String(data.tax_percentage ?? 0),

          maintenance_mode: Boolean(data.maintenance_mode),
          maintenance_message:
            data.maintenance_message || defaults.maintenance_message,
          store_open: data.store_open !== false,
        });
      }

      setLoading(false);
    }

    load();
  }, []);

  function update<K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function save() {
    if (!form.business_name.trim()) {
      alert("Business name is required.");
      return;
    }

    setSaving(true);

    const payload = {
      business_name: form.business_name.trim(),
      phone: form.phone.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,

      delivery_charge: Number(form.delivery_charge || 0),
      free_delivery_above: Number(form.free_delivery_above || 0),
      delivery_available: form.delivery_available,
      delivery_estimate: form.delivery_estimate.trim() || null,

      logo_url: form.logo_url.trim() || null,
      favicon_url: form.favicon_url.trim() || null,

      instagram_url: form.instagram_url.trim() || null,
      facebook_url: form.facebook_url.trim() || null,
      youtube_url: form.youtube_url.trim() || null,

      announcement_text: form.announcement_text.trim() || null,
      announcement_enabled: form.announcement_enabled,

      payment_instructions:
        form.payment_instructions.trim() || null,
      payment_qr_url: form.payment_qr_url.trim() || null,
      upi_id: form.upi_id.trim() || null,
      payment_enabled: form.payment_enabled,

      about_text: form.about_text.trim() || null,
      contact_text: form.contact_text.trim() || null,
      shipping_policy: form.shipping_policy.trim() || null,
      return_policy: form.return_policy.trim() || null,
      refund_policy: form.refund_policy.trim() || null,
      privacy_policy: form.privacy_policy.trim() || null,
      terms_policy: form.terms_policy.trim() || null,

      order_confirmation_message:
        form.order_confirmation_message.trim() || null,

      whatsapp_order_message:
        form.whatsapp_order_message.trim() || null,

      currency: form.currency.trim() || "INR",
      tax_enabled: form.tax_enabled,
      tax_percentage: Number(form.tax_percentage || 0),

      maintenance_mode: form.maintenance_mode,
      maintenance_message:
        form.maintenance_message.trim() || null,
      store_open: form.store_open,

      updated_at: new Date().toISOString(),
    };

    const result = id
      ? await supabase
          .from("store_settings")
          .update(payload)
          .eq("id", id)
      : await supabase
          .from("store_settings")
          .insert(payload);

    setSaving(false);

    if (result.error) {
      alert(result.error.message);
      return;
    }

    alert("Store settings saved successfully.");
  }

  const tabs = [
    ["store", "Store", Store],
    ["whatsapp", "WhatsApp", MessageCircle],
    ["shipping", "Shipping", Truck],
    ["payment", "Payment", CreditCard],
    ["content", "Content", FileText],
    ["website", "Website", Globe],
    ["notifications", "Notifications", Bell],
  ] as const;

  if (loading) {
    return (
      <main className="mt-settings-page">
        <div className="mt-settings-loading">
          Loading store controls…
        </div>
      </main>
    );
  }

  return (
    <main className="mt-settings-page">
      <div className="mt-settings-shell">

        <header className="mt-settings-header">
          <div>
            <Link href="/admin" className="mt-settings-back">
              <ArrowLeft size={15} />
              Admin Dashboard
            </Link>

            <div className="mt-settings-title-row">
              <div className="mt-settings-title-icon">
                <Settings size={23} />
              </div>

              <div>
                <span>MASTER CONTROL</span>
                <h1>Store Settings</h1>
                <p>
                  Manage your store without editing source code.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="mt-settings-save"
          >
            <Save size={17} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </header>

        <div className="mt-settings-layout">

          <aside className="mt-settings-sidebar">
            {tabs.map(([key, label, Icon]) => (
              <button
                key={key}
                className={activeTab === key ? "active" : ""}
                onClick={() => setActiveTab(key)}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}

            <div className="mt-settings-secure">
              <ShieldCheck size={16} />
              <span>Admin controlled</span>
            </div>
          </aside>

          <section className="mt-settings-content">

            {activeTab === "store" && (
              <SettingsCard
                title="Business Information"
                description="Basic information displayed across your store."
              >
                <Field
                  label="Business Name"
                  value={form.business_name}
                  onChange={(v) => update("business_name", v)}
                />

                <Field
                  label="Phone"
                  value={form.phone}
                  onChange={(v) => update("phone", v)}
                />

                <Field
                  label="Email"
                  value={form.email}
                  onChange={(v) => update("email", v)}
                />

                <Field
                  label="WhatsApp"
                  value={form.whatsapp}
                  onChange={(v) => update("whatsapp", v)}
                />

                <TextArea
                  label="Business Address"
                  value={form.address}
                  onChange={(v) => update("address", v)}
                />

                <Field
                  label="Logo URL"
                  value={form.logo_url}
                  onChange={(v) => update("logo_url", v)}
                />

                <Field
                  label="Favicon URL"
                  value={form.favicon_url}
                  onChange={(v) => update("favicon_url", v)}
                />
              </SettingsCard>
            )}

            {activeTab === "whatsapp" && (
              <SettingsCard
                title="WhatsApp Commerce"
                description="Control order and customer WhatsApp communication."
              >
                <Field
                  label="WhatsApp Number"
                  value={form.whatsapp}
                  onChange={(v) => update("whatsapp", v)}
                  placeholder="919917001830"
                />

                <TextArea
                  label="Default Order Message"
                  value={form.whatsapp_order_message}
                  onChange={(v) =>
                    update("whatsapp_order_message", v)
                  }
                />

                <TextArea
                  label="Order Confirmation Message"
                  value={form.order_confirmation_message}
                  onChange={(v) =>
                    update("order_confirmation_message", v)
                  }
                />

                <Toggle
                  label="Store Open"
                  description="Allow normal customer ordering."
                  checked={form.store_open}
                  onChange={(v) => update("store_open", v)}
                />
              </SettingsCard>
            )}

            {activeTab === "shipping" && (
              <SettingsCard
                title="Shipping & Delivery"
                description="Control delivery pricing and estimated delivery time."
              >
                <div className="mt-settings-fields-two">
                  <Field
                    label="Delivery Charge"
                    type="number"
                    value={form.delivery_charge}
                    onChange={(v) =>
                      update("delivery_charge", v)
                    }
                  />

                  <Field
                    label="Free Delivery Above"
                    type="number"
                    value={form.free_delivery_above}
                    onChange={(v) =>
                      update("free_delivery_above", v)
                    }
                  />
                </div>

                <Field
                  label="Delivery Estimate"
                  value={form.delivery_estimate}
                  onChange={(v) =>
                    update("delivery_estimate", v)
                  }
                  placeholder="3-7 business days"
                />

                <Toggle
                  label="All India Delivery"
                  description="Enable delivery across India."
                  checked={form.delivery_available}
                  onChange={(v) =>
                    update("delivery_available", v)
                  }
                />

                <TextArea
                  label="Shipping Policy"
                  value={form.shipping_policy}
                  onChange={(v) =>
                    update("shipping_policy", v)
                  }
                />
              </SettingsCard>
            )}

            {activeTab === "payment" && (
              <SettingsCard
                title="Admin Payment Center"
                description="Payment controls remain on the admin side. They are not shown as a payment method on the customer checkout."
              >
                <Toggle
                  label="Payment Processing Enabled"
                  description="Enable admin-side payment processing."
                  checked={form.payment_enabled}
                  onChange={(v) =>
                    update("payment_enabled", v)
                  }
                />

                <Field
                  label="UPI ID"
                  value={form.upi_id}
                  onChange={(v) => update("upi_id", v)}
                  placeholder="yourname@upi"
                />

                <Field
                  label="Payment QR Image URL"
                  value={form.payment_qr_url}
                  onChange={(v) =>
                    update("payment_qr_url", v)
                  }
                  placeholder="Paste uploaded QR image URL"
                />

                <TextArea
                  label="Payment Instructions"
                  value={form.payment_instructions}
                  onChange={(v) =>
                    update("payment_instructions", v)
                  }
                />

                <div className="mt-settings-info">
                  QR/payment information is intentionally kept out of
                  the public checkout. It will later be available to
                  authorized admins for customer WhatsApp communication.
                </div>
              </SettingsCard>
            )}

            {activeTab === "content" && (
              <SettingsCard
                title="Website Content"
                description="Edit important store information without changing code."
              >
                <TextArea
                  label="About Us"
                  value={form.about_text}
                  onChange={(v) => update("about_text", v)}
                />

                <TextArea
                  label="Contact Information"
                  value={form.contact_text}
                  onChange={(v) => update("contact_text", v)}
                />

                <TextArea
                  label="Return Policy"
                  value={form.return_policy}
                  onChange={(v) =>
                    update("return_policy", v)
                  }
                />

                <TextArea
                  label="Refund Policy"
                  value={form.refund_policy}
                  onChange={(v) =>
                    update("refund_policy", v)
                  }
                />

                <TextArea
                  label="Privacy Policy"
                  value={form.privacy_policy}
                  onChange={(v) =>
                    update("privacy_policy", v)
                  }
                />

                <TextArea
                  label="Terms & Conditions"
                  value={form.terms_policy}
                  onChange={(v) =>
                    update("terms_policy", v)
                  }
                />
              </SettingsCard>
            )}

            {activeTab === "website" && (
              <SettingsCard
                title="Website Controls"
                description="Control announcements, social links and maintenance mode."
              >
                <Toggle
                  label="Announcement Bar"
                  description="Show an announcement at the top of the store."
                  checked={form.announcement_enabled}
                  onChange={(v) =>
                    update("announcement_enabled", v)
                  }
                />

                <Field
                  label="Announcement Text"
                  value={form.announcement_text}
                  onChange={(v) =>
                    update("announcement_text", v)
                  }
                />

                <Field
                  label="Instagram URL"
                  value={form.instagram_url}
                  onChange={(v) =>
                    update("instagram_url", v)
                  }
                />

                <Field
                  label="Facebook URL"
                  value={form.facebook_url}
                  onChange={(v) =>
                    update("facebook_url", v)
                  }
                />

                <Field
                  label="YouTube URL"
                  value={form.youtube_url}
                  onChange={(v) =>
                    update("youtube_url", v)
                  }
                />

                <Toggle
                  label="Maintenance Mode"
                  description="Temporarily show the maintenance screen."
                  checked={form.maintenance_mode}
                  onChange={(v) =>
                    update("maintenance_mode", v)
                  }
                />

                <TextArea
                  label="Maintenance Message"
                  value={form.maintenance_message}
                  onChange={(v) =>
                    update("maintenance_message", v)
                  }
                />
              </SettingsCard>
            )}

            {activeTab === "notifications" && (
              <SettingsCard
                title="Notifications & Tax"
                description="Global notification and pricing controls."
              >
                <div className="mt-settings-fields-two">
                  <Field
                    label="Currency"
                    value={form.currency}
                    onChange={(v) => update("currency", v)}
                  />

                  <Field
                    label="Tax Percentage"
                    type="number"
                    value={form.tax_percentage}
                    onChange={(v) =>
                      update("tax_percentage", v)
                    }
                  />
                </div>

                <Toggle
                  label="Tax Enabled"
                  description="Apply the configured tax percentage."
                  checked={form.tax_enabled}
                  onChange={(v) =>
                    update("tax_enabled", v)
                  }
                />
              </SettingsCard>
            )}

            <button
              onClick={save}
              disabled={saving}
              className="mt-settings-bottom-save"
            >
              <Save size={17} />
              {saving ? "Saving..." : "Save All Settings"}
            </button>

          </section>
        </div>
      </div>
    </main>
  );
}

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-settings-card">
      <div className="mt-settings-card-heading">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="mt-settings-card-body">
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="mt-settings-field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="mt-settings-field">
      <span>{label}</span>
      <textarea
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="mt-settings-toggle">
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
