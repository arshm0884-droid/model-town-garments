"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  MessageCircle,
  Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { storeData } from "@/data/storeData";

type Product = {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  price?: number;
  sale_price?: number;
  image?: string;
  images?: string[];
  category?: string;
  stock?: number;
  sizes?: string[] | string;
  colors?: string[] | string;
};

function normalize(value: string[] | string | undefined) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    params.then((value) => setId(value.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      const supabase = createClient();

      let result = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!result.data) {
        result = await supabase
          .from("products")
          .select("*")
          .eq("slug", id)
          .maybeSingle();
      }

      setProduct(result.data as Product | null);
      setLoading(false);
    };

    load();
  }, [id]);

  useEffect(() => {
    if (!product?.id) return;
    const loadWishlistState = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("wishlists")
        .select("product_id")
        .eq("user_id", user.id)
        .eq("product_id", product.id)
        .maybeSingle();
      setSaved(Boolean(data));
    };
    loadWishlistState();
  }, [product?.id]);

  const images = useMemo(() => {
    if (!product) return [];
    return Array.from(
      new Set(
        [
          product.image,
          ...(Array.isArray(product.images) ? product.images : []),
        ].filter(Boolean)
      )
    ) as string[];
  }, [product]);

  const sizes = normalize(product?.sizes);
  const colors = normalize(product?.colors);

  const price = Number(product?.sale_price ?? product?.price ?? 0);
  const original = product?.sale_price ? Number(product.price ?? 0) : 0;
  const discount =
    original > price ? Math.round(((original - price) / original) * 100) : 0;

  const addToCart = (openCart = false) => {
    if (!product) return;

    const staticProduct = storeData.products.find(
      (item) => item.name.trim().toLowerCase() === product.name.trim().toLowerCase()
    );

    if (!staticProduct) {
      alert("This product is not available for checkout yet.");
      return;
    }

    const cartKey = "mtg_cart";
    let cart: Array<{ productId: number; size: string; color: string; quantity: number }> = [];
    try {
      cart = JSON.parse(localStorage.getItem(cartKey) || "[]");
    } catch {
      cart = [];
    }

    const size = selectedSize || staticProduct.sizes?.[0] || "";
    const color = selectedColor || staticProduct.colors?.[0] || "";
    const existing = cart.find(
      (item) => item.productId === staticProduct.id && item.size === size && item.color === color
    );

    if (existing) existing.quantity += quantity;
    else cart.push({ productId: staticProduct.id, size, color, quantity });

    localStorage.setItem(cartKey, JSON.stringify(cart));
    window.dispatchEvent(new Event("mtg-cart-updated"));

    if (openCart) {
      window.location.href = "/?checkout=1";
      return;
    }

    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  const toggleWishlist = async () => {
    if (!product) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = `/login?redirect=/product/${encodeURIComponent(id)}`;
      return;
    }

    if (saved) {
      const { error } = await supabase
        .from("wishlists")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", product.id);
      if (!error) setSaved(false);
      return;
    }

    const { error } = await supabase
      .from("wishlists")
      .upsert({ user_id: user.id, product_id: product.id }, { onConflict: "user_id,product_id" });
    if (!error) setSaved(true);
  };

  if (loading) {
    return (
      <main className="mt-product-page">
        <div className="mt-product-loading">
          <div />
          <div />
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="mt-product-page">
        <div className="mt-product-not-found">
          <ShoppingBag size={30} />
          <h1>Product not found</h1>
          <p>This product may no longer be available.</p>
          <Link href="/shop">Back to Shop</Link>
        </div>
      </main>
    );
  }

  const stock = Number(product.stock ?? 0);

  return (
    <main className="mt-product-page">
      <div className="mt-product-shell">

        <Link href="/shop" className="mt-product-back">
          <ArrowLeft size={17} />
          Back to Shop
        </Link>

        <div className="mt-product-layout">

          <section className="mt-product-gallery">
            <div className="mt-product-main-image">
              {images.length > 0 ? (
                <img
                  src={images[activeImage]}
                  alt={product.name}
                  fetchPriority="high"
                />
              ) : (
                <div className="mt-product-no-image">
                  <ShoppingBag size={35} />
                </div>
              )}

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    className="mt-gallery-arrow left"
                    onClick={() =>
                      setActiveImage(
                        activeImage === 0 ? images.length - 1 : activeImage - 1
                      )
                    }
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <button
                    type="button"
                    className="mt-gallery-arrow right"
                    onClick={() =>
                      setActiveImage(
                        activeImage === images.length - 1 ? 0 : activeImage + 1
                      )
                    }
                    aria-label="Next image"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-product-thumbs">
                {images.map((image, index) => (
                  <button
                    type="button"
                    key={image}
                    className={activeImage === index ? "active" : ""}
                    onClick={() => setActiveImage(index)}
                  >
                    <img src={image} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="mt-product-details">

            {product.category && (
              <span className="mt-product-category">
                {product.category}
              </span>
            )}

            <h1>{product.name}</h1>

            <div className="mt-detail-price">
              <strong>₹{price.toLocaleString("en-IN")}</strong>

              {original > price && (
                <>
                  <del>₹{original.toLocaleString("en-IN")}</del>
                  <span>{discount}% OFF</span>
                </>
              )}
            </div>

            {stock > 0 ? (
              <div className="mt-stock available">
                <Check size={15} />
                In stock
                {stock <= 5 && ` · Only ${stock} left`}
              </div>
            ) : (
              <div className="mt-stock unavailable">Out of stock</div>
            )}

            {product.description && (
              <div className="mt-product-description">
                <h2>Product Details</h2>
                <p>{product.description}</p>
              </div>
            )}

            {sizes.length > 0 && (
              <div className="mt-variant-section">
                <div className="mt-variant-head">
                  <strong>Size</strong>
                  {selectedSize && <span>{selectedSize}</span>}
                </div>

                <div className="mt-variant-options">
                  {sizes.map((size) => (
                    <button
                      type="button"
                      key={size}
                      className={selectedSize === size ? "active" : ""}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {colors.length > 0 && (
              <div className="mt-variant-section">
                <div className="mt-variant-head">
                  <strong>Color</strong>
                  {selectedColor && <span>{selectedColor}</span>}
                </div>

                <div className="mt-variant-options">
                  {colors.map((color) => (
                    <button
                      type="button"
                      key={color}
                      className={selectedColor === color ? "active" : ""}
                      onClick={() => setSelectedColor(color)}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-product-buy-row">
              <div className="mt-quantity">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  aria-label="Decrease quantity"
                >
                  <Minus size={15} />
                </button>

                <span>{quantity}</span>

                <button
                  type="button"
                  onClick={() =>
                    setQuantity(
                      stock > 0 ? Math.min(stock, quantity + 1) : quantity + 1
                    )
                  }
                  aria-label="Increase quantity"
                >
                  <Plus size={15} />
                </button>
              </div>

              <button
                type="button"
                className="mt-add-cart-btn"
                disabled={stock <= 0}
                onClick={() => addToCart()}
              >
                {added ? <Check size={18} /> : <ShoppingBag size={18} />}
                {added ? "Added" : "Add to Cart"}
              </button>
            </div>

            <button
              type="button"
              className="mt-whatsapp-order-btn"
              disabled={stock <= 0}
              onClick={() => addToCart(true)}
            >
              <MessageCircle size={18} />
              Order on WhatsApp
            </button>

            <button
              type="button"
              className={`mt-detail-wishlist ${saved ? "active" : ""}`}
              onClick={toggleWishlist}
            >
              <Heart size={17} fill={saved ? "currentColor" : "none"} />
              {saved ? "Saved to Wishlist" : "Add to Wishlist"}
            </button>

            <div className="mt-product-service">
              <div>
                <TruckIcon />
                <span>
                  <strong>Reliable Delivery</strong>
                  Delivery updates available after order confirmation.
                </span>
              </div>

              <div>
                <ShieldIcon />
                <span>
                  <strong>Trusted Service</strong>
                  Contact support anytime for order assistance.
                </span>
              </div>
            </div>

          </section>
        </div>
      </div>
    </main>
  );
}

function TruckIcon() {
  return <ShoppingBag size={19} />;
}

function ShieldIcon() {
  return <Check size={19} />;
}
