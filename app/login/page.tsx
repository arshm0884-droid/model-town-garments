"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (seconds <= 0) return;

    const timer = window.setInterval(() => {
      setSeconds((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [seconds]);

  async function sendOtp(event?: FormEvent) {
    event?.preventDefault();

    setError("");
    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: true,
      },
    });

    setLoading(false);

    if (otpError) {
      setError(otpError.message);
      return;
    }

    setEmail(normalizedEmail);
    setSent(true);
    setSeconds(60);
    setMessage("OTP sent. Check your email inbox and spam folder.");
  }

  async function verifyOtp(event: FormEvent) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit OTP.");
      return;
    }

    setLoading(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });

    setLoading(false);

    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    router.replace("/account");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-8 text-slate-900 sm:px-6 sm:py-14">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_25px_80px_rgba(15,42,86,0.12)] lg:grid-cols-[0.9fr_1.1fr]">

        <section className="hidden bg-[#102a56] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg font-black text-[#102a56]">
              MT
            </div>

            <p className="mt-8 text-xs font-bold tracking-[0.28em] text-blue-200">
              MODEL TOWN GARMENTS
            </p>

            <h1 className="mt-4 text-4xl font-black leading-tight">
              Your account.
              <br />
              Your style.
            </h1>

            <p className="mt-5 max-w-sm text-sm leading-7 text-blue-100">
              Sign in securely with a one-time email code. No password to
              remember.
            </p>
          </div>

          <div className="space-y-4 text-sm text-blue-100">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5" />
              Secure email authentication
            </div>

            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5" />
              Orders and saved addresses
            </div>
          </div>
        </section>

        <section className="p-6 sm:p-10 lg:p-14">
          <div className="lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#102a56] text-sm font-black text-white">
              MT
            </div>
          </div>

          <div className="mt-7 lg:mt-0">
            <p className="text-xs font-black tracking-[0.22em] text-[#2563eb]">
              MY ACCOUNT
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Login or Sign up
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Use your email to receive a secure 6-digit OTP.
            </p>
          </div>

          {!sent ? (
            <form onSubmit={sendOtp} className="mt-9 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Email address
                </span>

                <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 focus-within:border-blue-500 focus-within:bg-white">
                  <Mail className="h-5 w-5 text-slate-400" />

                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="w-full bg-transparent px-3 py-4 text-sm outline-none"
                  />
                </div>
              </label>

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </p>
              )}

              <button
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#102a56] px-5 py-4 text-sm font-black text-white transition hover:bg-[#173d79] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Sending OTP…" : "Continue with Email"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="mt-9 space-y-5">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                OTP sent to <strong>{email}</strong>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  6-digit OTP
                </span>

                <input
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center text-2xl font-black tracking-[0.45em] outline-none focus:border-blue-500 focus:bg-white"
                />
              </label>

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </p>
              )}

              {message && (
                <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                  {message}
                </p>
              )}

              <button
                disabled={loading}
                className="w-full rounded-2xl bg-[#102a56] px-5 py-4 text-sm font-black text-white transition hover:bg-[#173d79] disabled:opacity-60"
              >
                {loading ? "Verifying…" : "Verify & Continue"}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setOtp("");
                    setError("");
                    setMessage("");
                  }}
                  className="font-bold text-slate-500 hover:text-slate-900"
                >
                  Change email
                </button>

                <button
                  type="button"
                  disabled={seconds > 0 || loading}
                  onClick={() => sendOtp()}
                  className="font-bold text-[#2563eb] disabled:text-slate-400"
                >
                  {seconds ? `Resend in ${seconds}s` : "Resend OTP"}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
