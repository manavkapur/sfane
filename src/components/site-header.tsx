"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { cormorantGaramond } from "@/lib/fonts";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Offers", href: "/products?filter=offers" },
  { label: "Duffle Bags", href: "/products?category=duffle" },
  { label: "Toiletry Kit", href: "/products?category=toiletry-kit" },
  { label: "Tiffin Bag", href: "/products?category=tiffin" },
];

const navFont = cormorantGaramond;

export function SiteHeader() {
  const { scrollY } = useScroll();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [isCompact, setIsCompact] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.scrollY > 80;
  });
  const [session, setSession] = useState<Session | null>(null);
  const [cartCount, setCartCount] = useState(0);

  const loadCartCount = useCallback(
    async (userId: string | null) => {
      if (!supabase || !userId) {
        setCartCount(0);
        return;
      }

      const { data: activeCart, error: cartError } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "ACTIVE")
        .maybeSingle();

      if (cartError || !activeCart) {
        setCartCount(0);
        return;
      }

      const { data: rows, error: itemsError } = await supabase
        .from("cart_items")
        .select("quantity")
        .eq("cart_id", activeCart.id);

      if (itemsError) {
        setCartCount(0);
        return;
      }

      const qty = (rows || []).reduce((sum, row) => sum + (row.quantity || 0), 0);
      setCartCount(qty);
    },
    [supabase]
  );

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadCartCount(data.session?.user?.id ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      await loadCartCount(nextSession?.user?.id ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase, loadCartCount]);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsCompact(latest > 80);
  });

  const authHref = session ? "/account" : "/login?redirect=/account";
  const authLabel = session ? "Account" : "Login";

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
          <Link href={authHref} className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-700">
            {authLabel}
          </Link>
          {!isCompact ? (
            <Link href="/cart" className="relative text-slate-700 transition-colors hover:text-slate-900">
              <BagIcon className="h-4 w-4" />
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[10px] text-white">
                {cartCount}
              </span>
            </Link>
          ) : (
            <Button size="sm" asChild>
              <Link href="/products">Buy</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function BagIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6.5 8.5h11l-.8 11.2a2 2 0 0 1-2 1.8H9.3a2 2 0 0 1-2-1.8L6.5 8.5Z" />
      <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
    </svg>
  );
}
