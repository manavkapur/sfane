"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";
import { cormorantGaramond } from "@/lib/fonts";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

import { cn } from "@/lib/utils";

const navItems = [
  { label: "Offers", href: "/products?filter=offers" },
  { label: "Duffle Bags", href: "/products?category=duffle" },
  { label: "Toiletry Kit", href: "/products?category=toiletry-kit" },
  { label: "Tiffin Bag", href: "/products?category=tiffin" },
];

const navFont = cormorantGaramond;

export function SiteHeader() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const pathname = usePathname();

  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  const authHref = session ? "/account" : "/login?redirect=/account";
  const authLabel = session ? "Account" : "Login";
  const isFrontPage = pathname === "/";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/70 bg-white/35 backdrop-blur-2xl backdrop-saturate-150">
      <div className="mx-auto flex h-12 w-full max-w-6xl items-center justify-between gap-4 px-5">
        <div className="flex flex-1 items-center">
          <Link href="/" className="text-lg font-semibold italic tracking-tight text-[#e57e2c]">
            Sfane
          </Link>
        </div>

        <nav
          className={cn(
            "hidden flex-1 items-center justify-center gap-7 md:flex",
            navFont.className
          )}
        >
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="whitespace-nowrap text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5d4b3c] transition-colors duration-200 hover:text-[#1f140d]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-3">
          {!isFrontPage ? (
            <Link href={authHref} className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-700">
              {authLabel}
            </Link>
          ) : null}
          <Link
            href="/products"
            className="inline-flex items-center rounded-full bg-[#14110d] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#2a1e15]"
          >
            Buy
          </Link>
        </div>
      </div>
    </header>
  );
}
