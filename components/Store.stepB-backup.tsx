"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { storeData } from "@/data/storeData";

type Product = (typeof storeData.products)[number];

type CartItem = {
  productId: number;
  size: string;
  color: string;
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

const offers = storeData.offers;

export default function Store() {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("Popular");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const [wishlist, setWishlist] = useState<number[]>([]);
  const [wishlistOnly, setWishlistOnly] = useState(false);

  const [recentlyViewed, setRecentlyViewed] = useState<number[]>([]);

  const [selectedSizes, setSelectedSizes] = useState<
    Record<number, string>
  >({});

  const [selectedColors, setSelectedColors] = useState<
    Record<number, string>
  >({});

  const [quickProduct, setQuickProduct] = useState<Product | null>(null);
  const [zoomImage, setZoomImage] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [qrCode, setQrCode] = useState("");

  const [addedId, setAddedId] = useState<number | null>(null);

  const [customer, setCustomer] = useState<Customer>({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  /* ---------------- STORAGE ---------------- */

  useEffect(() => {
    try {
      const savedWishlist = localStorage.getItem(
        "model-town-wishlist"
      );

      const savedRecent = localStorage.getItem(
        "model-town-recently-viewed"
      );

      if (savedWishlist) {
        setWishlist(JSON.parse(savedWishlist));
      }

      if (savedRecent) {
        setRecentlyViewed(JSON.parse(savedRecent));
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "model-town-wishlist",
        JSON.stringify(wishlist)
      );
    } catch {}
  }, [wishlist]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "model-town-recently-viewed",
        JSON.stringify(recentlyViewed)
      );
    } catch {}
  }, [recentlyViewed]);

  /* ---------------- PRODUCT HELPERS ---------------- */

  const getOffer = (product: Product) => {
    return offers.find(
      (offer) =>
        offer.active && offer.category === product.category
    );
  };

  const getDiscountedPrice = (product: Product) => {
    const offer = getOffer(product);

    if (!offer) return product.price;

    if (offer.type === "percentage") {
      return Math.round(
        product.price * (1 - offer.value / 100)
      );
    }

    return Math.max(product.price - offer.value, 0);
  };

  const getProductColor = (product: Product) => {
    return (
      selectedColors[product.id] ||
      product.colors[0]
    );
  };

  const getProductSize = (product: Product) => {
    return (
      selectedSizes[product.id] ||
      product.sizes[0]
    );
  };

  /* ---------------- FILTER + SORT ---------------- */

  const filteredProducts = useMemo(() => {
    const result = storeData.products.filter((product) => {
      const matchesCategory =
        category === "All" ||
        product.category === category;

      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        product.name.toLowerCase().includes(searchText) ||
        product.category.toLowerCase().includes(searchText) ||
        product.tags.some((tag) =>
          tag.toLowerCase().includes(searchText)
        );

      const matchesWishlist =
        !wishlistOnly ||
        wishlist.includes(product.id);

      return (
        matchesCategory &&
        matchesSearch &&
        matchesWishlist
      );
    });

    if (sort === "Price: Low to High") {
      result.sort(
        (a, b) =>
          getDiscountedPrice(a) -
          getDiscountedPrice(b)
      );
    }

    if (sort === "Price: High to Low") {
      result.sort(
        (a, b) =>
          getDiscountedPrice(b) -
          getDiscountedPrice(a)
      );
    }

    if (sort === "Newest") {
      result.sort(
        (a, b) =>
          Number(b.newest) - Number(a.newest)
      );
    }

    if (sort === "Popular") {
      result.sort(
        (a, b) =>
          Number(b.featured) - Number(a.featured)
      );
    }

    return result;
  }, [
    category,
    search,
    sort,
    wishlistOnly,
    wishlist,
  ]);

  /* ---------------- WISHLIST ---------------- */

  const toggleWishlist = (productId: number) => {
    setWishlist((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    );
  };

  const addAllWishlistToCart = () => {
    const products = storeData.products.filter((product) =>
      wishlist.includes(product.id)
    );

    setCart((current) => {
      const updated = [...current];

      products.forEach((product) => {
        const size = getProductSize(product);
        const color = getProductColor(product);

        const existing = updated.find(
          (item) =>
            item.productId === product.id &&
            item.size === size &&
            item.color === color
        );

        if (existing) {
          existing.quantity += 1;
        } else {
          updated.push({
            productId: product.id,
            size,
            color,
            quantity: 1,
          });
        }
      });

      return updated;
    });

    setCartOpen(true);
  };

  /* ---------------- RECENTLY VIEWED ---------------- */

  const openProduct = (product: Product) => {
    setQuickProduct(product);
    setGalleryIndex(0);
    setZoomImage(false);

    setRecentlyViewed((current) => [
      product.id,
      ...current.filter((id) => id !== product.id),
    ].slice(0, 6));
  };

  /* ---------------- CART ---------------- */

  const addToCart = (productId: number) => {
    const product = storeData.products.find(
      (p) => p.id === productId
    );

    if (!product) return;

    const size = getProductSize(product);
    const color = getProductColor(product);

    setCart((current) => {
      const existing = current.find(
        (item) =>
          item.productId === productId &&
          item.size === size &&
          item.color === color
      );

      if (existing) {
        return current.map((item) =>
          item.productId === productId &&
          item.size === size &&
          item.color === color
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...current,
        {
          productId,
          size,
          color,
          quantity: 1,
        },
      ];
    });

    setAddedId(productId);
    setCartOpen(true);

    setTimeout(() => {
      setAddedId(null);
    }, 900);
  };

  const updateQuantity = (
    productId: number,
    size: string,
    color: string,
    change: number
  ) => {
    setCart((current) =>
      current
        .map((item) =>
          item.productId === productId &&
          item.size === size &&
          item.color === color
            ? {
                ...item,
                quantity:
                  item.quantity + change,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (
    productId: number,
    size: string,
    color: string
  ) => {
    setCart((current) =>
      current.filter(
        (item) =>
          !(
            item.productId === productId &&
            item.size === size &&
            item.color === color
          )
      )
    );
  };

  /* ---------------- CART CALCULATIONS ---------------- */

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
          offer: getOffer(product),
          finalPrice: getDiscountedPrice(product),
        };
      })
      .filter(Boolean) as Array<
      CartItem & {
        product: Product;
        offer?: (typeof offers)[number];
        finalPrice: number;
      }
    >;
  }, [cart]);

  const originalSubtotal = cartProducts.reduce(
    (total, item) =>
      total +
      item.product.price * item.quantity,
    0
  );

  const discount = cartProducts.reduce(
    (total, item) =>
      total +
      (item.product.price -
        item.finalPrice) *
        item.quantity,
    0
  );

  const subtotalAfterDiscount =
    originalSubtotal - discount;

  const delivery =
    cart.length > 0
      ? storeData.delivery.charge
      : 0;

  const total =
    subtotalAfterDiscount + delivery;

  const cartCount = cart.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

  /* ---------------- PAYMENT QR ---------------- */

  useEffect(() => {
    if (!paymentOpen || total <= 0) return;

    const generateQR = async () => {
      try {
        const upiUrl =
          `upi://pay?pa=${encodeURIComponent(
            storeData.payment.upiId
          )}` +
          `&pn=${encodeURIComponent(
            storeData.payment.upiName
          )}` +
          `&am=${total.toFixed(2)}` +
          `&cu=INR` +
          `&tn=${encodeURIComponent(
            "Model Town Garments Order"
          )}`;

        const qr =
          await QRCode.toDataURL(
            upiUrl,
            {
              width: 320,
              margin: 2,
              errorCorrectionLevel: "M",
            }
          );

        setQrCode(qr);
      } catch {
        setQrCode("");
      }
    };

    generateQR();
  }, [paymentOpen, total]);

  /* ---------------- CHECKOUT ---------------- */

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
      alert(
        "Please complete all delivery details."
      );
      return;
    }

    setPaymentOpen(true);
  };

  const createOrderId = () => {
    const random = Math.floor(
      100000 + Math.random() * 900000
    );

    return `MTG-${random}`;
  };

  const sendWhatsAppOrder = () => {
    const orderId = createOrderId();

    const items = cartProducts
      .map(
        (item) =>
          `• ${item.product.name} | Size: ${item.size} | Color: ${item.color} | Qty: ${item.quantity} | ₹${
            item.finalPrice *
            item.quantity
          }`
      )
      .join("\n");

    const message = `Hello ${storeData.name},

I would like to place an order.

ORDER ID: ${orderId}

ORDER DETAILS:
${items}

Original Subtotal: ₹${originalSubtotal}
Discount: -₹${discount}
Subtotal After Discount: ₹${subtotalAfterDiscount}
Delivery Charge: ₹${delivery}
FINAL TOTAL: ₹${total}

PAYMENT:
UPI ID: ${storeData.payment.upiId}
Payment status: Customer will confirm payment

CUSTOMER DETAILS:
Name: ${customer.name}
Phone: ${customer.phone}
Address: ${customer.address}
City: ${customer.city}
State: ${customer.state}
Pincode: ${customer.pincode}

Please confirm my order and payment.`;

    window.open(
      `https://wa.me/${storeData.whatsapp}?text=${encodeURIComponent(
        message
      )}`,
      "_blank"
    );
  };

  /* ---------------- RECENT PRODUCTS ---------------- */

  const recentProducts = recentlyViewed
    .map((id) =>
      storeData.products.find(
        (product) => product.id === id
      )
    )
    .filter(Boolean) as Product[];

  const similarProducts = quickProduct
    ? storeData.products
        .filter(
          (product) =>
            product.category ===
              quickProduct.category &&
            product.id !== quickProduct.id
        )
        .slice(0, 4)
    : [];

  return (
    <>
      {/* PROMO BAR */}

      <section className="border-y border-blue-100 bg-blue-50 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 overflow-hidden px-5 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="shrink-0 rounded-full bg-[#102a56] px-3 py-1 text-[10px] font-black text-white">
              LIMITED OFFER
            </span>

            <span className="truncate text-sm font-bold text-[#102a56]">
              Up to 20% OFF on selected styles
            </span>
          </div>

          <span className="hidden shrink-0 text-xs font-bold text-blue-600 sm:block">
            All India Delivery · ₹99
          </span>
        </div>
      </section>

      {/* SHOP */}

      <section
        id="shop"
        className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24"
      >
        <div className="flex flex-col gap-7">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="text-xs font-black tracking-[0.28em] text-[#2563eb]">
                SHOP COLLECTION
              </div>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950 sm:text-5xl">
                Find your style.
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-500">
                Explore premium men's styles with
                selected offers, easy sizing and
                All India delivery.
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
              <button
                onClick={() =>
                  setWishlistOnly(
                    (value) => !value
                  )
                }
                className={`rounded-full px-5 py-3 text-sm font-black transition ${
                  wishlistOnly
                    ? "bg-rose-500 text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
              >
                ❤️ Wishlist{" "}
                {wishlist.length}
              </button>

              <div className="relative w-full lg:w-72">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  🔎
                </span>

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search products..."
                  className="w-full rounded-full border border-slate-200 bg-white py-3.5 pl-11 pr-5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </div>
            </div>
          </div>

          {/* CATEGORIES */}

          <div className="flex gap-2 overflow-x-auto pb-2">
            {storeData.categories.map(
              (item) => (
                <button
                  key={item}
                  onClick={() =>
                    setCategory(item)
                  }
                  className={`whitespace-nowrap rounded-full px-5 py-3 text-sm font-bold transition ${
                    category === item
                      ? "bg-[#102a56] text-white shadow-md"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-[#2563eb]"
                  }`}
                >
                  {item}
                </button>
              )
            )}
          </div>

          {/* SORT */}

          <div className="flex items-center justify-between gap-4 border-y border-slate-100 py-4">
            <div className="text-sm font-bold text-slate-500">
              {filteredProducts.length} styles
            </div>

            <select
              value={sort}
              onChange={(e) =>
                setSort(e.target.value)
              }
              className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold outline-none"
            >
              {storeData.filters.sortOptions.map(
                (option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    Sort: {option}
                  </option>
                )
              )}
            </select>
          </div>

          {/* PRODUCTS */}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filteredProducts.map(
              (product) => {
                const offer =
                  getOffer(product);

                const finalPrice =
                  getDiscountedPrice(
                    product
                  );

                const saved =
                  product.price -
                  finalPrice;

                return (
                  <article
                    key={product.id}
                    className="group overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    {/* IMAGE */}

                    <div
                      className="relative aspect-[4/5] cursor-pointer overflow-hidden bg-[#eef2f7]"
                      onClick={() =>
                        openProduct(product)
                      }
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-[#dce6f2] via-[#f8fafc] to-[#c4d2e3] transition duration-500 group-hover:scale-105" />

                      <div className="relative flex h-full items-center justify-center">
                        <div className="text-center">
                          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[1.8rem] bg-white/80 text-5xl shadow-lg backdrop-blur">
                            {product.category ===
                            "Shirts"
                              ? "👔"
                              : product.category ===
                                "Jeans"
                              ? "👖"
                              : product.category ===
                                "Trousers"
                              ? "👖"
                              : product.category ===
                                "Shorts"
                              ? "🩳"
                              : product.category ===
                                "Jackets" ||
                                product.category ===
                                  "Hoodies"
                              ? "🧥"
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
                          {offer.label}
                        </span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(
                            product.id
                          );
                        }}
                        className="absolute bottom-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow-lg transition hover:scale-110"
                        aria-label="Wishlist"
                      >
                        {wishlist.includes(
                          product.id
                        )
                          ? "❤️"
                          : "♡"}
                      </button>
                    </div>

                    <div className="p-5">
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#2563eb]">
                        {product.category}
                      </div>

                      <button
                        onClick={() =>
                          openProduct(product)
                        }
                        className="mt-2 text-left text-base font-black hover:text-blue-600"
                      >
                        {product.name}
                      </button>

                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-500">
                          ★ {product.rating}
                        </span>

                        <span className="text-xs text-slate-400">
                          ({product.reviewCount})
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-end gap-2">
                        <span className="text-xl font-black">
                          ₹{finalPrice}
                        </span>

                        <span className="text-sm text-slate-400 line-through">
                          ₹{product.price}
                        </span>

                        {saved > 0 && (
                          <span className="text-[10px] font-black text-green-600">
                            Save ₹{saved}
                          </span>
                        )}
                      </div>

                      {product.stock <=
                        5 && (
                        <div className="mt-3 text-xs font-black text-orange-600">
                          🔥 Only{" "}
                          {product.stock}{" "}
                          left
                        </div>
                      )}

                      <div className="mt-4 flex gap-2">
                        {product.sizes
                          .slice(0, 4)
                          .map((size) => (
                            <button
                              key={size}
                              onClick={() =>
                                setSelectedSizes(
                                  (current) => ({
                                    ...current,
                                    [product.id]:
                                      size,
                                  }))
                              }
                              className={`rounded-md px-2.5 py-1.5 text-[10px] font-bold ${
                                getProductSize(
                                  product
                                ) === size
                                  ? "bg-[#102a56] text-white"
                                  : "border border-slate-200 text-slate-500"
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                      </div>

                      <button
                        onClick={() =>
                          addToCart(
                            product.id
                          )
                        }
                        className={`mt-5 w-full rounded-xl px-4 py-3 text-sm font-black text-white transition ${
                          addedId ===
                          product.id
                            ? "bg-green-600"
                            : "bg-[#102a56] hover:bg-[#173d79]"
                        }`}
                      >
                        {addedId ===
                        product.id
                          ? "✓ Added"
                          : "Add to Cart"}
                      </button>
                    </div>
                  </article>
                );
              }
            )}
          </div>

          {filteredProducts.length ===
            0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-14 text-center">
              <div className="text-4xl">
                🔎
              </div>

              <h3 className="mt-3 font-black text-slate-900">
                No products found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Try another search or
                category.
              </p>

              <button
                onClick={() => {
                  setSearch("");
                  setCategory("All");
                  setWishlistOnly(
                    false
                  );
                }}
                className="mt-5 rounded-full bg-[#102a56] px-5 py-3 text-sm font-black text-white"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* RECENTLY VIEWED */}

      {recentProducts.length > 0 && (
        <section className="border-t border-slate-100 bg-slate-50 py-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="text-xs font-black tracking-[0.28em] text-[#2563eb]">
              RECENTLY VIEWED
            </div>

            <h2 className="mt-3 text-3xl font-black tracking-tight">
              Continue exploring.
            </h2>

            <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {recentProducts.map(
                (product) => (
                  <button
                    key={product.id}
                    onClick={() =>
                      openProduct(
                        product
                      )
                    }
                    className="rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="flex aspect-square items-center justify-center rounded-xl bg-[#eef2f7] text-4xl">
                      👕
                    </div>

                    <div className="mt-3 line-clamp-2 text-xs font-black">
                      {product.name}
                    </div>

                    <div className="mt-2 font-black text-blue-600">
                      ₹
                      {getDiscountedPrice(
                        product
                      )}
                    </div>
                  </button>
                )
              )}
            </div>
          </div>
        </section>
      )}

      {/* WISHLIST ACTION */}

      {wishlist.length > 0 && (
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          <div className="flex flex-col justify-between gap-4 rounded-3xl border border-rose-100 bg-rose-50 p-5 sm:flex-row sm:items-center">
            <div>
              <div className="font-black text-slate-900">
                ❤️ {wishlist.length} saved
                item
                {wishlist.length > 1
                  ? "s"
                  : ""}
              </div>

              <div className="mt-1 text-xs text-slate-500">
                Your wishlist is saved on
                this device.
              </div>
            </div>

            <button
              onClick={addAllWishlistToCart}
              className="rounded-full bg-[#102a56] px-5 py-3 text-sm font-black text-white"
            >
              Add All to Cart →
            </button>
          </div>
        </div>
      )}

      {/* CART BUTTON */}

      {cartCount > 0 && (
        <button
          onClick={() =>
            setCartOpen(true)
          }
          className="fixed bottom-5 right-5 z-[70] flex items-center gap-3 rounded-full bg-[#102a56] px-5 py-3.5 text-sm font-black text-white shadow-2xl transition hover:scale-105"
        >
          🛒 Cart

          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#2563eb] px-1.5 text-xs">
            {cartCount}
          </span>
        </button>
      )}

      {/* PRODUCT QUICK VIEW */}

      {quickProduct && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onClick={() =>
            setQuickProduct(null)
          }
        >
          <div
            className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl sm:rounded-[2rem]"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur">
              <div className="text-sm font-black">
                Product Details
              </div>

              <button
                onClick={() =>
                  setQuickProduct(null)
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl"
              >
                ×
              </button>
            </div>

            <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-2">
              {/* GALLERY */}

              <div>
                <div
                  className="relative flex aspect-square cursor-zoom-in items-center justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#e5ebf3] via-white to-[#cdd9e8]"
                  onClick={() =>
                    setZoomImage(true)
                  }
                >
                  <div className="text-center">
                    <div className="text-8xl">
                      {quickProduct.category ===
                      "Jeans"
                        ? "👖"
                        : quickProduct.category ===
                          "Shorts"
                        ? "🩳"
                        : quickProduct.category ===
                            "Jackets" ||
                          quickProduct.category ===
                            "Hoodies"
                        ? "🧥"
                        : "👕"}
                    </div>

                    <div className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Click to zoom
                    </div>
                  </div>

                  <span className="absolute left-5 top-5 rounded-full bg-white px-3 py-2 text-xs font-black shadow-sm">
                    {quickProduct.badge}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3">
                  {quickProduct.gallery.map(
                    (image, index) => (
                      <button
                        key={`${image}-${index}`}
                        onClick={() =>
                          setGalleryIndex(
                            index
                          )
                        }
                        className={`flex aspect-square items-center justify-center rounded-xl border text-3xl ${
                          galleryIndex ===
                          index
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        👕
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* DETAILS */}

              <div>
                <div className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">
                  {quickProduct.category}
                </div>

                <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                  {quickProduct.name}
                </h2>

                <div className="mt-3 flex items-center gap-3">
                  <span className="font-bold text-amber-500">
                    ★ {quickProduct.rating}
                  </span>

                  <span className="text-sm text-slate-400">
                    {quickProduct.reviewCount}{" "}
                    reviews
                  </span>
                </div>

                <div className="mt-6 flex items-end gap-3">
                  <span className="text-3xl font-black">
                    ₹
                    {getDiscountedPrice(
                      quickProduct
                    )}
                  </span>

                  <span className="text-lg text-slate-400 line-through">
                    ₹{quickProduct.price}
                  </span>
                </div>

                <div className="mt-3 inline-flex rounded-full bg-green-50 px-3 py-2 text-xs font-black text-green-700">
                  You save ₹
                  {quickProduct.price -
                    getDiscountedPrice(
                      quickProduct
                    )}
                </div>

                {/* STOCK */}

                <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50 p-4">
                  <div className="text-sm font-black text-orange-800">
                    {quickProduct.stock <=
                    5
                      ? `🔥 Only ${quickProduct.stock} left`
                      : `✓ ${quickProduct.stock} available`}
                  </div>

                  <div className="mt-1 text-xs text-orange-700/70">
                    Stock shown is demo data
                    and can be updated.
                  </div>
                </div>

                {/* COLOURS */}

                <div className="mt-7">
                  <div className="mb-3 text-xs font-black uppercase tracking-wider text-slate-500">
                    Colour ·{" "}
                    {getProductColor(
                      quickProduct
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {quickProduct.colors.map(
                      (color) => (
                        <button
                          key={color}
                          onClick={() =>
                            setSelectedColors(
                              (current) => ({
                                ...current,
                                [quickProduct.id]:
                                  color,
                              }))
                          }
                          className={`rounded-full border px-4 py-2 text-xs font-bold ${
                            getProductColor(
                              quickProduct
                            ) === color
                              ? "border-[#102a56] bg-[#102a56] text-white"
                              : "border-slate-200 bg-white text-slate-600"
                          }`}
                        >
                          {color}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* SIZES */}

                <div className="mt-7">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Select Size
                    </div>

                    <button
                      onClick={() =>
                        setSizeGuideOpen(
                          true
                        )
                      }
                      className="text-xs font-black text-blue-600 underline"
                    >
                      Size Guide
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {quickProduct.sizes.map(
                      (size) => (
                        <button
                          key={size}
                          onClick={() =>
                            setSelectedSizes(
                              (current) => ({
                                ...current,
                                [quickProduct.id]:
                                  size,
                              })
                            )
                          }
                          className={`min-w-12 rounded-xl border px-4 py-3 text-sm font-black ${
                            getProductSize(
                              quickProduct
                            ) === size
                              ? "border-[#102a56] bg-[#102a56] text-white"
                              : "border-slate-200 bg-white text-slate-600"
                          }`}
                        >
                          {size}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* PRODUCT DETAILS */}

                <div className="mt-7 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-[10px] font-black uppercase text-slate-400">
                      Fabric
                    </div>
                    <div className="mt-1 text-sm font-black">
                      {quickProduct.fabric}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-[10px] font-black uppercase text-slate-400">
                      Fit
                    </div>
                    <div className="mt-1 text-sm font-black">
                      {quickProduct.fit}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-[10px] font-black uppercase text-slate-400">
                      Pattern
                    </div>
                    <div className="mt-1 text-sm font-black">
                      {quickProduct.pattern}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-[10px] font-black uppercase text-slate-400">
                      Delivery
                    </div>
                    <div className="mt-1 text-sm font-black">
                      3–7 days
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-100 p-4">
                  <div className="text-xs font-black">
                    Wash Care
                  </div>

                  <div className="mt-1 text-sm text-slate-500">
                    {quickProduct.washCare}
                  </div>
                </div>

                {/* ACTIONS */}

                <div className="mt-7 flex gap-3">
                  <button
                    onClick={() =>
                      toggleWishlist(
                        quickProduct.id
                      )
                    }
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-xl"
                  >
                    {wishlist.includes(
                      quickProduct.id
                    )
                      ? "❤️"
                      : "♡"}
                  </button>

                  <button
                    onClick={() =>
                      addToCart(
                        quickProduct.id
                      )
                    }
                    className="flex-1 rounded-2xl bg-[#102a56] px-5 py-4 text-sm font-black text-white transition hover:bg-[#173d79]"
                  >
                    ADD TO CART · ₹
                    {getDiscountedPrice(
                      quickProduct
                    )}
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-slate-500">
                  <span>✓ All India Delivery</span>
                  <span>✓ ₹99 Shipping</span>
                  <span>✓ Secure UPI</span>
                </div>
              </div>
            </div>

            {/* SIMILAR */}

            {similarProducts.length >
              0 && (
              <div className="border-t border-slate-100 p-5 sm:p-8">
                <div className="text-xs font-black tracking-[0.25em] text-blue-600">
                  YOU MAY ALSO LIKE
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-4">
                  {similarProducts.map(
                    (product) => (
                      <button
                        key={product.id}
                        onClick={() =>
                          openProduct(
                            product
                          )
                        }
                        className="rounded-2xl border border-slate-200 p-3 text-left transition hover:shadow-md"
                      >
                        <div className="flex aspect-square items-center justify-center rounded-xl bg-slate-50 text-4xl">
                          👕
                        </div>

                        <div className="mt-3 text-sm font-black">
                          {product.name}
                        </div>

                        <div className="mt-1 font-black text-blue-600">
                          ₹
                          {getDiscountedPrice(
                            product
                          )}
                        </div>
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SIZE GUIDE */}

      {sizeGuideOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() =>
            setSizeGuideOpen(false)
          }
        >
          <div
            className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-black tracking-[0.2em] text-blue-600">
                  SIZE GUIDE
                </div>

                <h2 className="mt-2 text-2xl font-black">
                  Find your right fit
                </h2>
              </div>

              <button
                onClick={() =>
                  setSizeGuideOpen(
                    false
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100"
              >
                ×
              </button>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
              <div className="grid grid-cols-4 bg-[#102a56] px-4 py-3 text-xs font-black text-white">
                <span>Size</span>
                <span>Chest</span>
                <span>Length</span>
                <span>Shoulder</span>
              </div>

              {storeData.sizeGuide.tops.map(
                (row) => (
                  <div
                    key={row.size}
                    className="grid grid-cols-4 border-t border-slate-100 px-4 py-3 text-xs font-bold text-slate-600"
                  >
                    <span className="font-black text-slate-900">
                      {row.size}
                    </span>
                    <span>{row.chest}</span>
                    <span>{row.length}</span>
                    <span>
                      {row.shoulder}
                    </span>
                  </div>
                )
              )}
            </div>

            <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-blue-800">
              <strong>
                Not sure about your size?
              </strong>
              <br />
              Measure around the fullest part
              of your chest and compare it
              with the chart above.
            </div>
          </div>
        </div>
      )}

      {/* ZOOM */}

      {zoomImage &&
        quickProduct && (
          <div
            className="fixed inset-0 z-[140] flex items-center justify-center bg-black/90 p-5"
            onClick={() =>
              setZoomImage(false)
            }
          >
            <div className="text-center">
              <div className="text-[10rem] sm:text-[14rem]">
                {quickProduct.category ===
                "Jeans"
                  ? "👖"
                  : quickProduct.category ===
                    "Shorts"
                  ? "🩳"
                  : "👕"}
              </div>

              <div className="text-sm font-bold text-white/60">
                Tap anywhere to close
              </div>
            </div>
          </div>
        )}

      {/* CART DRAWER */}

      {cartOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
          onClick={() =>
            setCartOpen(false)
          }
        >
          <div
            className="absolute inset-y-0 right-0 w-full max-w-lg overflow-y-auto bg-white shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-5">
              <div>
                <div className="text-xl font-black">
                  Your Cart
                </div>

                <div className="mt-1 text-xs text-slate-500">
                  {cartCount} item(s)
                </div>
              </div>

              <button
                onClick={() =>
                  setCartOpen(false)
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg"
              >
                ×
              </button>
            </div>

            <div className="p-5">
              <div className="space-y-3">
                {cartProducts.map(
                  (item) => (
                    <div
                      key={`${item.productId}-${item.size}-${item.color}`}
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
                            Size:{" "}
                            {item.size}{" "}
                            · Color:{" "}
                            {item.color}
                          </div>

                          <div className="mt-2 font-black text-blue-600">
                            ₹
                            {item.finalPrice}
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            removeItem(
                              item.productId,
                              item.size,
                              item.color
                            )
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
                                item.color,
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
                                item.color,
                                1
                              )
                            }
                            className="px-4 py-2 font-bold"
                          >
                            +
                          </button>
                        </div>

                        <div className="font-black">
                          ₹
                          {item.finalPrice *
                            item.quantity}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* DELIVERY */}

              <div className="mt-8">
                <div className="text-lg font-black">
                  Delivery Details
                </div>

                <div className="mt-2 rounded-xl bg-blue-50 px-4 py-3 text-xs font-bold text-blue-600">
                  🇮🇳 All India Delivery ·
                  ₹99 Delivery Charge
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
                        address:
                          e.target.value,
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
                        pincode:
                          e.target.value,
                      })
                    }
                    placeholder="Pincode"
                    inputMode="numeric"
                    maxLength={6}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-blue-400"
                  />

                  {customer.pincode.length ===
                    6 && (
                    <div className="rounded-xl bg-green-50 px-4 py-3 text-xs font-bold text-green-700">
                      ✓ Delivery available
                      to{" "}
                      {customer.pincode} ·
                      Estimated 3–7
                      business days
                    </div>
                  )}
                </div>
              </div>

              {/* SUMMARY */}

              <div className="mt-7 rounded-2xl bg-[#f4f6f9] p-5">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>
                    Original Subtotal
                  </span>
                  <span>
                    ₹{originalSubtotal}
                  </span>
                </div>

                <div className="mt-3 flex justify-between text-sm font-bold text-green-600">
                  <span>
                    Offer Discount
                  </span>
                  <span>
                    -₹{discount}
                  </span>
                </div>

                <div className="mt-3 flex justify-between text-sm text-slate-500">
                  <span>
                    After Discount
                  </span>
                  <span>
                    ₹
                    {subtotalAfterDiscount}
                  </span>
                </div>

                <div className="mt-3 flex justify-between text-sm text-slate-500">
                  <span>Delivery</span>
                  <span>
                    ₹{delivery}
                  </span>
                </div>

                <div className="my-4 border-t border-slate-200" />

                <div className="flex justify-between">
                  <span className="font-black">
                    Final Total
                  </span>

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

      {/* PAYMENT */}

      {paymentOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-black tracking-[0.2em] text-blue-600">
                  UPI PAYMENT
                </div>

                <h2 className="mt-2 text-2xl font-black">
                  Complete payment
                </h2>
              </div>

              <button
                onClick={() =>
                  setPaymentOpen(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100"
              >
                ×
              </button>
            </div>

            <div className="mt-6 rounded-2xl bg-[#f4f6f9] p-5">
              <div className="flex justify-between text-sm text-slate-500">
                <span>
                  Order Value
                </span>
                <span>
                  ₹{originalSubtotal}
                </span>
              </div>

              <div className="mt-2 flex justify-between text-sm font-bold text-green-600">
                <span>Discount</span>
                <span>
                  -₹{discount}
                </span>
              </div>

              <div className="mt-2 flex justify-between text-sm text-slate-500">
                <span>Delivery</span>
                <span>
                  ₹{delivery}
                </span>
              </div>

              <div className="my-4 border-t border-slate-200" />

              <div className="flex justify-between">
                <span className="font-black">
                  Payable Amount
                </span>

                <span className="text-2xl font-black text-[#102a56]">
                  ₹{total}
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <div className="text-sm font-black">
                Scan & Pay with any UPI app
              </div>

              <div className="mx-auto mt-4 flex h-64 w-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-3">
                {qrCode ? (
                  <img
                    src={qrCode}
                    alt="UPI payment QR"
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
                {storeData.payment.upiId}
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs leading-5 text-amber-800">
              Payment verification is not
              automatic. After payment, send
              the order to the store on
              WhatsApp for confirmation.
            </div>

            <button
              onClick={sendWhatsAppOrder}
              className="mt-5 w-full rounded-2xl bg-[#25D366] px-5 py-4 text-sm font-black text-white"
            >
              💬 I'VE PAID · SEND ORDER
            </button>

            <button
              onClick={() =>
                setPaymentOpen(false)
              }
              className="mt-3 w-full rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600"
            >
              Back to Cart
            </button>
          </div>
        </div>
      )}

      {/* MOBILE HELP */}

      <a
        href={`https://wa.me/${storeData.whatsapp}?text=${encodeURIComponent(
          "Hello Model Town Garments, I need help with a product."
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 left-5 z-[60] flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-xl text-white shadow-xl md:hidden"
        aria-label="WhatsApp help"
      >
        💬
      </a>
    </>
  );
}
