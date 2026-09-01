"use client";

import { useMemo, useState } from "react";
import { storeData } from "@/data/storeData";

type CartItem = {
  productId: number;
  size: string;
  quantity: number;
};

export default function ShoppingCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
  });

  const cartProducts = useMemo(() => {
    return cart
      .map((item) => {
        const product = storeData.products.find(
          (p) => p.id === item.productId
        );

        if (!product) return null;

        return {
          ...item,
          product,
        };
      })
      .filter(Boolean) as Array<
      CartItem & {
        product: (typeof storeData.products)[number];
      }
    >;
  }, [cart]);

  const subtotal = cartProducts.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  const deliveryCharge = cart.length > 0 ? storeData.delivery.charge : 0;
  const total = subtotal + deliveryCharge;

  const addToCart = (productId: number, size: string) => {
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

    setOpen(true);
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

  const placeOrder = () => {
    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    if (
      !customer.name ||
      !customer.phone ||
      !customer.address ||
      !customer.city ||
      !customer.pincode
    ) {
      alert("Please complete your delivery details.");
      return;
    }

    const itemsText = cartProducts
      .map(
        (item) =>
          `• ${item.product.name} | Size: ${item.size} | Qty: ${item.quantity} | ₹${item.product.price * item.quantity}`
      )
      .join("\n");

    const message = `Hello Model Town Garments,

I would like to place an order.

ORDER DETAILS:
${itemsText}

Subtotal: ₹${subtotal}
Delivery: ₹${deliveryCharge}
TOTAL: ₹${total}

CUSTOMER DETAILS:
Name: ${customer.name}
Phone: ${customer.phone}
Address: ${customer.address}
City: ${customer.city}
Pincode: ${customer.pincode}

Please confirm my order and availability.`;

    window.open(
      `https://wa.me/${storeData.whatsapp}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  return (
    <>
      {/* Floating cart button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[70] flex items-center gap-2 rounded-full bg-[#102a56] px-5 py-3.5 text-sm font-black text-white shadow-2xl transition hover:scale-105"
      >
        🛒 Cart
        {cart.length > 0 && (
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#2563eb] px-1.5 text-xs">
            {cart.reduce((sum, item) => sum + item.quantity, 0)}
          </span>
        )}
      </button>

      {/* Cart overlay */}
      {open && (
        <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm">
          <div
            className="absolute inset-y-0 right-0 w-full max-w-lg overflow-y-auto bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-5">
              <div>
                <div className="text-xl font-black">Your Cart</div>
                <div className="mt-1 text-xs text-slate-500">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} item(s)
                </div>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg"
              >
                ×
              </button>
            </div>

            <div className="p-5">
              {cartProducts.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center">
                  <div className="text-4xl">🛒</div>
                  <h3 className="mt-4 font-black">Your cart is empty</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Add products from the collection.
                  </p>

                  <button
                    onClick={() => setOpen(false)}
                    className="mt-5 rounded-full bg-[#102a56] px-5 py-3 text-sm font-black text-white"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <>
                  {/* CART ITEMS */}
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

                            <div className="mt-2 font-black text-[#2563eb]">
                              ₹{item.product.price}
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
                            ₹{item.product.price * item.quantity}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* CHECKOUT */}
                  <div id="checkout" className="mt-8">
                    <div className="text-lg font-black">
                      Delivery Details
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      All India Delivery available
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
                  </div>

                  {/* TOTAL */}
                  <div className="mt-8 rounded-2xl bg-[#f4f6f9] p-5">
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>Subtotal</span>
                      <span>₹{subtotal}</span>
                    </div>

                    <div className="mt-3 flex justify-between text-sm text-slate-500">
                      <span>Delivery</span>
                      <span>₹{deliveryCharge}</span>
                    </div>

                    <div className="my-4 border-t border-slate-200" />

                    <div className="flex justify-between">
                      <span className="font-black">Total</span>
                      <span className="text-xl font-black text-[#102a56]">
                        ₹{total}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={placeOrder}
                    className="mt-4 w-full rounded-2xl bg-[#25D366] px-5 py-4 text-sm font-black text-white shadow-lg transition hover:brightness-95"
                  >
                    💬 PLACE ORDER ON WHATSAPP
                  </button>

                  <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">
                    Your order details will open directly in WhatsApp.
                    Final availability and order confirmation will be
                    provided by the store.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
