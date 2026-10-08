"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  UtensilsCrossed,
} from "lucide-react";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function showAlert(icon, title, text) {
    Swal.fire({
      icon,
      title,
      text,
      confirmButtonColor: "#d4af37",
      background: "#111111",
      color: "#f5f1e8",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.email.trim()) {
      showAlert(
        "warning",
        "Email Required",
        "Please enter your email address.",
      );
      return;
    }

    if (!form.password) {
      showAlert("warning", "Password Required", "Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        showAlert("error", "Login Failed", "Invalid email or password.");
        return;
      }

      await Swal.fire({
        icon: "success",
        title: "Welcome Back!",
        text: "You have successfully signed in.",
        confirmButtonText: "Continue",
        confirmButtonColor: "#d4af37",
        background: "#111111",
        color: "#f5f1e8",
      });

      const callbackUrl = searchParams.get("callbackUrl") || "/";

      router.push(callbackUrl);
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);

      showAlert(
        "error",
        "Something Went Wrong",
        "Unable to login right now. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080808] px-4 py-32">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#d4af37]/5 blur-[120px]" />

        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-[#7f1d2d]/10 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-[#d4af37]/30 bg-[#111111] shadow-[0_0_40px_rgba(212,175,55,0.08)]"
          >
            <UtensilsCrossed size={28} className="text-[#d4af37]" />
          </Link>

          <p className="text-xs uppercase tracking-[0.4em] text-[#d4af37]">
            ST Restaurant
          </p>

          <h1 className="mt-3 text-4xl font-semibold text-[#f5f1e8]">
            Welcome Back
          </h1>

          <p className="mt-3 text-sm text-white/45">
            Sign in to continue your dining experience.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-[#d4af37]/15 bg-[#111111]/95 p-6 shadow-2xl backdrop-blur-xl md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="mb-2 block text-sm text-white/70">
                Email Address
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                />

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full rounded-xl border border-white/10 bg-black/30 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#d4af37]/60 focus:ring-1 focus:ring-[#d4af37]/20"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm text-white/70">
                Password
              </label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                />

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-white/10 bg-black/30 py-3.5 pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#d4af37]/60 focus:ring-1 focus:ring-[#d4af37]/20"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-white/35 transition hover:text-[#d4af37]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="gold-button flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* Google */}
            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />

              <span className="text-xs uppercase tracking-widest text-white/30">
                OR
              </span>

              <div className="h-px flex-1 bg-white/10" />
            </div>

            <button
              type="button"
              onClick={() =>
                signIn("google", {
                  callbackUrl: "/",
                })
              }
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 font-medium text-white transition hover:border-[#d4af37]/40 hover:bg-white/10"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21.35 12.23c0-.78-.07-1.54-.23-2.27H12v4.3h5.24a4.48 4.48 0 01-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.42z"
                  fill="#4285F4"
                />

                <path
                  d="M12 21.5c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.75 9.75 0 0012 21.5z"
                  fill="#34A853"
                />

                <path
                  d="M6.54 13.59A5.86 5.86 0 016.23 12c0-.55.11-1.09.31-1.59V7.88H3.3A9.75 9.75 0 002.25 12c0 1.57.38 3.05 1.05 4.12l3.24-2.53z"
                  fill="#FBBC05"
                />

                <path
                  d="M12 6.38c1.43 0 2.72.49 3.73 1.45l2.8-2.8C16.84 3.45 14.63 2.5 12 2.5a9.75 9.75 0 00-8.7 5.38l3.24 2.53C7.31 8.1 9.46 6.38 12 6.38z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>
          </form>

          {/* Register */}
          <div className="mt-7 border-t border-white/10 pt-6 text-center">
            <p className="text-sm text-white/40">Don't have an account?</p>

            <Link
              href="/register"
              className="mt-2 inline-block text-sm font-semibold text-[#d4af37] transition hover:text-[#f1d77a]"
            >
              Create an account
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-white/25">
          © {new Date().getFullYear()} ST Restaurant. All rights reserved.
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#080808]">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#d4af37]/30 border-t-[#d4af37]" />
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
