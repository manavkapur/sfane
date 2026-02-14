"use client";

import { useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type AddToCartButtonProps = {
  productId: number;
};

export function AddToCartButton({ productId }: AddToCartButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
      setMessage("Sign in from Cart page first.");
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
