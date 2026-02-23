"use client";

import { useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { CART_ENABLED } from "@/lib/commerce-flags";

type AddToCartButtonProps = {
  productId: number;
  compact?: boolean;
};

export function AddToCartButton({ productId, compact = false }: AddToCartButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!CART_ENABLED) {
    return null;
  }

  const onAddToCart = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setMessage("Missing Supabase env vars.");
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setIsLoading(false);
      setMessage("Please sign in to add items.");
      return;
    }

    const { error } = await supabase.functions.invoke("merge-cart", {
      body: {
        items: [
          {
            product_id: productId,
            quantity: 1,
          },
        ],
      },
    });

    if (error) {
      setMessage(error.message);
      setIsLoading(false);
      return;
    }

    setMessage("Added to cart.");
    setIsLoading(false);
  };

  if (compact) {
    return (
      <div className="w-full">
        <button
          onClick={onAddToCart}
          disabled={isLoading}
          className="w-full rounded-full bg-[#1f140d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2b1b12] disabled:opacity-60"
        >
          {isLoading ? "Adding..." : "Add to cart"}
        </button>
        {message ? <p className="mt-2 text-xs text-[#6a4b36]">{message}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={onAddToCart}
        disabled={isLoading}
        className="rounded-full bg-[#1f140d] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isLoading ? "Adding..." : "Add to cart"}
      </button>
      <Link
        href="/cart"
        className="rounded-full border border-[#e7d7cc] px-6 py-3 text-sm font-semibold text-[#6a4b36]"
      >
        Go to cart
      </Link>
      {message ? <p className="w-full text-sm text-[#6a4b36]">{message}</p> : null}
    </div>
  );
}
