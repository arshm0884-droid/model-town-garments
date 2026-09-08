"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  X,
  Home,
  ShoppingBag,
  Heart,
  Package,
  User,
  HelpCircle,
  LogIn,
} from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  isLoggedIn?: boolean;
};

export default function MobileMenu({
  open,
  onClose,
  isLoggedIn = false,
}: Props) {
  useEffect(() => {
    if (!open) return;

    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = old;
    };
  }, [open]);

  const [loggedIn, setLoggedIn] = useState(isLoggedIn);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setLoggedIn(Boolean(data.user)));
    const { data: auth } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(Boolean(session?.user));
    });
    return () => auth.subscription.unsubscribe();
  }, [isLoggedIn]);

  if (!open) return null;

  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/#shop", label: "Shop", icon: ShoppingBag },
    { href: "/wishlist", label: "Wishlist", icon: Heart },
    { href: "/account/orders", label: "Orders", icon: Package },
    {
      href: loggedIn ? "/account" : "/login",
      label: loggedIn ? "My Account" : "Sign In",
      icon: loggedIn ? User : LogIn,
    },
    { href: "/help", label: "Help & Support", icon: HelpCircle },
  ];

  return (
    <div className="mt-mobile-overlay" onClick={onClose}>
      <aside
        className="mt-mobile-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mt-mobile-head">
          <div>
            <strong>MODEL TOWN</strong>
            <span>GARMENTS</span>
          </div>

          <button
            type="button"
            className="mt-mobile-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={21} />
          </button>
        </div>

        <nav className="mt-mobile-nav">
          {links.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                href={item.href}
                key={item.href}
                onClick={onClose}
                className="mt-mobile-link"
              >
                <span className="mt-mobile-link-icon">
                  <Icon size={19} strokeWidth={1.9} />
                </span>

                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

      </aside>
    </div>
  );
}
