"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

function getRecoveryUrlData() {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const searchParams = new URLSearchParams(window.location.search);

  return {
    accessToken: hashParams.get("access_token"),
    refreshToken: hashParams.get("refresh_token"),
    tokenHash: hashParams.get("token_hash") ?? searchParams.get("token_hash"),
    recoveryType: (searchParams.get("type") ?? hashParams.get("type") ?? "").toLowerCase(),
    code: searchParams.get("code"),
    hashError: hashParams.get("error_description") || hashParams.get("error"),
  };
}

export default function ResetPasswordPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onResetPassword = async () => {
    if (!supabase) return;

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

    try {
      let hasSession = false;
      const invalidMessage = "Recovery link is invalid or expired. Request a new password reset email.";

      const { data: existingSession } = await supabase.auth.getSession();
      hasSession = Boolean(existingSession.session);

      if (!hasSession) {
        const { accessToken, refreshToken, code, tokenHash, recoveryType, hashError } = getRecoveryUrlData();

        if (hashError) {
          setMessage(invalidMessage);
          setLoading(false);
          return;
        }

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          hasSession = !error;
        }

        if (!hasSession && code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          hasSession = !error;
        }

        if (!hasSession && tokenHash && recoveryType === "recovery") {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          });
          hasSession = !error;
        }

        if (!hasSession) {
          const { data: retrySession } = await supabase.auth.getSession();
          hasSession = Boolean(retrySession.session);
        }

        if (!hasSession) {
          setMessage(invalidMessage);
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }
    } catch (error) {
      const text = error instanceof Error ? error.message : String(error);
      setMessage(
        text.toLowerCase().includes("aborted")
          ? "Reset link validation timed out. Open a fresh reset link and try again."
          : `Failed to reset password: ${text}`
      );
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
                className="w-full px-5 py-4 pr-16 text-base placeholder:text-[#86868b] outline-none disabled:bg-[#fafafa] disabled:text-[#86868b]"
              />

              <button
                type="button"
                aria-label="Reset password"
                onClick={onResetPassword}
                disabled={loading || !password.trim() || !confirmPassword.trim()}
                className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-[#bdbdc2] bg-white text-[#1d1d1f] shadow-[0_6px_16px_rgba(0,0,0,0.08)] transition hover:bg-[#f5f5f7] disabled:opacity-50"
              >
                <span className="text-xl leading-none">→</span>
              </button>
            </div>
          </div>

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
