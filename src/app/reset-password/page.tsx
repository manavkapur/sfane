"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function ResetPasswordPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();

  const hasHashError = useMemo(() => {
    if (typeof window === "undefined") return false;
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    return Boolean(hashParams.get("error_description") || hashParams.get("error"));
  }, []);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(hasHashError);
  const [validRecovery, setValidRecovery] = useState(false);
  const [message, setMessage] = useState<string | null>(
    hasHashError ? "Recovery link is invalid or expired. Request a new password reset email." : null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabase || hasHashError) return;

    let active = true;

    const evaluateRecovery = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      if (data.session) {
        setValidRecovery(true);
        setReady(true);
        return;
      }

      // Give Supabase a short moment to process URL tokens on first load.
      setTimeout(async () => {
        const { data: retryData } = await supabase.auth.getSession();
        if (!active) return;

        if (retryData.session) {
          setValidRecovery(true);
        } else {
          setMessage("Recovery link is invalid or expired. Request a new password reset email.");
        }
        setReady(true);
      }, 800);
    };

    evaluateRecovery();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session) {
        setValidRecovery(true);
        setReady(true);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase, hasHashError]);

  const onResetPassword = async () => {
    if (!supabase || !validRecovery) return;

    if (!password.trim()) {
      setMessage("Please enter a new password.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    router.replace("/login?redirect=/account");
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
        <h1 className="text-center text-5xl font-semibold tracking-tight md:text-6xl">Reset your password.</h1>

        <h2 className="mt-16 text-center text-2xl font-semibold text-[#6e6e73] md:text-3xl">Create a new password</h2>

        <div className="mx-auto mt-8 w-full max-w-2xl">
          <div className="overflow-hidden rounded-2xl border border-[#d2d2d7] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="New password"
                disabled={!ready || !validRecovery}
                className="w-full px-5 py-4 text-base placeholder:text-[#86868b] outline-none disabled:bg-[#fafafa] disabled:text-[#86868b]"
              />
            </div>

            <div className="h-px bg-[#d2d2d7]" />

            <div className="relative">
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm new password"
                disabled={!ready || !validRecovery}
                className="w-full px-5 py-4 pr-16 text-base placeholder:text-[#86868b] outline-none disabled:bg-[#fafafa] disabled:text-[#86868b]"
              />

              <button
                type="button"
                aria-label="Reset password"
                onClick={onResetPassword}
                disabled={loading || !ready || !validRecovery || !password.trim() || !confirmPassword.trim()}
                className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-[#bdbdc2] bg-white text-[#1d1d1f] shadow-[0_6px_16px_rgba(0,0,0,0.08)] transition hover:bg-[#f5f5f7] disabled:opacity-50"
              >
                <span className="text-xl leading-none">→</span>
              </button>
            </div>
          </div>

          {!ready ? <p className="mt-6 text-center text-sm text-[#6e6e73]">Validating reset link...</p> : null}
          {message ? <p className="mt-6 text-center text-sm text-[#6e6e73]">{message}</p> : null}

          <div className="mt-10 text-center text-sm text-[#6e6e73]">
            <Link href="/login" className="text-[#0066cc] hover:underline">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
