"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

async function hasAdminAccess() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, message: "Missing Supabase env vars." };

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return { ok: false, message: "Not signed in." };

  const { data: fnData, error } = await supabase.functions.invoke("admin-products", { method: "GET" });
  if (error) return { ok: false, message: error.message };

  return { ok: true, message: `Loaded ${fnData?.products?.length ?? 0} products` };
}

export default function AdminLoginPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();
  const adminBypass = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ADMIN_BYPASS === "true";

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (adminBypass) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold text-[#1f140d]">Admin Login</h1>
        <p className="mt-3 text-sm text-[#5b4739]">Bypass mode enabled for local development.</p>
        <div className="mt-6 rounded-2xl border border-[#e8d9cf] bg-white p-6">
          <button
            onClick={() => router.push("/admin/cms")}
            className="rounded-full bg-[#1f140d] px-4 py-2 text-sm font-semibold text-white"
          >
            Continue to Admin CMS
          </button>
        </div>
      </main>
    );
  }

  const sendLink = async () => {
    if (!supabase || !email) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/admin/login` },
    });
    setMessage(error ? error.message : "Check your email for admin sign-in link.");
    setLoading(false);
  };

  const verifyAdmin = async () => {
    setLoading(true);
    const result = await hasAdminAccess();
    if (result.ok) {
      router.replace("/admin/cms");
      return;
    }
    setMessage(result.message);
    setLoading(false);
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold text-[#1f140d]">Admin Login</h1>
      <p className="mt-3 text-sm text-[#5b4739]">Sign in and validate admin role.</p>

      <div className="mt-6 rounded-2xl border border-[#e8d9cf] bg-white p-6">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@example.com"
          className="w-full rounded-full border border-[#d8c2b1] px-4 py-2 text-sm"
        />

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={sendLink}
            disabled={loading}
            className="rounded-full bg-[#1f140d] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Send magic link
          </button>
          <button
            onClick={verifyAdmin}
            disabled={loading}
            className="rounded-full border border-[#d8c2b1] px-4 py-2 text-sm font-semibold text-[#6a4b36] disabled:opacity-60"
          >
            Verify admin access
          </button>
        </div>

        {message ? <p className="mt-3 text-sm text-[#6a4b36]">{message}</p> : null}
      </div>
    </main>
  );
}
