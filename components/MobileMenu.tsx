"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, User, LogIn, MessageCircle } from "lucide-react";
import { storeData } from "@/data/storeData";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close menu" : "Open menu"}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#102a56]"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="fixed inset-x-0 top-[73px] z-50 border-b border-slate-200 bg-white shadow-xl">
          <div className="space-y-1 p-4">
            <Link
              href="/"
              onClick={closeMenu}
              className="block rounded-xl px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Home
            </Link>

            <a
              href="#shop"
              onClick={closeMenu}
              className="block rounded-xl px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Shop
            </a>

            <a
              href="#brands"
              onClick={closeMenu}
              className="block rounded-xl px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Brands
            </a>

            <a
              href="#about"
              onClick={closeMenu}
              className="block rounded-xl px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              About
            </a>

            <a
              href="#location"
              onClick={closeMenu}
              className="block rounded-xl px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Location
            </a>

            <Link
              href="/account"
              onClick={closeMenu}
              className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 font-bold text-[#102a56]"
            >
              <User className="h-5 w-5" />
              My Account
            </Link>

            <Link
              href="/login"
              onClick={closeMenu}
              className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              <LogIn className="h-5 w-5" />
              Login
            </Link>

            <a
              href={`https://wa.me/${storeData.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
              className="flex items-center gap-3 rounded-xl bg-[#102a56] px-4 py-3 font-bold text-white"
            >
              <MessageCircle className="h-5 w-5" />
              WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
