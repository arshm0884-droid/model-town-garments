"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Mode = "login" | "signup" | "forgot";

type Step = "form" | "otp" | "password";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState<Step>("form");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [seconds, setSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [redirectTo, setRedirectTo] = useState("/account");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");

    if (redirect && redirect.startsWith("/")) {
      setRedirectTo(redirect);
    }
  }, []);

  useEffect(() => {
    if (seconds <= 0) return;

    const timer = window.setInterval(() => {
      setSeconds((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [seconds]);

  function clearMessages() {
    setError("");
    setMessage("");
  }

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setStep("form");
    setOtp("");
    setPassword("");
    setNewPassword("");
    clearMessages();
  }

  async function signup(event: FormEvent) {
    event.preventDefault();
    clearMessages();

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.replace(/\D/g, "");

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (normalizedPhone.length < 10) {
      setError("Please enter a valid phone number.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const { data, error: signupError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          name: name.trim(),
          phone: normalizedPhone,
        },
      },
    });

    setLoading(false);

    if (signupError) {
      setError(signupError.message);
      return;
    }

    setEmail(normalizedEmail);
    setStep("otp");
    setSeconds(60);

    if (data.session) {
      await saveCustomerProfile(data.user?.id || "");
      router.replace(redirectTo);
      router.refresh();
      return;
    }

    setMessage(
      "Verification OTP sent to your email. Check your inbox and spam folder."
    );
  }

  async function verifySignupOtp(event: FormEvent) {
    event.preventDefault();
    clearMessages();

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit OTP.");
      return;
    }

    setLoading(true);

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "signup",
    });

    setLoading(false);

    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    await saveCustomerProfile(data.user?.id || "");

    router.replace(redirectTo);
    router.refresh();
  }

  async function login(event: FormEvent) {
    event.preventDefault();
    clearMessages();

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    const { data, error: loginError } =
      await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

    setLoading(false);

    if (loginError) {
      setError(loginError.message);
      return;
    }

    await saveCustomerProfile(data.user?.id || "");

    router.replace(redirectTo);
    router.refresh();
  }

  async function sendForgotOtp(event?: FormEvent) {
    event?.preventDefault();
    clearMessages();

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    const { error: resetError } =
      await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/login`,
      });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setEmail(normalizedEmail);
    setStep("otp");
    setSeconds(60);
    setMessage(
      "Password reset OTP sent. Check your email inbox and spam folder."
    );
  }

  async function verifyRecoveryOtp(event: FormEvent) {
    event.preventDefault();
    clearMessages();

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit OTP.");
      return;
    }

    setLoading(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "recovery",
    });

    setLoading(false);

    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    setStep("password");
    setMessage("OTP verified. Create your new password.");
  }

  async function updatePassword(event: FormEvent) {
    event.preventDefault();
    clearMessages();

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage("Password updated successfully. Logging you in...");

    setTimeout(() => {
      router.replace(redirectTo);
      router.refresh();
    }, 700);
  }

  async function resendOtp() {
    clearMessages();

    if (seconds > 0 || loading) return;

    setLoading(true);

    let resendError = null;

    if (mode === "signup") {
      const result = await supabase.auth.resend({
        type: "signup",
        email,
      });
      resendError = result.error;
    } else if (mode === "forgot") {
      const result = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      resendError = result.error;
    }

    setLoading(false);

    if (resendError) {
      setError(resendError.message);
      return;
    }

    setSeconds(60);
    setMessage("A new OTP has been sent to your email.");
  }

  async function saveCustomerProfile(userId: string) {
    if (!userId) return;

    const normalizedPhone = phone.replace(/\D/g, "");

    if (!name.trim() && !normalizedPhone) return;

    const { error } = await supabase.from("customers").upsert(
      {
        id: userId,
        name: name.trim() || null,
        email: email.trim().toLowerCase(),
        phone: normalizedPhone || null,
      },
      {
        onConflict: "id",
      }
    );

    if (error) {
      console.error("Customer profile save error:", error);
    }
  }

  const title =
    mode === "signup"
      ? "Create your account"
      : mode === "forgot"
        ? "Reset your password"
        : "Welcome back";

  const description =
    mode === "signup"
      ? "Create your account with your email, phone and password."
      : mode === "forgot"
        ? "Verify your email and create a new password."
        : "Sign in with your email and password.";

  return (
    <main className="mtg-customer-page min-h-screen bg-[#f7f9fc] px-4 py-8 text-slate-900 sm:px-6 sm:py-14">
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
              Your orders.
              <br />
              Your style.
            </h1>

            <p className="mt-5 max-w-sm text-sm leading-7 text-blue-100">
              Secure account access, order history, invoices and real-time
              order tracking in one place.
            </p>
          </div>

          <div className="space-y-4 text-sm text-blue-100">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5" />
              Secure email verification
            </div>

            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5" />
              Orders and saved customer details
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
              {title}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              {description}
            </p>
          </div>

          {step === "form" && mode === "login" && (
            <form onSubmit={login} className="mt-9 space-y-5">
              <Field
                icon={<Mail className="h-5 w-5" />}
                label="Email address"
                value={email}
                onChange={setEmail}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
              />

              <Field
                icon={<LockKeyhole className="h-5 w-5" />}
                label="Password"
                value={password}
                onChange={setPassword}
                type="password"
                placeholder="Your password"
                autoComplete="current-password"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="text-sm font-bold text-[#2563eb] hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <Message error={error} message={message} />

              <button
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#102a56] px-5 py-4 text-sm font-black text-white transition hover:bg-[#173d79] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in…" : "Login"}
                <ArrowRight className="h-4 w-4" />
              </button>

              <p className="text-center text-sm text-slate-500">
                New customer?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="font-black text-[#2563eb]"
                >
                  Create an account
                </button>
              </p>
            </form>
          )}

          {step === "form" && mode === "signup" && (
            <form onSubmit={signup} className="mt-9 space-y-5">
              <Field
                icon={<User className="h-5 w-5" />}
                label="Full name"
                value={name}
                onChange={setName}
                type="text"
                placeholder="Your full name"
                autoComplete="name"
              />

              <Field
                icon={<Mail className="h-5 w-5" />}
                label="Email address"
                value={email}
                onChange={setEmail}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
              />

              <Field
                icon={<Phone className="h-5 w-5" />}
                label="Phone number"
                value={phone}
                onChange={(value) =>
                  setPhone(value.replace(/\D/g, "").slice(0, 15))
                }
                type="tel"
                placeholder="10-digit mobile number"
                autoComplete="tel"
              />

              <Field
                icon={<LockKeyhole className="h-5 w-5" />}
                label="Password"
                value={password}
                onChange={setPassword}
                type="password"
                placeholder="Minimum 6 characters"
                autoComplete="new-password"
              />

              <Message error={error} message={message} />

              <button
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#102a56] px-5 py-4 text-sm font-black text-white transition hover:bg-[#173d79] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating account…" : "Continue"}
                <ArrowRight className="h-4 w-4" />
              </button>

              <p className="text-center text-sm text-slate-500">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="font-black text-[#2563eb]"
                >
                  Login
                </button>
              </p>
            </form>
          )}

          {step === "form" && mode === "forgot" && (
            <form onSubmit={sendForgotOtp} className="mt-9 space-y-5">
              <Field
                icon={<Mail className="h-5 w-5" />}
                label="Account email"
                value={email}
                onChange={setEmail}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
              />

              <Message error={error} message={message} />

              <button
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#102a56] px-5 py-4 text-sm font-black text-white transition hover:bg-[#173d79] disabled:opacity-60"
              >
                {loading ? "Sending OTP…" : "Send Reset OTP"}
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => switchMode("login")}
                className="w-full text-sm font-bold text-slate-500 hover:text-slate-900"
              >
                ← Back to Login
              </button>
            </form>
          )}

          {step === "otp" && (
            <form
              onSubmit={
                mode === "signup"
                  ? verifySignupOtp
                  : verifyRecoveryOtp
              }
              className="mt-9 space-y-5"
            >
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
                    setOtp(
                      e.target.value.replace(/\D/g, "").slice(0, 6)
                    )
                  }
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center text-2xl font-black tracking-[0.45em] outline-none focus:border-blue-500 focus:bg-white"
                />
              </label>

              <Message error={error} message={message} />

              <button
                disabled={loading}
                className="w-full rounded-2xl bg-[#102a56] px-5 py-4 text-sm font-black text-white transition hover:bg-[#173d79] disabled:opacity-60"
              >
                {loading
                  ? "Verifying…"
                  : mode === "signup"
                    ? "Verify & Create Account"
                    : "Verify OTP"}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep("form");
                    setOtp("");
                    clearMessages();
                  }}
                  className="font-bold text-slate-500 hover:text-slate-900"
                >
                  Change email
                </button>

                <button
                  type="button"
                  disabled={seconds > 0 || loading}
                  onClick={resendOtp}
                  className="font-bold text-[#2563eb] disabled:text-slate-400"
                >
                  {seconds
                    ? `Resend in ${seconds}s`
                    : "Resend OTP"}
                </button>
              </div>
            </form>
          )}

          {step === "password" && mode === "forgot" && (
            <form onSubmit={updatePassword} className="mt-9 space-y-5">
              <Field
                icon={<LockKeyhole className="h-5 w-5" />}
                label="New password"
                value={newPassword}
                onChange={setNewPassword}
                type="password"
                placeholder="Minimum 6 characters"
                autoComplete="new-password"
              />

              <Message error={error} message={message} />

              <button
                disabled={loading}
                className="w-full rounded-2xl bg-[#102a56] px-5 py-4 text-sm font-black text-white transition hover:bg-[#173d79] disabled:opacity-60"
              >
                {loading ? "Updating…" : "Set New Password"}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

function Field({
  icon,
  label,
  value,
  onChange,
  type,
  placeholder,
  autoComplete,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type: string;
  placeholder: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>

      <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 focus-within:border-blue-500 focus-within:bg-white">
        <span className="text-slate-400">{icon}</span>

        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="w-full bg-transparent px-3 py-4 text-sm outline-none"
        />
      </div>
    </label>
  );
}

function Message({
  error,
  message,
}: {
  error: string;
  message: string;
}) {
  return (
    <>
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
    </>
  );
}
