"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { cormorantGaramond, manrope } from "@/lib/fonts";

function maskIdentity(value: string): string {
  if (!value.includes("@")) {
    if (value.length <= 4) return value;
    return `${value.slice(0, 2)}••••${value.slice(-2)}`;
  }

  const [local, domain] = value.split("@");
  if (!local || !domain) return value;

  if (local.length <= 2) return `${local[0] ?? ""}••@${domain}`;
  return `${local.slice(0, 2)}••••${local.slice(-1)}@${domain}`;
}

function getInitials(identity: string): string {
  if (identity.includes("@")) {
    const local = identity.split("@")[0] || "S";
    return local.slice(0, 2).toUpperCase();
  }
  const compact = identity.replace(/\s+/g, "");
  return compact.slice(0, 2).toUpperCase() || "SF";
}

function firstNonEmpty(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return "";
}

export default function AccountPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setCheckingSession(false);
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session);
      setCheckingSession(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession);
      setCheckingSession(false);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    if (!supabase) return;
    setSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/");
  };

  const identity = firstNonEmpty(
    session?.user.phone,
    session?.user.email,
    session?.user.id
  );
  const maskedIdentity = identity ? maskIdentity(identity) : "";
  const initials = identity ? getInitials(identity) : "SF";
  const joinedOn = session?.user.created_at
    ? new Date(session.user.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;
  const provider = (session?.user.app_metadata?.provider as string | undefined) ?? "email";
  const providerLabel = provider.charAt(0).toUpperCase() + provider.slice(1);

  if (!supabase) {
    return (
      <main className={`${manrope.className} min-h-[calc(100vh-48px)] bg-[#f6f3f1] px-6 py-16`}>
        <div className="mx-auto max-w-4xl rounded-[30px] border border-[#e6d8ce] bg-white p-8 shadow-[0_24px_80px_rgba(31,20,13,0.08)]">
          <p className="rounded-2xl border border-dashed border-[#d8c2b1] bg-white p-6 text-sm text-[#5b4739]">
            Missing Supabase env vars.
          </p>
        </div>
      </main>
    );
  }

  if (checkingSession) {
    return (
      <main className={`${manrope.className} min-h-[calc(100vh-48px)] bg-[#f6f3f1] px-6 py-16`}>
        <div className="mx-auto max-w-5xl">
          <div className="h-8 w-36 animate-pulse rounded-full bg-[#e9e0da]" />
          <div className="mt-8 grid gap-6 md:grid-cols-[1.3fr_1fr]">
            <div className="h-64 animate-pulse rounded-[28px] bg-[#ece4df]" />
            <div className="h-64 animate-pulse rounded-[28px] bg-[#ece4df]" />
          </div>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className={`${manrope.className} min-h-[calc(100vh-48px)] bg-[#f6f3f1] px-6 py-16`}>
        <div className="mx-auto max-w-4xl rounded-[30px] border border-[#e7d9ce] bg-[linear-gradient(135deg,#fff,#f8f2ec)] p-8 shadow-[0_24px_70px_rgba(31,20,13,0.08)] md:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a6a53]">
            Account Access
          </p>
          <h1 className={`${cormorantGaramond.className} mt-4 text-5xl font-medium leading-[0.95] text-[#1f140d] md:text-6xl`}>
            Sign in to continue.
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-[#6f5543] md:text-base">
            Track orders, manage your cart, and access your Sfane profile from one place.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/login?redirect=/account"
              className="rounded-full bg-[#1f140d] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(31,20,13,0.28)] transition hover:-translate-y-0.5"
            >
              Go to login
            </Link>
            <Link
              href="/signup?redirect=/account"
              className="rounded-full border border-[#d8c2b1] bg-white px-6 py-3 text-sm font-semibold text-[#1f140d] transition hover:border-[#c9ab95]"
            >
              Create account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`${manrope.className} relative min-h-[calc(100vh-48px)] overflow-hidden bg-[#f6f3f1]`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(183,147,120,0.18),transparent_35%),radial-gradient(circle_at_90%_80%,rgba(146,117,95,0.14),transparent_34%)]" />
      <div className="relative mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#8b6a54]">Sfane Profile</p>
            <h1 className={`${cormorantGaramond.className} mt-3 text-5xl font-medium leading-[0.95] text-[#1f140d] md:text-6xl`}>
              Account
            </h1>
          </div>
          <span className="hidden rounded-full border border-[#dfcdbf] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#6b4f3b] md:inline-flex">
            Signed In
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-[1.28fr_1fr]">
          <section className="rounded-[30px] border border-[#e8d9ce] bg-[linear-gradient(145deg,#fff,#f8f2ec)] p-6 shadow-[0_30px_90px_rgba(31,20,13,0.10)] md:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#1f140d] text-lg font-semibold text-white shadow-[0_16px_34px_rgba(31,20,13,0.34)]">
                  {initials}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8d6e57]">Signed in as</p>
                  <p className="mt-1 text-base font-semibold text-[#1f140d]">{maskedIdentity}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-[#eadacf] bg-white/80 px-4 py-3 text-sm text-[#6f5543]">
                <p className="text-xs uppercase tracking-[0.15em] text-[#8a6b55]">Auth Provider</p>
                <p className="mt-1 font-semibold text-[#1f140d]">{providerLabel}</p>
              </div>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#ead9ce] bg-white/85 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[#866751]">Identity</p>
                <p className="mt-2 break-all text-sm font-medium text-[#2b1d13]">{identity}</p>
              </div>
              <div className="rounded-2xl border border-[#ead9ce] bg-white/85 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[#866751]">Member Since</p>
                <p className="mt-2 text-sm font-medium text-[#2b1d13]">{joinedOn ?? "Recently joined"}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[30px] border border-[#e7d6cb] bg-[#1a120d] p-6 text-white shadow-[0_30px_90px_rgba(16,9,5,0.36)] md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d6bca8]">Quick Actions</p>
            <h2 className={`${cormorantGaramond.className} mt-3 text-4xl leading-[0.95] text-[#f8eee7]`}>
              Manage everything in one place.
            </h2>
            <div className="mt-7 grid gap-3">
              <Link
                href="/orders"
                className="group flex items-center justify-between rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Orders
                <span className="text-base transition group-hover:translate-x-0.5">→</span>
              </Link>
              <Link
                href="/cart"
                className="group flex items-center justify-between rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Cart
                <span className="text-base transition group-hover:translate-x-0.5">→</span>
              </Link>
              <Link
                href="/products"
                className="group flex items-center justify-between rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Continue shopping
                <span className="text-base transition group-hover:translate-x-0.5">→</span>
              </Link>
              <button
                onClick={signOut}
                disabled={signingOut}
                className="mt-1 rounded-2xl bg-[linear-gradient(135deg,#f4decf,#dcb79a)] px-4 py-3 text-sm font-semibold text-[#1f140d] shadow-[0_12px_30px_rgba(14,9,5,0.35)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-[28px] border border-[#e7d8cc] bg-white/75 p-5 text-sm text-[#664d3b] backdrop-blur md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b6a53]">Security note</p>
          <p className="mt-2 leading-7">
            If this isn&apos;t your device, sign out now and reset your password from login.
          </p>
        </section>
      </div>
    </main>
  );
}
