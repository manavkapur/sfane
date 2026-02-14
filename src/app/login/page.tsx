"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/cart";

  const isCheckoutRedirect = redirectTo.startsWith("/checkout");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace(redirectTo);
      }
    });
  }, [supabase, router, redirectTo]);

  const onLogin = async () => {
    if (!supabase || !email.trim() || !password.trim()) return;

    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Signed in.");
    setLoading(false);
    router.replace(redirectTo);
  };

  const helpAction = async () => {
    if (!supabase || !email.trim()) return;
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }
    setMessage("Password reset link sent to your email.");
    setLoading(false);
  };

  if (!supabase) {
    return (
      <main className="min-h-screen bg-white text-[#111111]">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <p className="rounded-2xl border border-dashed border-[#d2d2d7] bg-white p-6 text-sm text-[#6e6e73]">
            Missing Supabase env vars. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <div className="mx-auto max-w-4xl px-6 pb-24 pt-16">
        <h1 className="text-center text-5xl font-semibold tracking-tight md:text-6xl">
          {isCheckoutRedirect ? "Sign in for faster checkout." : "Sign in."}
        </h1>

        <h2 className="mt-16 text-center text-2xl font-semibold text-[#6e6e73] md:text-3xl">
          Check out with your Sfane Account
        </h2>

        <div className="mx-auto mt-8 w-full max-w-2xl">
          <div className="overflow-hidden rounded-2xl border border-[#d2d2d7] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email address"
                className="w-full px-5 py-4 text-base placeholder:text-[#86868b] outline-none"
              />
            </div>

            <div className="h-px bg-[#d2d2d7]" />

            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                className="w-full px-5 py-4 pr-16 text-base placeholder:text-[#86868b] outline-none disabled:bg-[#fafafa] disabled:text-[#86868b]"
              />

              <button
                type="button"
                aria-label="Sign in"
                onClick={onLogin}
                disabled={loading || !email.trim() || !password.trim()}
                className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-[#bdbdc2] bg-white text-[#1d1d1f] shadow-[0_6px_16px_rgba(0,0,0,0.08)] transition hover:bg-[#f5f5f7] disabled:opacity-50"
              >
                <span className="text-xl leading-none">→</span>
              </button>
            </div>
          </div>

          <label className="mt-10 flex items-center justify-center gap-3 text-base text-[#6e6e73]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-5 w-5 rounded border-[#bdbdc2]"
            />
            Remember me
          </label>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={helpAction}
              disabled={loading || !email.trim()}
              className="text-base font-medium text-[#0066cc] hover:underline disabled:opacity-50"
            >
              Forgotten your password?
            </button>
          </div>

          <div className="mt-10 text-center text-sm text-[#6e6e73]">
            <Link href={`/signup?redirect=${encodeURIComponent(redirectTo)}`} className="text-[#0066cc] hover:underline">
              Create account
            </Link>

            <span className="mx-3">·</span>

            <Link href="/cart" className="text-[#0066cc] hover:underline">
              Back to cart
            </Link>
          </div>

          {message ? <p className="mt-6 text-center text-sm text-[#6e6e73]">{message}</p> : null}

          <p className="mt-10 text-center text-xs text-[#86868b]">
            We don&apos;t support guest checkout.
          </p>
        </div>
      </div>
    </main>
  );
}
