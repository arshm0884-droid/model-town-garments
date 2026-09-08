"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { Heart, Search, ShoppingBag, Star } from "lucide-react";
import { storeData } from "@/data/storeData";

type Product = (typeof storeData.products)[number] & {
  dbId: string;
  images: string[];
};

type CartItem = {
  productId: number;
  size: string;
  color: string;
  quantity: number;
};

type Customer = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

type Coupon = {
  id: string;
  code: string;
  type: "percentage" | "flat";
  value: number;
  minimum_order_amount: number;
  is_active: boolean;
  created_at: string;
};

export default function Store() {
  const supabase = useMemo(() => createClient(), []);

  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("Popular");

  const [cartReady, setCartReady] = useState(false);

  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];

    try {
      const saved = window.localStorage.getItem("mtg_cart");
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  const [cartOpen, setCartOpen] = useState(false);
  const [cartHydrated, setCartHydrated] = useState(false);

  const [wishlist, setWishlist] = useState<number[]>([]);
  const [wishlistOnly, setWishlistOnly] = useState(false);

  const [recentlyViewed, setRecentlyViewed] = useState<number[]>([]);

  const [selectedSizes, setSelectedSizes] =
    useState<Record<number, string>>({});

  const [selectedColors, setSelectedColors] =
    useState<Record<number, string>>({});

  const [quickProduct, setQuickProduct] =
    useState<Product | null>(null);

  const [sizeGuideOpen, setSizeGuideOpen] =
    useState(false);

  const [zoomImage, setZoomImage] =
    useState(false);

  const [selectedImageIndex, setSelectedImageIndex] =
    useState(0);

 
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1);
  const [checkoutUser, setCheckoutUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [checkoutAddress, setCheckoutAddress] =
    useState<Customer>({
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
    });


  const [addedId, setAddedId] =
    useState<number | null>(null);

  const [selectedQuantity, setSelectedQuantity] =
    useState<Record<number, number>>({});

  const [couponCode, setCouponCode] =
    useState("");

  const [appliedCoupon, setAppliedCoupon] =
    useState<Coupon | null>(null);

  const [couponMessage, setCouponMessage] =
    useState("");

  const [loading, setLoading] = useState(true);

  const [dbProducts, setDbProducts] =
    useState<Product[]>([]);

  const [dbOffers, setDbOffers] =
    useState<any[]>([]);

  const [dbCoupons, setDbCoupons] =
    useState<Coupon[]>([]);

  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string | null>(null);
  const [savedAddressesLoading, setSavedAddressesLoading] = useState(false);

  const [customer, setCustomer] =
    useState<Customer>({
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
    });

  /* ---------------- LOAD PRODUCTS ---------------- */

  useEffect(() => {
    async function loadProducts() {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("is_active", true)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Supabase products error:",
          error
        );

        setLoading(false);
        return;
      }

setDbProducts(
  (data ?? []).map((p) => {
    const staticProduct = storeData.products.find(
      (item) => item.name.trim().toLowerCase() === p.name.trim().toLowerCase()
    );

    return {
      ...p,
      id: staticProduct?.id ?? 0,
      dbId: p.id,
      name: p.name,
      category: p.categories?.name || "All",
          images:
            Array.isArray(p.images) && p.images.length > 0
              ? p.images
              : staticProduct?.gallery ?? [staticProduct?.image ?? ""],
          colors: p.colors ?? [],
    stock: Number(p.stock ?? 0),
    fabric: p.fabric ?? "",
    fit: p.fit ?? "",
    pattern: p.pattern ?? "",
    washCare: p.wash_care ?? "",
    rating: Number(p.rating ?? 0),
    reviewCount: Number(p.review_count ?? 0),
    badge: p.badge ?? "",
    tags: [],
    featured: false,
      newest: true,
    };
  })
);

setLoading(false);
  }

  loadProducts();
}, []);

  /* ---------------- LOAD OFFERS & COUPONS ---------------- */

  useEffect(() => {
    async function loadOffersAndCoupons() {
      const [offersResult, couponsResult] =
        await Promise.all([
          supabase
            .from("offers")
            .select("*, categories(name)")
            .eq("is_active", true),

          supabase
            .from("coupons")
            .select("*")
            .eq("is_active", true),
        ]);

      if (offersResult.error) {
        console.error(
          "Supabase offers error:",
          offersResult.error
        );
      } else {
        setDbOffers(offersResult.data ?? []);
      }

      if (couponsResult.error) {
        console.error(
          "Supabase coupons error:",
          couponsResult.error
        );
      } else {
        setDbCoupons(
          (couponsResult.data ?? []) as Coupon[]
        );
      }
    }

    loadOffersAndCoupons();
  }, []);

  useEffect(() => {
    setCartReady(true);
  }, []);

  /* ---------------- ACCOUNT CART SYNC ---------------- */
  useEffect(() => {
    if (dbProducts.length === 0) return;

    let cancelled = false;

    async function loadAccountCart() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) {
        if (!cancelled) setCartHydrated(true);
        return;
      }

      const { data, error } = await supabase
        .from("shopping_carts")
        .select("product_id, size, color, quantity")
        .eq("user_id", user.id);

      if (error) {
        console.error("Supabase cart load error:", error);
        if (!cancelled) setCartHydrated(true);
        return;
      }

      const accountCart: CartItem[] = (data ?? [])
        .map((item) => {
          const product = dbProducts.find(
            (p) => p.dbId === item.product_id
          );

          if (!product) return null;

          return {
            productId: product.id,
            size: item.size,
            color: item.color,
            quantity: Number(item.quantity),
          };
        })
        .filter((item): item is CartItem => item !== null);

      if (cancelled) return;

      setCart((current) => {
        const merged = [...accountCart];

        current.forEach((localItem) => {
          const existing = merged.find(
            (item) =>
              item.productId === localItem.productId &&
              item.size === localItem.size &&
              item.color === localItem.color
          );

          if (existing) {
            existing.quantity += localItem.quantity;
          } else {
            merged.push(localItem);
          }
        });

        return merged;
      });

      setCartHydrated(true);
    }

    loadAccountCart();



  return () => {
      cancelled = true;
    };
  }, [dbProducts, supabase]);


  useEffect(() => {
    let active = true;
    const supabase = createClient();

    const checkCheckoutAuth = async () => {
      const { data } = await supabase.auth.getUser();

      if (!active) return;

      const user = data.user ?? null;
      setCheckoutUser(user);
      setAuthChecking(false);

      const checkoutRequested =
        new URLSearchParams(window.location.search).get("checkout") === "1";

      if (checkoutRequested) {
        if (user) {
          setCheckoutStep(1);
          window.history.replaceState({}, "", window.location.pathname);
        } else {
          window.location.href = "/login?redirect=/?checkout=1";
          return;
        }
      }
    };

    checkCheckoutAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!active) return;

        const user = session?.user ?? null;
        setCheckoutUser(user);

        if (user) {
          setCheckoutStep(1);
        }
      }
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  /* ---------------- LOAD SAVED ADDRESSES ---------------- */
  useEffect(() => {
    if (!checkoutUser?.id) {
      setSavedAddresses([]);
      setSelectedSavedAddressId(null);
      return;
    }

    let cancelled = false;

    async function loadSavedAddresses() {
      setSavedAddressesLoading(true);

      const { data, error } = await supabase
        .from("saved_addresses")
        .select("id,name,phone,address,city,state,pincode,is_default")
        .eq("user_id", checkoutUser.id)
        .order("is_default", { ascending: false });

      if (cancelled) return;

      if (error) {
        console.error("Saved addresses load error:", error);
        setSavedAddresses([]);
        setSelectedSavedAddressId(null);
        setSavedAddressesLoading(false);
        return;
      }

      const addresses = data ?? [];
      setSavedAddresses(addresses);

      const defaultAddress =
        addresses.find((item: any) => item.is_default) || addresses[0];

      if (defaultAddress) {
        setSelectedSavedAddressId(defaultAddress.id);
        setCustomer((current) => ({
          ...current,
          name: defaultAddress.name || current.name,
          phone: defaultAddress.phone || current.phone,
          address: defaultAddress.address || current.address,
          city: defaultAddress.city || current.city,
          state: defaultAddress.state || current.state,
          pincode: defaultAddress.pincode || current.pincode,
        }));
      }

      setSavedAddressesLoading(false);
    }

    loadSavedAddresses();

    return () => {
      cancelled = true;
    };
  }, [checkoutUser?.id, supabase]);

  /* ---------------- CART PERSISTENCE ---------------- */
  useEffect(() => {
    try {
      window.localStorage.setItem("mtg_cart", JSON.stringify(cart));
    } catch (error) {
      console.error("Cart persistence error:", error);
    }
  }, [cart]);

  /* ---------------- CART DATABASE SYNC ---------------- */
  useEffect(() => {
    if (!cartHydrated || dbProducts.length === 0) return;

    let cancelled = false;

    async function syncAccountCart() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) return;

      const rows = cart
        .map((item) => {
          const product = dbProducts.find(
            (p) => p.id === item.productId
          );

          if (!product?.dbId) return null;

          return {
            user_id: user.id,
            product_id: product.dbId,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null);

      const { data: existingRows, error: loadError } = await supabase
        .from("shopping_carts")
        .select("id, product_id, size, color")
        .eq("user_id", user.id);

      if (loadError) {
        console.error("Supabase cart sync load error:", loadError);
        return;
      }

      if (rows.length > 0) {
        const { error } = await supabase
          .from("shopping_carts")
          .upsert(rows, {
            onConflict: "user_id,product_id,size,color",
          });

        if (error) {
          console.error("Supabase cart sync error:", error);
          return;
        }
      }

      const activeKeys = new Set(
        rows.map(
          (row) =>
            `${row.product_id}|${row.size}|${row.color}`
        )
      );

      const staleIds = (existingRows ?? [])
        .filter(
          (row) =>
            !activeKeys.has(
              `${row.product_id}|${row.size}|${row.color}`
            )
        )
        .map((row) => row.id);

      if (staleIds.length > 0) {
        const { error } = await supabase
          .from("shopping_carts")
          .delete()
          .in("id", staleIds);

        if (error) {
          console.error("Supabase cart cleanup error:", error);
        }
      }
    }

    syncAccountCart();

    return () => {
      cancelled = true;
    };
  }, [cart, cartHydrated, dbProducts, supabase]);

  /* ---------------- PRODUCT HELPERS ---------------- */

  const getOffer = (product: Product) => {
    return dbOffers.find(
      (offer) =>
        offer.is_active &&
        offer.categories?.name === product.category
    );
  };

  const getDiscountedPrice = (
    product: Product
  ) => {
    const offer = getOffer(product);

    if (!offer) {
      return product.price;
    }

    if (offer.offer_type === "percentage") {
      return Math.max(
        0,
        Math.round(
          product.price *
            (1 - Number(offer.discount_value) / 100)
        )
      );
    }

    return Math.max(
      0,
      product.price - Number(offer.discount_value)
    );
  };

  const getProductSize = (
    product: Product
  ) => {
    return (
      selectedSizes[product.id] ||
      product.sizes?.[0] ||
      ""
    );
  };

  const getProductColor = (
    product: Product
  ) => {
    return (
      selectedColors[product.id] ||
      product.colors?.[0] ||
      ""
    );
  };

  /* ---------------- FILTERS ---------------- */

  const filteredProducts = useMemo(() => {
    const searchText =
      search.toLowerCase().trim();

    const result = dbProducts.filter(
      (product) => {
        const matchesCategory =
          category === "All" ||
          product.category === category;

        const matchesSearch =
          !searchText ||
          product.name
            .toLowerCase()
            .includes(searchText) ||
          product.category
            .toLowerCase()
            .includes(searchText) ||
          (product.tags ?? []).some(
            (tag) =>
              tag
                .toLowerCase()
                .includes(searchText)
          );

        const matchesWishlist =
          !wishlistOnly ||
          wishlist.includes(product.id);

        return (
          matchesCategory &&
          matchesSearch &&
          matchesWishlist
        );
      }
    );

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
          Number(b.newest) -
          Number(a.newest)
      );
    }

    if (sort === "Popular") {
      result.sort(
        (a, b) =>
          Number(b.featured) -
          Number(a.featured)
      );
    }

    return result;
  }, [
    dbProducts,
    category,
    search,
    sort,
    wishlistOnly,
    wishlist,
  ]);

  /* ---------------- WISHLIST ---------------- */

  const toggleWishlist = async (
    productId: number
  ) => {
    const product = dbProducts.find(
      (item) => item.id === productId
    );

    if (!product?.dbId) {
      console.error("Wishlist product UUID missing.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isSaved = wishlist.includes(productId);

    setWishlist((current) =>
      isSaved
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    );

    if (!user) return;

    if (isSaved) {
      const { error } = await supabase
        .from("wishlists")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", product.dbId);

      if (error) {
        console.error("Supabase wishlist delete error:", error);
        setWishlist((current) =>
          current.includes(productId)
            ? current
            : [...current, productId]
        );
      }
    } else {
      const { error } = await supabase
        .from("wishlists")
        .upsert(
          {
            user_id: user.id,
            product_id: product.dbId,
          },
          {
            onConflict: "user_id,product_id",
          }
        );

      if (error) {
        console.error("Supabase wishlist save error:", error);
        setWishlist((current) =>
          current.filter((id) => id !== productId)
        );
      }
    }
  };

  const addAllWishlistToCart = () => {
    const products =
      dbProducts.filter((product) =>
        wishlist.includes(product.id)
      );

    setCart((current) => {
      const updated = [...current];

      products.forEach((product) => {
        const size =
          getProductSize(product);

        const color =
          getProductColor(product);

        const existing =
          updated.find(
            (item) =>
              item.productId ===
                product.id &&
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

  /* ---------------- PRODUCT VIEW ---------------- */

  const openProduct = (
    product: Product
  ) => {
    setQuickProduct(product);
    setZoomImage(false);

    setRecentlyViewed((current) =>
      [
        product.id,
        ...current.filter(
          (id) => id !== product.id
        ),
      ].slice(0, 6)
    );
  };

  /* ---------------- CART ---------------- */

  const addToCart = (
    productId: number
  ) => {
    const product =
      dbProducts.find(
        (p) => p.id === productId
      );

    if (!product) return;

    const size =
      getProductSize(product);

    const color =
      getProductColor(product);

    setCart((current) => {
      const existing =
        current.find(
          (item) =>
            item.productId ===
              productId &&
            item.size === size &&
            item.color === color
        );

      if (existing) {
        return current.map((item) =>
          item.productId ===
              productId &&
            item.size === size &&
            item.color === color
            ? {
                ...item,
                quantity:
                  item.quantity + 1,
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
          item.productId ===
              productId &&
            item.size === size &&
            item.color === color
            ? {
                ...item,
                quantity:
                  item.quantity + change,
              }
            : item
        )
        .filter(
          (item) => item.quantity > 0
        )
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
            item.productId ===
              productId &&
            item.size === size &&
            item.color === color
          )
      )
    );
  };

  /* ---------------- CART DATA ---------------- */

  const cartProducts = useMemo(() => {
    return cart
      .map((item) => {
        const product =
          dbProducts.find(
            (p) =>
              p.id === item.productId
          );

        if (!product) {
          return null;
        }

        return {
          ...item,
          product,
          finalPrice:
            getDiscountedPrice(product),
        };
      })
      .filter(Boolean) as Array<
      CartItem & {
        product: Product;
        finalPrice: number;
      }
    >;
  }, [cart, dbProducts]);

  const originalSubtotal =
    cartProducts.reduce(
      (total, item) =>
        total +
        item.product.price *
          item.quantity,
      0
    );

  const offerDiscount =
    cartProducts.reduce(
      (total, item) =>
        total +
        (item.product.price -
          item.finalPrice) *
          item.quantity,
      0
    );

  const subtotalAfterOffer =
    Math.max(
      0,
      originalSubtotal -
        offerDiscount
    );

  /* ---------------- BUY MORE DISCOUNT ---------------- */

  const buyMoreDiscount = useMemo(() => {
    const quantity = cart.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );

    if (quantity >= 3) {
      return Math.round(
        subtotalAfterOffer * 0.05
      );
    }

    if (quantity >= 2) {
      return Math.round(
        subtotalAfterOffer * 0.03
      );
    }

    return 0;
  }, [cart, subtotalAfterOffer]);

  const subtotalAfterOffers =
    Math.max(
      0,
      subtotalAfterOffer -
        buyMoreDiscount
    );

  /* ---------------- COUPON ---------------- */

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) {
      return 0;
    }

    if (
      subtotalAfterOffers <
      appliedCoupon.minimum_order_amount
    ) {
      return 0;
    }

    if (
      appliedCoupon.type ===
      "percentage"
    ) {
      return Math.min(
        subtotalAfterOffers,
        Math.round(
          subtotalAfterOffers *
            (appliedCoupon.value / 100)
        )
      );
    }

    return Math.min(
      subtotalAfterOffers,
      appliedCoupon.value
    );
  }, [
    appliedCoupon,
    subtotalAfterOffers,
  ]);

  const delivery =
    cart.length > 0
      ? storeData.delivery.charge
      : 0;

  const totalDiscount =
    offerDiscount +
    buyMoreDiscount +
    couponDiscount;

  const subtotalAfterAllDiscounts =
    Math.max(
      0,
      originalSubtotal -
        totalDiscount
    );

  const total =
    subtotalAfterAllDiscounts +
    delivery;

  const cartCount = cart.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

  /* ---------------- COUPON ACTIONS ---------------- */

  const applyCoupon = () => {
    const code = couponCode.trim().toUpperCase();

    const coupon = dbCoupons.find(
      (item) =>
        item.is_active &&
        item.code.toUpperCase() === code
    );

    if (!coupon) {
      setCouponMessage("Invalid or inactive coupon.");
      return;
    }

    if (
      subtotalAfterOffers <
      Number(coupon.minimum_order_amount)
    ) {
      setCouponMessage(
        `Minimum order ₹${coupon.minimum_order_amount} required.`
      );
      return;
    }

    setAppliedCoupon(coupon);
    setCouponCode(coupon.code);
    setCouponMessage(`✓ ${coupon.code} applied successfully`);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponMessage("");
  };




  /* ---------------- CHECKOUT ---------------- */

const sendWhatsAppOrder = async () => {
    if (authChecking) return;
    if (!checkoutUser) {
      window.location.href = "/login?redirect=/?checkout=1";
      return;
    }

    if (!checkoutUser.email_confirmed_at) {
      alert("Please verify your email before placing an order.");
      window.location.href =
        "/login?verified=required&redirect=/?checkout=1";
      return;
    }

    if (!customer.name.trim()) {
      setCheckoutStep(2);
      alert("Please enter your name.");
      return;
    }

    const phone = customer.phone.replace(/\D/g, "");

    if (phone.length !== 10) {
      setCheckoutStep(2);
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!customer.address.trim()) {
      setCheckoutStep(2);
      alert("Please enter your complete address.");
      return;
    }

    if (!customer.city.trim()) {
      setCheckoutStep(2);
      alert("Please enter your city.");
      return;
    }

    if (!customer.state.trim()) {
      setCheckoutStep(2);
      alert("Please enter your state.");
      return;
    }

    if (!/^\d{6}$/.test(customer.pincode.trim())) {
      setCheckoutStep(2);
      alert("Please enter a valid 6-digit pincode.");
      return;
    }

    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    try {
      setAuthChecking(true);

      // Automatically save this delivery address for future orders.
      if (checkoutUser?.id) {
        try {
          const { data: existingAddress } = await supabase
            .from("saved_addresses")
            .select("id")
            .eq("user_id", checkoutUser.id)
            .eq("address", customer.address.trim())
            .eq("city", customer.city.trim())
            .eq("state", customer.state.trim())
            .eq("pincode", customer.pincode.trim())
            .limit(1)
            .maybeSingle();

          if (!existingAddress) {
            await supabase.from("saved_addresses").insert({
              user_id: checkoutUser.id,
              name: customer.name.trim(),
              phone,
              address: customer.address.trim(),
              city: customer.city.trim(),
              state: customer.state.trim(),
              pincode: customer.pincode.trim(),
              is_default: savedAddresses.length === 0,
            });
          }
        } catch (addressError) {
          console.error("Automatic address save error:", addressError);
        }
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: {
            name: customer.name.trim(),
            email: checkoutUser.email || customer.email.trim(),
            phone,
            address: customer.address.trim(),
            city: customer.city.trim(),
            state: customer.state.trim(),
            pincode: customer.pincode.trim(),
          },
          items: cartProducts.map((item) => ({
            product_id: item.product.dbId,
            product_name: item.product.name,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            unit_price: item.finalPrice,
            total: item.finalPrice * item.quantity,
          })),
          subtotal: originalSubtotal,
          offerDiscount: offerDiscount + buyMoreDiscount,
          couponDiscount,
          deliveryCharge: delivery,
          total,
          couponCode: appliedCoupon?.code ?? null,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error("Order API error:", result.error);
        alert(result.error || "Order save nahi hua. Please try again.");
        return;
      }

      const itemText = cartProducts
        .map(
          (item) =>
            `• ${item.product.name}\n` +
            `Size: ${item.size} | Color: ${item.color}\n` +
            `Qty: ${item.quantity} | Price: ₹${item.finalPrice}`
        )
        .join("\n");

      const message =
        `*MODEL TOWN GARMENTS*\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `*NEW ORDER*\n\n` +
        `Order ID: *${result.order_id}*\n\n` +
        `*Customer Details*\n` +
        `Name: ${customer.name.trim()}\n` +
        `Email: ${checkoutUser.email || customer.email.trim()}\n` +
        `Phone: ${phone}\n\n` +
        `*Delivery Address*\n` +
        `${customer.address.trim()}\n` +
        `${customer.city.trim()}, ${customer.state.trim()} - ${customer.pincode.trim()}\n\n` +
        `*Items*\n${itemText}\n\n` +
        `*Order Summary*\n` +
        `Product Total: ₹${originalSubtotal}\n` +
        `Offer Discount: -₹${offerDiscount + buyMoreDiscount}\n` +
        `Coupon Discount: -₹${couponDiscount}\n` +
        `Delivery: ₹${delivery}\n` +
        `*Final Total: ₹${total}*\n\n` +
        `Please confirm my order on WhatsApp.`;

      const whatsappNumber =
        storeData.whatsapp ||
        storeData.whatsapp;

      if (!whatsappNumber) {
        alert(
          `Order ${result.order_id} created successfully, but WhatsApp number is not configured.`
        );
        setCart([]);
        setCheckoutStep(1);
        setCartOpen(false);
        return;
      }

      const cleanWhatsApp = String(whatsappNumber).replace(/\D/g, "");
      const whatsappUrl =
        `https://wa.me/${cleanWhatsApp}?text=` +
        encodeURIComponent(message);

      setCart([]);
      setCheckoutStep(1);
      setCartOpen(false);

      window.location.href = whatsappUrl;
    } catch (error) {
      console.error("Order submission error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setAuthChecking(false);
    }
  };

  /* ---------------- RECENT ---------------- */

  const recentProducts =
    recentlyViewed
      .map((id) =>
        dbProducts.find(
          (product) =>
            product.id === id
        )
      )
      .filter(Boolean) as Product[];

  /* ---------------- SIMILAR ---------------- */

  const similarProducts =
    quickProduct
      ? dbProducts
          .filter(
            (product) =>
              product.category ===
                quickProduct.category &&
              product.id !==
                quickProduct.id
          )
          .slice(0, 4)
      : [];

  /* ---------------- UI ---------------- */

  return (
    <main className="mtg-premium min-h-screen bg-white pb-10 text-slate-950">

      {/* PROMO */}

      <section className="border-y border-blue-100 bg-blue-50 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="shrink-0 rounded-full bg-[#102a56] px-3 py-1 text-[9px] font-black text-white">
              LIMITED OFFER
            </span>

            <span className="truncate text-xs font-bold text-[#102a56]">
              Up to 20% OFF · All India Delivery
            </span>
          </div>

          <span className="hidden text-xs font-bold text-blue-600 sm:block">
            ₹99 Shipping
          </span>
        </div>
      </section>

      {/* SHOP */}

      <section
        id="shop"
        className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-20"
      >
        <div className="flex flex-col gap-7">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div>
              <div className="text-xs font-black tracking-[0.28em] text-blue-600">
                SHOP COLLECTION
              </div>

              <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-5xl">
                Find your style.
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-500">
                Premium men's styles,
                selected offers and easy
                All India delivery.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">

              <button
                onClick={() =>
                  setWishlistOnly(
                    (value) => !value
                  )
                }
                className={`rounded-full px-5 py-3 text-sm font-black ${
                  wishlistOnly
                    ? "bg-rose-500 text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
              >
                Wishlist · {wishlist.length}
              </button>

              <div className="relative sm:w-72">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search className="h-4 w-4" />
                </span>

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search products..."
                  className="w-full rounded-full border border-slate-200 bg-white py-3.5 pl-11 pr-5 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
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
                  className={`whitespace-nowrap rounded-full px-5 py-3 text-sm font-bold ${
                    category === item
                      ? "bg-[#102a56] text-white"
                      : "border border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {item}
                </button>
              )
            )}
          </div>

          {/* SORT */}

          <div className="flex items-center justify-between border-y border-slate-100 py-4">

            <div className="text-sm font-bold text-slate-500">
              {filteredProducts.length} styles
            </div>

            <select
              value={sort}
              onChange={(e) =>
                setSort(e.target.value)
              }
              className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold"
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

          {/* LOADING */}

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({
                length: 8,
              }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white"
                >
                  <div className="aspect-[4/5] bg-slate-100" />

                  <div className="space-y-3 p-5">
                    <div className="h-3 w-20 rounded bg-slate-100" />
                    <div className="h-5 w-4/5 rounded bg-slate-100" />
                    <div className="h-4 w-2/5 rounded bg-slate-100" />
                    <div className="h-11 rounded-xl bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>

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

                        <div
                          className="relative aspect-[4/5] cursor-pointer overflow-hidden bg-[#eef2f7]"
                          onClick={() =>
                            openProduct(
                              product
                            )
                          }
                        >

                          {product.images?.[0] || product.image ? (
                            <img
                              src={product.images?.[0] || product.image}
                              alt={product.name}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 via-white to-blue-50">
                              <span className="text-sm font-black tracking-[0.2em] text-slate-400">MTG</span>
                            </div>
                          )}

                          <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1.5 text-[10px] font-black text-[#102a56] shadow-sm">
                            {product.badge}
                          </span>

                          {offer && (
                            <span className="absolute right-4 top-4 rounded-full bg-blue-600 px-3 py-1.5 text-[10px] font-black text-white shadow-md">
                              {offer.offer_type === "percentage"
  ? `${offer.discount_value}% OFF`
  : `₹${offer.discount_value} OFF`}
                            </span>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();

                              toggleWishlist(
                                product.id
                              );
                            }}
                            className="absolute bottom-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow-lg"
                          >
                            {wishlist.includes(product.id) ? (
                              <Heart className="h-5 w-5 fill-current" />
                            ) : (
                              <Heart className="h-5 w-5" />
                            )}
                          </button>

                        </div>

                        <div className="p-5">

                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                            {product.category}
                          </div>

                          <button
                            onClick={() =>
                              openProduct(
                                product
                              )
                            }
                            className="mt-2 text-left text-base font-black hover:text-blue-600"
                          >
                            {product.name}
                          </button>

                          <div className="mt-2 flex items-center gap-2">

                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                              <Star className="h-3.5 w-3.5 fill-current" />
                              {product.rating}
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
                              Only {product.stock} left
                            </div>
                          )}

                          <div className="mt-4 flex flex-wrap gap-2">

                            {(product.sizes ?? [])
                              .slice(0, 4)
                              .map(
                                (size) => (
                                  <button
                                    key={size}
                                    onClick={() =>
                                      setSelectedSizes(
                                        (
                                          current
                                        ) => ({
                                          ...current,
                                          [product.id]:
                                            size,
                                        })
                                      )
                                    }
                                    className={`rounded-md px-2.5 py-1.5 text-[10px] font-bold ${
                                      getProductSize(
                                        product
                                      ) ===
                                      size
                                        ? "bg-[#102a56] text-white"
                                        : "border border-slate-200 text-slate-500"
                                    }`}
                                  >
                                    {size}
                                  </button>
                                )
                              )}

                          </div>

                          <button
                            onClick={() =>
                              addToCart(
                                product.id
                              )
                            }
                            className={`mt-5 w-full rounded-xl px-4 py-3 text-sm font-black text-white ${
                              addedId ===
                              product.id
                                ? "bg-green-600"
                                : "bg-[#102a56]"
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

                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-2xl font-light text-slate-400">
                    ⌕
                  </div>

                  <h3 className="mt-3 font-black">
                    No products found
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Try another search,
                    category or wishlist
                    filter.
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

            </>
          )}

        </div>
      </section>

      {/* RECENTLY VIEWED */}

      {recentProducts.length > 0 && (
        <section className="border-t border-slate-100 bg-slate-50 py-14">

          <div className="mx-auto max-w-7xl px-5 sm:px-8">

            <div className="text-xs font-black tracking-[0.28em] text-blue-600">
              RECENTLY VIEWED
            </div>

            <h2 className="mt-3 text-3xl font-black">
              Continue exploring.
            </h2>

            <div className="mt-7 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">

              {recentProducts.map(
                (product) => (
                  <button
                    key={product.id}
                    onClick={() =>
                      openProduct(
                        product
                      )
                    }
                    className="rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm"
                  >

                    <div className="aspect-square overflow-hidden rounded-xl bg-slate-50">
                    {product.images?.[0] || product.image ? (
                      <img src={product.images?.[0] || product.image} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full items-center justify-center"><span className="text-xs font-black tracking-[0.2em] text-slate-400">MTG</span></div>
                    )}
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

      {/* WISHLIST */}

      {wishlist.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">

          <div className="flex flex-col justify-between gap-4 rounded-3xl border border-rose-100 bg-rose-50 p-5 sm:flex-row sm:items-center">

            <div>
              <div className="font-black">
                {wishlist.length} saved item
                {wishlist.length > 1
                  ? "s"
                  : ""}
              </div>

              <div className="mt-1 text-xs text-slate-500">
                Saved locally on this
                device.
              </div>
            </div>

            <button
              onClick={
                addAllWishlistToCart
              }
              className="rounded-full bg-[#102a56] px-5 py-3 text-sm font-black text-white"
            >
              Add All to Cart →
            </button>

          </div>

        </section>
      )}

      {/* MOBILE STICKY CART CTA */}
      {cartReady && quickProduct && (
        <div className="fixed bottom-0 left-0 right-0 z-[85] border-t border-slate-200 bg-white/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-2xl backdrop-blur md:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-black text-slate-500">
                {quickProduct.name}
              </div>
              <div className="mt-1 text-lg font-black text-[#102a56]">
                ₹{getDiscountedPrice(quickProduct)}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const quantity =
                  selectedQuantity[quickProduct.id] ?? 1;

                for (let i = 0; i < quantity; i++) {
                  addToCart(quickProduct.id);
                }

                setSelectedQuantity((current) => ({
                  ...current,
                  [quickProduct.id]: 1,
                }));
              }}
              className="rounded-2xl bg-[#102a56] px-6 py-3.5 text-sm font-black text-white shadow-lg"
            >
              ADD TO CART
            </button>
          </div>
        </div>
      )}

      {/* CART FLOAT */}

      {cartReady && cartCount > 0 && (
        <button
          onClick={() =>
            setCartOpen(true)
          }
          className="fixed bottom-20 right-5 z-[70] flex items-center gap-3 rounded-full bg-[#102a56] px-5 py-3.5 text-sm font-black text-white shadow-2xl md:bottom-5"
        >
          View Cart

          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs">
            {cartCount}
          </span>

        </button>
      )}

      {/* QUICK VIEW */}

      {quickProduct && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-5"
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

            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4">

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

              {/* IMAGE */}
              <div>
                <div
                  onClick={() => setZoomImage(true)}
                  className="relative flex aspect-square cursor-zoom-in items-center justify-center overflow-hidden rounded-[2rem] bg-slate-50"
                >
                  <img
                    src={
                      quickProduct.images?.[selectedImageIndex] ||
                      quickProduct.image
                    }
                    alt={quickProduct.name}
                    className="h-full w-full object-cover"
                  />

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-white backdrop-blur">
                    Tap to zoom
                  </div>
                </div>

                {quickProduct.images &&
                  quickProduct.images.length > 1 && (
                    <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                      {quickProduct.images.map(
                        (image, index) => (
                          <button
                            key={`${image}-${index}`}
                            type="button"
                            onClick={() =>
                              setSelectedImageIndex(index)
                            }
                            className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 ${
                              selectedImageIndex === index
                                ? "border-[#102a56]"
                                : "border-slate-200"
                            }`}
                          >
                            <img
                              src={image}
                              alt={`${quickProduct.name} ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </button>
                        )
                      )}
                    </div>
                  )}
              </div>

              {/* DETAILS */}

              <div>

                <div className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">
                  {quickProduct.category}
                </div>

                <h2 className="mt-3 text-3xl font-black tracking-tight">
                  {quickProduct.name}
                </h2>

                <div className="mt-3 flex items-center gap-3">

                  <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                    <Star className="h-4 w-4 fill-current" />
                    {quickProduct.rating}
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
                  Save ₹
                  {quickProduct.price -
                    getDiscountedPrice(
                      quickProduct
                    )}
                </div>

                <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50 p-4">

                  <div className="text-sm font-black text-orange-800">
                    {quickProduct.stock <=
                    5
                      ? `Only ${quickProduct.stock} left`
                      : `✓ ${quickProduct.stock} available`}
                  </div>

                </div>

                {/* COLORS */}

                <div className="mt-7">

                  <div className="mb-3 text-xs font-black uppercase tracking-wider text-slate-500">
                    Colour ·{" "}
                    {getProductColor(
                      quickProduct
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">

                    {(quickProduct.colors ??
                      []).map(
                      (color) => (
                        <button
                          key={color}
                          onClick={() =>
                            setSelectedColors(
                              (current) => ({
                                ...current,
                                [quickProduct.id]:
                                  color,
                              })
                            )
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

                {/* SIZE */}

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

                    {(quickProduct.sizes ??
                      []).map(
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

                <div className="mt-7 flex gap-3">

                  <button
                    onClick={() =>
                      toggleWishlist(
                        quickProduct.id
                      )
                    }
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-xl"
                  >
                    {wishlist.includes(quickProduct.id) ? (
                      <Heart className="h-5 w-5 fill-current" />
                    ) : (
                      <Heart className="h-5 w-5" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      const quantity =
                        selectedQuantity[quickProduct.id] ?? 1;

                      for (let i = 0; i < quantity; i++) {
                        addToCart(quickProduct.id);
                      }

                      setSelectedQuantity((current) => ({
                        ...current,
                        [quickProduct.id]: 1,
                      }));
                    }}
                    className="flex-1 rounded-2xl bg-[#102a56] px-5 py-4 text-sm font-black text-white"
                  >
                    ADD TO CART · ₹
                    {getDiscountedPrice(
                      quickProduct
                    )}
                  </button>

                </div>

                <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-slate-500">
                  <span>
                    ✓ All India Delivery
                  </span>

                  <span>
                    ✓ ₹99 Shipping
                  </span>

                </div>

              </div>
            </div>

            {/* SIMILAR */}

            {similarProducts.length > 0 && (
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
                        className="rounded-2xl border border-slate-200 p-3 text-left"
                      >

                        <div className="aspect-square overflow-hidden rounded-xl bg-slate-50">
                          {product.images?.[0] || product.image ? (
                            <img src={product.images?.[0] || product.image} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <div className="flex h-full items-center justify-center"><span className="text-xs font-black tracking-[0.2em] text-slate-400">MTG</span></div>
                          )}
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

                    <span>
                      {row.chest}
                    </span>

                    <span>
                      {row.length}
                    </span>

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

              Measure around the fullest
              part of your chest and
              compare it with the chart.

            </div>

          </div>
        </div>
      )}

      {/* ZOOM */}

      {zoomImage &&
        quickProduct && (
          <div
            className="fixed inset-0 z-[140] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
            onClick={() => setZoomImage(false)}
          >
            <button
              type="button"
              onClick={() => setZoomImage(false)}
              className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white backdrop-blur"
            >
              ×
            </button>

            <img
              src={
                quickProduct.images?.[selectedImageIndex] ||
                quickProduct.image
              }
              alt={quickProduct.name}
              className="max-h-[90vh] max-w-full rounded-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

      {/* CART + CHECKOUT */}
      {cartOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
          onClick={() => setCartOpen(false)}
        >
          <div
            className="absolute inset-y-0 right-0 w-full max-w-xl overflow-y-auto bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-20 border-b border-slate-200 bg-white px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-black text-slate-950">
                    {checkoutStep === 1
                      ? "Your Cart"
                      : checkoutStep === 2
                      ? "Delivery Details"
                      : "Review Order"}
                  </div>
                  <div className="mt-1 text-xs font-bold text-slate-500">
                    {cartCount} item(s)
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg font-black text-slate-700"
                >
                  ×
                </button>
              </div>

              {cartCount > 0 && (
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {[
                    ["1", "Cart"],
                    ["2", "Delivery"],
                    ["3", "Review"],
                  ].map(([step, label]) => {
                    const active = Number(step) === checkoutStep;
                    const completed = Number(step) < checkoutStep;

                    return (
                      <div
                        key={step}
                        className={`rounded-xl px-3 py-2 text-center text-[11px] font-black ${
                          active
                            ? "bg-[#102a56] text-white"
                            : completed
                            ? "bg-blue-50 text-blue-700"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {step}. {label}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-5">
              {cartCount === 0 ? (
                <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
                  <ShoppingBag className="h-10 w-10 text-slate-300" />
                  <h2 className="mt-5 text-2xl font-black text-slate-950">
                    Your cart is empty
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Add some products before continuing.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCartOpen(false)}
                    className="mt-6 rounded-xl bg-[#102a56] px-6 py-3 text-sm font-black text-white"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <>
                  {/* STEP 1 — CART */}
                  {checkoutStep === 1 && (
                    <>
                      <div className="space-y-3">
                        {cartProducts.map((item) => (
                          <div
                            key={`${item.productId}-${item.size}-${item.color}`}
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                          >
                            <div className="flex gap-4">
                              <div className="flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                                {item.product.image ? (
                                  <img
                                    src={item.product.image}
                                    alt={item.product.name}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <ShoppingBag className="h-6 w-6 text-slate-300" />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="font-black text-slate-950">
                                  {item.product.name}
                                </div>

                                <div className="mt-1 text-xs font-semibold text-slate-500">
                                  Size: {item.size} · Color: {item.color}
                                </div>

                                <div className="mt-2 font-black text-blue-600">
                                  ₹{item.finalPrice}
                                </div>
                              </div>

                              <button
                                type="button"
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
                                  type="button"
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
                                  type="button"
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

                              <div className="font-black text-slate-950">
                                ₹{item.finalPrice * item.quantity}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                        <div className="flex justify-between text-sm text-slate-500">
                          <span>Product Total</span>
                          <span>₹{originalSubtotal}</span>
                        </div>

                        {offerDiscount > 0 && (
                          <div className="mt-3 flex justify-between text-sm font-bold text-green-600">
                            <span>Offer Discount</span>
                            <span>-₹{offerDiscount}</span>
                          </div>
                        )}

                        {buyMoreDiscount > 0 && (
                          <div className="mt-3 flex justify-between text-sm font-bold text-green-600">
                            <span>Buy More Discount</span>
                            <span>-₹{buyMoreDiscount}</span>
                          </div>
                        )}

                        <div className="mt-3 flex justify-between text-sm text-slate-500">
                          <span>Delivery</span>
                          <span>₹{delivery}</span>
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
                        type="button"
                        onClick={() => {
                          if (!checkoutUser) {
                            window.location.href =
                              "/login?redirect=/?checkout=1";
                            return;
                          }

                          if (!checkoutUser.email_confirmed_at) {
                            alert(
                              "Please verify your email before continuing."
                            );
                            window.location.href =
                              "/login?verified=required&redirect=/?checkout=1";
                            return;
                          }

                          setCheckoutStep(2);
                        }}
                        className="mt-5 w-full rounded-2xl bg-[#102a56] px-5 py-4 text-sm font-black text-white"
                      >
                        CONTINUE TO DELIVERY →
                      </button>
                    </>
                  )}

                  {/* STEP 2 — DELIVERY */}
      {checkoutStep === 2 && (
        <>
          <div className="rounded-2xl bg-blue-50 p-4">
            <div className="text-sm font-black text-blue-900">
              Delivery Information
            </div>
            <div className="mt-1 text-xs font-semibold leading-5 text-blue-700">
              Select a saved address or enter a new delivery address.
            </div>
          </div>

          {savedAddresses.length > 0 && (
            <div className="mt-5 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-[#102a56]">
                    Saved Addresses
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Select an address to autofill your delivery details.
                  </p>
                </div>

                {savedAddressesLoading && (
                  <span className="text-xs font-bold text-slate-400">
                    Loading…
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-3">
                {savedAddresses.map((saved: any) => (
                  <button
                    key={saved.id}
                    type="button"
                    onClick={() => {
                      setSelectedSavedAddressId(saved.id);
                      setCustomer((current) => ({
                        ...current,
                        name: saved.name || "",
                        phone: saved.phone || "",
                        address: saved.address || "",
                        city: saved.city || "",
                        state: saved.state || "",
                        pincode: saved.pincode || "",
                      }));
                    }}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedSavedAddressId === saved.id
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                        : "border-slate-200 bg-slate-50 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900">
                          {saved.name || "Saved Address"}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {saved.phone || ""}
                        </p>
                        <p className="mt-2 text-xs leading-5 text-slate-600">
                          {saved.address}, {saved.city}, {saved.state} - {saved.pincode}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black ${
                          selectedSavedAddressId === saved.id
                            ? "bg-[#102a56] text-white"
                            : "bg-white text-slate-500"
                        }`}
                      >
                        {selectedSavedAddressId === saved.id
                          ? "SELECTED"
                          : saved.is_default
                            ? "DEFAULT"
                            : "USE"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedSavedAddressId(null);
                  setCustomer({
                    name: "",
                    email: checkoutUser?.email || "",
                    phone: "",
                    address: "",
                    city: "",
                    state: "",
                    pincode: "",
                  });
                }}
                className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-[#102a56]"
              >
                + USE A NEW ADDRESS
              </button>
            </div>
          )}

          <div className="mt-5 space-y-3">
            <input
              value={customer.name}
              onChange={(e) =>
                setCustomer({ ...customer, name: e.target.value })
              }
              placeholder="Full Name"
              className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-blue-400"
            />

            <input
              value={customer.phone}
              onChange={(e) =>
                setCustomer({ ...customer, phone: e.target.value })
              }
              placeholder="Phone Number"
              inputMode="numeric"
              className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-blue-400"
            />

            <textarea
              value={customer.address}
              onChange={(e) =>
                setCustomer({ ...customer, address: e.target.value })
              }
              placeholder="Complete Delivery Address"
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-blue-400"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                value={customer.city}
                onChange={(e) =>
                  setCustomer({ ...customer, city: e.target.value })
                }
                placeholder="City"
                className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-blue-400"
              />

              <input
                value={customer.state}
                onChange={(e) =>
                  setCustomer({ ...customer, state: e.target.value })
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
                  pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                })
              }
              placeholder="Pincode"
              inputMode="numeric"
              maxLength={6}
              className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-blue-400"
            />

            {customer.pincode.length === 6 && (
              <div className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
                ✓ Delivery available to {customer.pincode}
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setCheckoutStep(1)}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-black text-slate-700"
            >
              BACK
            </button>

            <button
              type="button"
              onClick={() => {
                if (
                  !customer.name.trim() ||
                  !customer.phone.trim() ||
                  !customer.address.trim() ||
                  !customer.city.trim() ||
                  !customer.state.trim() ||
                  customer.pincode.trim().length !== 6
                ) {
                  alert("Please complete all delivery details.");
                  return;
                }

                setCheckoutStep(3);
              }}
              className="flex-1 rounded-xl bg-[#102a56] px-4 py-3.5 text-sm font-black text-white"
            >
              CONTINUE
            </button>
          </div>
        </>
      )}

      {/* STEP 3 — REVIEW */}
                  {checkoutStep === 3 && (
                    <>
                      <div className="rounded-2xl border border-slate-200 p-5">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-black">
                            Delivery Details
                          </div>
                          <button
                            type="button"
                            onClick={() => setCheckoutStep(2)}
                            className="text-xs font-black text-blue-600"
                          >
                            EDIT
                          </button>
                        </div>

                        <div className="mt-4 space-y-1 text-sm text-slate-600">
                          <div className="font-black text-slate-950">
                            {customer.name}
                          </div>
                          <div>{customer.phone}</div>
                          <div>{customer.address}</div>
                          <div>
                            {customer.city}, {customer.state} -{" "}
                            {customer.pincode}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-slate-200 p-5">
                        <div className="text-sm font-black">Order Items</div>

                        <div className="mt-4 space-y-3">
                          {cartProducts.map((item) => (
                            <div
                              key={`${item.productId}-${item.size}-${item.color}`}
                              className="flex items-center justify-between gap-4"
                            >
                              <div className="min-w-0">
                                <div className="truncate text-sm font-black">
                                  {item.product.name}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {item.size} · {item.color} · Qty{" "}
                                  {item.quantity}
                                </div>
                              </div>

                              <div className="shrink-0 text-sm font-black">
                                ₹{item.finalPrice * item.quantity}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl bg-slate-50 p-5">
                        <div className="flex justify-between text-sm text-slate-500">
                          <span>Product Total</span>
                          <span>₹{originalSubtotal}</span>
                        </div>

                        {offerDiscount > 0 && (
                          <div className="mt-3 flex justify-between text-sm font-bold text-green-600">
                            <span>Offer Discount</span>
                            <span>-₹{offerDiscount}</span>
                          </div>
                        )}

                        {buyMoreDiscount > 0 && (
                          <div className="mt-3 flex justify-between text-sm font-bold text-green-600">
                            <span>Buy More Discount</span>
                            <span>-₹{buyMoreDiscount}</span>
                          </div>
                        )}

                        {appliedCoupon && (
                          <div className="mt-3 flex justify-between text-sm font-bold text-green-600">
                            <span>Coupon ({appliedCoupon.code})</span>
                            <span>-₹{couponDiscount}</span>
                          </div>
                        )}

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

                      <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-xs font-bold leading-5 text-blue-800">
                        Your order will be confirmed with our team on WhatsApp.
                        No payment details are required on this website.
                      </div>

                      <div className="mt-5 flex gap-3">
                        <button
                          type="button"
                          onClick={() => setCheckoutStep(2)}
                          className="w-1/3 rounded-2xl border border-slate-200 px-4 py-4 text-sm font-black text-slate-700"
                        >
                          ← BACK
                        </button>

                        <button
                          type="button"
                          onClick={sendWhatsAppOrder}
                          className="w-2/3 rounded-2xl bg-[#102a56] px-4 py-4 text-sm font-black text-white"
                        >
                          CONFIRM & CONTINUE TO WHATSAPP →
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}


    </main>
  );
}
