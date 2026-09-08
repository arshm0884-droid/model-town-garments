"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Wish = {
  productId: string;
  name: string;
  price: number;
  image?: string;
  slug?: string;
};

export default function WishlistPage() {
  const [items, setItems] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login?redirect=/wishlist";
        return;
      }

      const { data, error } = await supabase
        .from("wishlists")
        .select(`
          product_id,
          product:products(
            id,
            name,
            slug,
            price,
            sale_price,
            image,
            images
          )
        `)
        .eq("user_id", user.id);

      if (error) {
        console.error("Wishlist load error:", error);
        setItems([]);
        setLoading(false);
        return;
      }

      const next: Wish[] = (data || [])
        .map((row: any) => {
          const product = Array.isArray(row.product)
            ? row.product[0]
            : row.product;

          if (!product) return null;

          return {
            productId: product.id,
            name: product.name,
            price: Number(product.sale_price ?? product.price ?? 0),
            image:
              product.image ||
              (Array.isArray(product.images) ? product.images[0] : ""),
            slug: product.slug,
          };
        })
        .filter(Boolean) as Wish[];

      setItems(next);
      setLoading(false);
    };

    load();
  }, []);

  const remove = async (id: string) => {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("wishlists")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", id);

    if (error) {
      console.error("Wishlist remove error:", error);
      return;
    }

    setItems((current) =>
      current.filter((item) => item.productId !== id)
    );
  };

  return (
    <main className="mtg-customer-page mt-account-simple-page">
      <div className="mt-simple-shell">
        <header className="mt-simple-header">
          <span>MY ACCOUNT</span>
          <h1>Wishlist</h1>
          <p>Your saved products.</p>
        </header>

        {loading ? (
          <div className="mt-orders-loading">
            <div />
            <div />
          </div>
        ) : items.length === 0 ? (
          <div className="mt-simple-empty">
            <Heart size={30} />
            <h2>Your wishlist is empty</h2>
            <p>Save products here to find them easily later.</p>
            <Link href="/shop">Explore Shop</Link>
          </div>
        ) : (
          <div className="mt-wishlist-grid">
            {items.map((item) => (
              <article
                className="mt-wish-card"
                key={item.productId}
              >
                <Link
                  href={`/product/${item.slug || item.productId}`}
                >
                  <div className="mt-wish-image">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                      />
                    ) : (
                      <ShoppingBag size={25} />
                    )}
                  </div>
                </Link>

                <div className="mt-wish-info">
                  <h2>{item.name}</h2>
                  <strong>
                    ₹{Number(item.price).toLocaleString("en-IN")}
                  </strong>

                  <button
                    type="button"
                    onClick={() => remove(item.productId)}
                  >
                    <X size={15} />
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
