"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AuthButton() {
  const [user, setUser] = useState<Awaited<
    ReturnType<ReturnType<typeof createClient>["auth"]["getUser"]>
  >["data"]["user"]>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (user) {
    return (
      <Link
        href="/account"
        className="inline-flex items-center gap-2 rounded-xl bg-[#102a56] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0b2145]"
      >
        <User className="h-4 w-4" />
        <span className="hidden sm:inline">My Account</span>
        <span className="sm:hidden">Account</span>
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#102a56] transition hover:bg-slate-50"
    >
      <LogIn className="h-4 w-4" />
      Login
    </Link>
  );
}
