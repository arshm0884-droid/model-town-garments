"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { storeData } from "@/data/storeData";

type CartItem = {
  productId: number;
  size: string;
  quantity: number;
};

type Customer = {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

const offers = [
  { category: "Shirts", percent: 20, label: "20% OFF" },
  { category: "T-Shirts", percent: 15, label: "15% OFF" },
  { category: "Jeans", percent: 10, label: "10% OFF" },
  { category: "Jackets", percent: 15, label: "15% OFF" },
  { category: "Track Pants", percent: 10, label: "10% OFF" },
  { category: "Hoodies", percent: 15, label: "15% OFF" },
  { category: "Shorts", percent: 10, label: "10% OFF" },
  { category: "Innerwear", percent: 5, label: "5% OFF" },
];

export default function Store() {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<Record<number, string>>(
    {}
  );
  const [addedId, setAddedId] = useState<number | null>(null);

  const [customer, setCustomer] = useState<Customer>({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const filteredProducts = storeData.products.filter((product) => {
    const matchesCategory =
      category === "All" || product.category === category;

    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const getOffer = (product: (typeof storeData.products)[number]) => {
    return offers.find((offer) => offer.category === product.category);
  };

  const getDiscountedPrice = (
    product: (typeof storeData.products)[number]
  ) => {
    const offer = getOffer(product);

    if (!offer) return product.price;

    return Math.round(product.price * (1 - offer.percent / 100));
  };

  const addToCart = (productId: number) => {
    const product = storeData.products.find((p) => p.id === productId);

    if (!product) return;

    const size = selectedSizes[productId] || product.sizes[0];

    setCart((current) => {
      const existing = current.find(
        (item) => item.productId === productId && item.size === size
      );

      if (existing) {
        return current.map((item) =>
          item.productId === productId && item.size === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...current, { productId, size, quantity: 1 }];
    });

    setAddedId(productId);
    setCartOpen(true);

    setTimeout(() => setAddedId(null), 900);
  };

  const updateQuantity = (
    productId: number,
    size: string,
    change: number
  ) => {
    setCart((current) =>
      current
        .map((item) =>
          item.productId === productId && item.size === size
            ? { ...item, quantity: item.quantity + change }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (productId: number, size: string) => {
    setCart((current) =>
      current.filter(
        (item) => !(item.productId === productId && item.size === size)
      )
    );
  };

  const cartProducts = useMemo(() => {
    return cart
      .map((item) => {
        const product = storeData.products.find(
          (product) => product.id === item.productId
        );

        if (!product) return null;

        return {
          ...item,
          product,
          offer: getOffer(product),
          finalPrice: getDiscountedPrice(product),
        };
      })
      .filter(Boolean) as Array<
      CartItem & {
        product: (typeof storeData.products)[number];
        offer?: (typeof offers)[number];
        finalPrice: number;
      }
    >;
  }, [cart]);

  const originalSubtotal = cartProducts.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  const discount = cartProducts.reduce(
    (total, item) =>
      total + (item.product.price - item.finalPrice) * item.quantity,
    0
  );

  const subtotalAfterDiscount = originalSubtotal - discount;
  const delivery = cart.length > 0 ? storeData.delivery.charge : 0;
  const total = subtotalAfterDiscount + delivery;

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  useEffect(() => {
    if (!paymentOpen || total <= 0) return;

    const generateQR = async () => {
      try {
        const upiUrl =
          `upi://pay?pa=${encodeURIComponent("9917001812@fam")}` +
          `&pn=${encodeURIComponent("Model Town Garments")}` +
          `&am=${total.toFixed(2)}` +
          `&cu=INR` +
          `&tn=${encodeURIComponent("Model Town Garments Order")}`;

        const qr = await QRCode.toDataURL(upiUrl, {
          width: 320,
          margin: 2,
          errorCorrectionLevel: "M",
        });

        setQrCode(qr);
      } catch {
        setQrCode("");
      }
    };

    generateQR();
  }, [paymentOpen, total]);

  const openPayment = () => {
    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    if (
      !customer.name ||
      !customer.phone ||
      !customer.address ||
      !customer.city ||
      !customer.state ||
      !customer.pincode
    ) {
      alert("Please complete all delivery details.");
      return;
    }

    setPaymentOpen(true);
  };

  const sendWhatsAppOrder = () => {
    const items = cartProducts
      .map(
        (item) =>
          `• ${item.product.name} | Size: ${item.size} | Qty: ${item.quantity} | ₹${item.finalPrice * item.quantity}`
      )
      .join("\n");

    const message = `Hello Model Town Garments,

I would like to place an order.

ORDER DETAILS:
${items}

Original Subtotal: ₹${originalSubtotal}
Discount: -₹${discount}
Subtotal After Discount: ₹${subtotalAfterDiscount}
Delivery Charge: ₹${delivery}
FINAL TOTAL: ₹${total}

PAYMENT:
UPI ID: 9917001812@fam
Payment status: Customer will confirm payment

CUSTOMER DETAILS:
Name: ${customer.name}
Phone: ${customer.phone}
Address: ${customer.address}
City: ${customer.city}
State: ${customer.state}
Pincode: ${customer.pincode}

Please confirm my order and availability.`;

    window.open(
      `https://wa.me/${storeData.whatsapp}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  return (
    <>
      {/* OFFERS */}
      <section className="border-y border-blue-100 bg-blue-50/60 py-5">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex items-center gap-3 overflow-x-auto">
            <span className="shrink-0 text-sm font-black text-[#102a56]">
              🔥 Offers
            </span>

            {offers.map((offer) => (
              <button
                key={offer.category}
                onClick={() => setCategory(offer.category)}
                className="shrink-0 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-bold text-[#2563eb] shadow-sm transition hover:-translate-y-0.5"
              >
                {offer.category} · {offer.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* SHOP */}
      <section
        id="shop"
        className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24"
      >
        <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div>
            <div className="text-xs font-black tracking-[0.28em] text-[#2563eb]">
              SHOP COLLECTION
            </div>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              Find your style.
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-500">
              Shop men&apos;s wear with exclusive demo offers. Actual products,
              prices and offers can be updated from one place.
            </p>
          </div>

          <div className="w-full lg:w-72">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-full border border-slate-200 bg-white py-3.5 px-5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            />
          </div>
        </div>

        {/* CATEGORIES */}
        <div className="mt-9 flex gap-2 overflow-x-auto pb-2">
          {storeData.categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`whitespace-nowrap rounded-full px-5 py-3 text-sm font-bold transition ${
                category === item
                  ? "bg-[#102a56] text-white shadow-md"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-[#2563eb]"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* PRODUCTS */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.map((product) => {
            const offer = getOffer(product);
            const finalPrice = getDiscountedPrice(product);

            return (
              <article
                key={product.id}
                className="group overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1.5 hover:shadow-xl"
              >
                {/* IMAGE AREA */}
                <div className="relative aspect-[4/5] overflow-hidden bg-[#eef2f7]">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#dce6f2] via-[#f8fafc] to-[#c4d2e3] transition duration-500 group-hover:scale-105" />

                  <div className="relative flex h-full items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[1.8rem] bg-white/75 text-5xl shadow-lg backdrop-blur">
                        {product.category === "Shirts"
                          ? "👔"
                          : product.category === "T-Shirts"
                            ? "👕"
                            : product.category === "Jeans"
                              ? "👖"
                              : product.category === "Jackets"
                                ? "🧥"
                                : product.category === "Hoodies"
                                  ? "🧥"
                                  : product.category === "Shorts"
                                    ? "🩳"
                                    : "👕"}
                      </div>

                      <div className="mt-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Premium Visual
                      </div>
                    </div>
                  </div>

                  <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1.5 text-[10px] font-black text-[#102a56] shadow-sm">
                    {product.badge}
                  </span>

                  {offer && (
                    <span className="absolute right-4 top-4 rounded-full bg-[#2563eb] px-3 py-1.5 text-[10px] font-black text-white shadow-md">
                      {offer.percent}% OFF
                    </span>
                  )}
                </div>

                <div className="p-5">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#2563eb]">
                    {product.category}
                  </div>

                  <h3 className="mt-2 min-h-[24px] text-base font-black">
                    {product.name}
                  </h3>

                  {/* PRICE */}
                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    <span className="text-xl font-black">
                      ₹{finalPrice}
                    </span>

                    <span className="text-sm text-slate-400 line-through">
                      ₹{product.price}
                    </span>

                    {offer && (
                      <span className="text-[10px] font-black text-green-600">
                        Save ₹{product.price - finalPrice}
                      </span>
                    )}
                  </div>

                  {/* SIZE */}
                  <div className="mt-4">
                    <div className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Select Size
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {product.sizes.map((size) => {
                        const selected =
                          selectedSizes[product.id] === size ||
                          (!selectedSizes[product.id] &&
                            product.sizes[0] === size);

                        return (
                          <button
                            key={size}
                            onClick={() =>
                              setSelectedSizes((current) => ({
                                ...current,
                                [product.id]: size,
                              }))
                            }
                            className={`rounded-md px-2.5 py-1.5 text-[10px] font-bold transition ${
                              selected
                                ? "bg-[#102a56] text-white"
                                : "border border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:text-[#2563eb]"
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={() => addToCart(product.id)}
                    className={`mt-5 w-full rounded-xl px-4 py-3 text-sm font-black text-white transition ${
                      addedId === product.id
                        ? "bg-green-600"
                        : "bg-[#102a56] hover:bg-[#173d79]"
                    }`}
                  >
                    {addedId === product.id
                      ? "✓ Added to Cart"
                      : "Add to Cart"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="text-3xl">⌕</div>
            <h3 className="mt-3 font-black">No products found</h3>
            <p className="mt-1 text-sm text-slate-500">
              Try another search or category.
            </p>
          </div>
        )}
      </section>

      {/* CART */}
      {cartCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-5 right-5 z-[70] flex items-center gap-3 rounded-full bg-[#102a56] px-5 py-3.5 text-sm font-black text-white shadow-2xl transition hover:scale-105"
        >
          🛒 Cart
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#2563eb] px-1.5 text-xs">
            {cartCount}
          </span>
        </button>
      )}

      {/* CART DRAWER */}
      {cartOpen && (
        <div
          className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
          onClick={() => setCartOpen(false)}
        >
          <div
            className="absolute inset-y-0 right-0 w-full max-w-lg overflow-y-auto bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-5">
              <div>
                <div className="text-xl font-black">Your Cart</div>
                <div className="mt-1 text-xs text-slate-500">
                  {cartCount} item(s)
                </div>
              </div>

              <button
                onClick={() => setCartOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg"
              >
                ×
              </button>
            </div>

            <div className="p-5">
              <div className="space-y-3">
                {cartProducts.map((item) => (
                  <div
                    key={`${item.productId}-${item.size}`}
                    className="rounded-2xl border border-slate-200 bg-[#f8f9fb] p-4"
                  >
                    <div className="flex gap-4">
                      <div className="flex h-20 w-16 shrink-0 items-center justify-center rounded-xl bg-[#e7edf5] text-3xl">
                        👕
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="font-black">
                          {item.product.name}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          Size: {item.size}
                        </div>

                        <div className="mt-2">
                          <span className="font-black text-[#2563eb]">
                            ₹{item.finalPrice}
                          </span>

                          <span className="ml-2 text-xs text-slate-400 line-through">
                            ₹{item.product.price}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          removeItem(item.productId, item.size)
                        }
                        className="h-8 w-8 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500"
                      >
                        ×
                      </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-slate-200 bg-white">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.size,
                              -1
                            )
                          }
                          className="px-4 py-2 font-bold"
                        >
                          −
                        </button>

                        <span className="min-w-8 text-center text-sm font-black">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.size,
                              1
                            )
                          }
                          className="px-4 py-2 font-bold"
                        >
                          +
                        </button>
                      </div>

                      <div className="font-black">
                        ₹{item.finalPrice * item.quantity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CHECKOUT */}
              <div className="mt-8">
                <div className="text-lg font-black">
                  Delivery Details
                </div>

                <div className="mt-2 rounded-xl bg-blue-50 px-4 py-3 text-xs font-bold text-[#2563eb]">
                  🇮🇳 All India Delivery · ₹99 Delivery Charge
                </div>

                <div className="mt-5 space-y-3">
                  <input
                    value={customer.name}
                    onChange={(e) =>
                      setCustomer({
                        ...customer,
                        name: e.target.value,
                      })
                    }
                    placeholder="Full Name"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-blue-400"
                  />

                  <input
                    value={customer.phone}
                    onChange={(e) =>
                      setCustomer({
                        ...customer,
                        phone: e.target.value,
                      })
                    }
                    placeholder="Mobile Number"
                    inputMode="numeric"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-blue-400"
                  />

                  <textarea
                    value={customer.address}
                    onChange={(e) =>
                      setCustomer({
                        ...customer,
                        address: e.target.value,
                      })
                    }
                    placeholder="Complete Delivery Address"
                    rows={3}
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-blue-400"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={customer.city}
                      onChange={(e) =>
                        setCustomer({
                          ...customer,
                          city: e.target.value,
                        })
                      }
                      placeholder="City"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-blue-400"
                    />

                    <input
                      value={customer.state}
                      onChange={(e) =>
                        setCustomer({
                          ...customer,
                          state: e.target.value,
                        })
                      }
                      placeholder="State"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-blue-400"
                    />
                  </div>

                  <input
                    value={customer.pincode}
                    onChange={(e) =>
                      setCustomer({
                        ...customer,
                        pincode: e.target.value,
                      })
                    }
                    placeholder="Pincode"
                    inputMode="numeric"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              {/* SUMMARY */}
              <div className="mt-7 rounded-2xl bg-[#f4f6f9] p-5">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Original Subtotal</span>
                  <span>₹{originalSubtotal}</span>
                </div>

                <div className="mt-3 flex justify-between text-sm font-bold text-green-600">
                  <span>Offer Discount</span>
                  <span>-₹{discount}</span>
                </div>

                <div className="mt-3 flex justify-between text-sm text-slate-500">
                  <span>After Discount</span>
                  <span>₹{subtotalAfterDiscount}</span>
                </div>

                <div className="mt-3 flex justify-between text-sm text-slate-500">
                  <span>Delivery</span>
                  <span>₹{delivery}</span>
                </div>

                <div className="my-4 border-t border-slate-200" />

                <div className="flex justify-between">
                  <span className="font-black">Final Total</span>
                  <span className="text-xl font-black text-[#102a56]">
                    ₹{total}
                  </span>
                </div>
              </div>

              <button
                onClick={openPayment}
                className="mt-4 w-full rounded-2xl bg-[#102a56] px-5 py-4 text-sm font-black text-white transition hover:bg-[#173d79]"
              >
                CONTINUE TO PAYMENT →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {paymentOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-black tracking-[0.2em] text-[#2563eb]">
                  SECURE PAYMENT
                </div>

                <h2 className="mt-2 text-2xl font-black">
                  Complete your payment
                </h2>
              </div>

              <button
                onClick={() => setPaymentOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100"
              >
                ×
              </button>
            </div>

            {/* PAYMENT SUMMARY */}
            <div className="mt-6 rounded-2xl bg-[#f4f6f9] p-5">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Order Value</span>
                <span>₹{originalSubtotal}</span>
              </div>

              <div className="mt-2 flex justify-between text-sm font-bold text-green-600">
                <span>Discount</span>
                <span>-₹{discount}</span>
              </div>

              <div className="mt-2 flex justify-between text-sm text-slate-500">
                <span>Delivery</span>
                <span>₹{delivery}</span>
              </div>

              <div className="my-4 border-t border-slate-200" />

              <div className="flex justify-between">
                <span className="font-black">Payable Amount</span>
                <span className="text-2xl font-black text-[#102a56]">
                  ₹{total}
                </span>
              </div>
            </div>

            {/* QR */}
            <div className="mt-6 text-center">
              <div className="text-sm font-black">
                Scan & Pay with any UPI app
              </div>

              <div className="mx-auto mt-4 flex h-64 w-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-3">
                {qrCode ? (
                  <img
                    src={qrCode}
                    alt="UPI payment QR code"
                    className="h-full w-full"
                  />
                ) : (
                  <div className="text-sm text-slate-400">
                    Generating QR...
                  </div>
                )}
              </div>

              <div className="mt-4 text-xs text-slate-500">
                UPI ID
              </div>

              <div className="mt-1 font-black text-[#102a56]">
                9917001812@fam
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs leading-5 text-amber-800">
              After completing payment, send the order details to the store
              on WhatsApp. The store will confirm your order and payment.
            </div>

            <button
              onClick={sendWhatsAppOrder}
              className="mt-5 w-full rounded-2xl bg-[#25D366] px-5 py-4 text-sm font-black text-white"
            >
              💬 SEND ORDER ON WHATSAPP
            </button>

            <button
              onClick={() => setPaymentOpen(false)}
              className="mt-3 w-full rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600"
            >
              Back to Cart
            </button>
          </div>
        </div>
      )}
    </>
  );
}

