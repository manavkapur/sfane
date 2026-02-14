"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function AccountPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/");
  };

  if (!supabase) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="rounded-2xl border border-dashed border-[#d8c2b1] bg-white p-6 text-sm text-[#5b4739]">
          Missing Supabase env vars.
        </p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm text-[#5b4739]">Not signed in.</p>
        <Link href="/login?redirect=/account" className="mt-4 inline-block underline">
          Go to login
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold text-[#1f140d]">Account</h1>
      <p className="mt-3 text-sm text-[#5b4739]">Signed in as {session.user.phone ?? session.user.email ?? session.user.id}</p>
      <div className="mt-6 flex gap-3">
        <Link href="/orders" className="rounded-full border border-[#d8c2b1] px-4 py-2 text-sm">
          Orders
        </Link>
        <Link href="/cart" className="rounded-full border border-[#d8c2b1] px-4 py-2 text-sm">
          Cart
        </Link>
        <button onClick={signOut} className="rounded-full bg-[#1f140d] px-4 py-2 text-sm text-white">
          Sign out
        </button>
      </div>
    </main>
  );
}
