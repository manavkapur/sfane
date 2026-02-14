"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

async function verifyAdminAccess(accessToken?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return { ok: false, message: "Missing Supabase env vars." };
  if (!accessToken) return { ok: false, message: "Missing session access token." };

  try {
    const response = await fetch(`${url}/functions/v1/admin-products`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: anonKey,
      },
    });

    if (!response.ok) {
      let details = "Unknown server error";
      try {
        const body = await response.clone().json();
        details = typeof body?.error === "string" ? body.error : JSON.stringify(body);
      } catch {
        details = await response.clone().text();
      }

      return {
        ok: false,
        message: `Admin check failed (${response.status}): ${details}`,
      };
    }

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, message: `Admin check request failed: ${message}` };
  }
}

export default function AdminLoginPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;

      const access = await verifyAdminAccess(data.session.access_token);
      if (access.ok) {
        router.replace("/admin/cms");
      }
    });
  }, [supabase, router]);

  const signInAdmin = async () => {
    if (!supabase || !email.trim() || !password.trim()) return;

    setLoading(true);
    setMessage(null);

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (signInError) {
      setMessage(signInError.message);
      setLoading(false);
      return;
    }

    const freshToken =
      signInData.session?.access_token ||
      (await supabase.auth.getSession()).data.session?.access_token;

    const access = await verifyAdminAccess(freshToken);

    if (!access.ok) {
      await supabase.auth.signOut();
      setMessage(access.message);
      setLoading(false);
      return;
    }

    router.replace("/admin/cms");
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
        <h1 className="text-center text-5xl font-semibold tracking-tight md:text-6xl">Admin sign in.</h1>

        <h2 className="mt-16 text-center text-2xl font-semibold text-[#6e6e73] md:text-3xl">
          Access the Sfane Admin Dashboard
        </h2>

        <div className="mx-auto mt-8 w-full max-w-2xl">
          <div className="overflow-hidden rounded-2xl border border-[#d2d2d7] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Admin email"
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
                aria-label="Sign in as admin"
                onClick={signInAdmin}
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
            <Link href="/login?redirect=/admin/login" className="text-[#0066cc] hover:underline">
              Go to customer login
            </Link>
          </div>

          {message ? <p className="mt-6 text-center text-sm text-[#6e6e73]">{message}</p> : null}

          <p className="mt-10 text-center text-xs text-[#86868b]">
            Admin access is granted only to accounts mapped in `admin_profiles`.
          </p>
        </div>
      </div>
    </main>
  );
}
