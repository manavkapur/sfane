"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type OrderRecord = {
  id: number;
  status: string | null;
  payment_status: string | null;
  grand_total: number | string | null;
  created_at: string;
  order_items:
    | Array<{
        id: number;
        product_name: string | null;
        qty: number | null;
        final_price: number | string | null;
      }>
    | null;
};

function amount(value: number | string | null | undefined) {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function OrdersPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [session, setSession] = useState<Session | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(Boolean(supabase));
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoadingAuth(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    const loadOrders = async () => {
      if (!supabase || !session) {
        setOrders([]);
        return;
      }

      setLoadingOrders(true);
      const { data, error } = await supabase
        .from("orders")
        .select("id,status,payment_status,grand_total,created_at,order_items(id,product_name,qty,final_price)")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setMessage(error.message);
        setOrders([]);
        setLoadingOrders(false);
        return;
      }

      setOrders((data as OrderRecord[]) ?? []);
      setLoadingOrders(false);
    };

    void loadOrders();
  }, [supabase, session]);

  if (!supabase) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <p className="rounded-2xl border border-dashed border-[#d8c2b1] bg-white p-6 text-sm text-[#5b4739]">
          Missing Supabase env vars. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-semibold text-[#1f140d]">Orders</h1>

      {loadingAuth ? <p className="mt-4 text-sm text-[#5b4739]">Checking session...</p> : null}

      {!session && !loadingAuth ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[#d8c2b1] bg-white p-6 text-sm text-[#5b4739]">
          Sign in from the cart page to view your orders. <Link href="/cart" className="underline">Go to cart</Link>
        </div>
      ) : null}

      {session ? (
        <section className="mt-6 space-y-3">
          {loadingOrders ? <p className="text-sm text-[#5b4739]">Loading orders...</p> : null}

          {!loadingOrders && orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d8c2b1] bg-white p-6 text-sm text-[#5b4739]">
              No orders yet.
            </div>
          ) : null}

          {orders.map((order) => (
            <article key={order.id} className="rounded-2xl border border-[#e8d9cf] bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-[#1f140d]">Order #{order.id}</p>
                <p className="text-sm text-[#5b4739]">{new Date(order.created_at).toLocaleString()}</p>
              </div>
              <p className="mt-2 text-sm text-[#5b4739]">
                Status: {order.status ?? "N/A"} | Payment: {order.payment_status ?? "N/A"}
              </p>
              <p className="mt-1 text-sm text-[#5b4739]">Total: ₹{amount(order.grand_total).toFixed(2)}</p>

              <div className="mt-3 space-y-1 text-sm text-[#5b4739]">
                {(order.order_items ?? []).map((item) => (
                  <p key={item.id}>
                    {item.product_name ?? "Product"} x {item.qty ?? 0}
                  </p>
                ))}
              </div>
            </article>
          ))}

          {message ? <p className="text-sm text-[#6a4b36]">{message}</p> : null}
        </section>
      ) : null}
    </main>
  );
}
