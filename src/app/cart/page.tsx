"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createInitialMockCart, cartTotals, updateQty } from "@/lib/cart-mock";
import { formatINR, type MockCartItem } from "@/lib/checkout-mock";

function QuantitySelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (nextQty: number) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-9 rounded-full border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0a67ff]/30"
    >
      {[1, 2, 3, 4, 5].map((qty) => (
        <option key={qty} value={qty}>
          {qty}
        </option>
      ))}
    </select>
  );
}

function LineItem({
  item,
  onQty,
  onRemove,
  onSaveForLater,
}: {
  item: MockCartItem;
  onQty: (qty: number) => void;
  onRemove: () => void;
  onSaveForLater: () => void;
}) {
  return (
    <div className="grid gap-6 border-b border-slate-100 py-10 md:grid-cols-[160px_1fr_160px] md:items-start">
      <div className="flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageUrl || "/Allbags.png"}
          alt={item.name}
          className="h-32 w-32 rounded-3xl border border-slate-100 object-cover shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
        />
      </div>

      <div>
        <p className="text-lg font-semibold text-slate-900">{item.name}</p>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
          Crafted for daily carry with premium materials and a clean, durable finish.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Quantity</span>
            <QuantitySelect value={item.qty} onChange={onQty} />
          </div>

          <button
            onClick={onRemove}
            className="text-sm font-medium text-[#0a67ff] hover:underline"
          >
            Remove
          </button>
          <button
            onClick={onSaveForLater}
            className="text-sm font-medium text-[#0a67ff] hover:underline"
          >
            Save for later
          </button>
        </div>
      </div>

      <div className="text-right">
        <p className="text-lg font-semibold text-slate-900">
          {formatINR(item.price * item.qty)}
        </p>
        <p className="mt-2 text-xs text-slate-500">{formatINR(item.price)} each</p>
      </div>
    </div>
  );
}

export default function CartPage() {
  const mode = process.env.NEXT_PUBLIC_CART_MODE || "mock";
  const isMock = mode === "mock";

  const [cart, setCart] = useState(() => createInitialMockCart());
  const [saved, setSaved] = useState<MockCartItem[]>([]);

  const totals = useMemo(() => cartTotals(cart.items), [cart.items]);

  if (!isMock) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <h1 className="text-3xl font-semibold text-slate-900">Cart</h1>
          <p className="mt-4 text-sm text-slate-600">
            Cart is in REAL mode, but backend wiring is paused. Set `NEXT_PUBLIC_CART_MODE=mock` to view the sample cart.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Bag
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
            Your bag total is {totals.totalLabel}.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600">
            A clean, high-trust checkout experience. This page is currently powered by sample data while we finalize UX.
          </p>

          <Link
            href="/checkout"
            className="mt-10 inline-flex items-center justify-center rounded-full bg-[#0a67ff] px-12 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(10,103,255,0.25)] transition hover:bg-[#0a5ae0]"
          >
            Check Out
          </Link>

          <div className="mx-auto mt-12 h-px w-full max-w-3xl bg-slate-100" />
        </header>

        <section className="mx-auto mt-12 max-w-3xl">
          {cart.items.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-600">
              Your bag is empty.
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-100 bg-white px-6 shadow-[0_22px_60px_rgba(15,23,42,0.06)]">
              {cart.items.map((item) => (
                <LineItem
                  key={item.id}
                  item={item}
                  onQty={(qty) =>
                    setCart((prev) => ({
                      ...prev,
                      items: updateQty(prev.items, item.id, qty),
                    }))
                  }
                  onRemove={() =>
                    setCart((prev) => ({
                      ...prev,
                      items: updateQty(prev.items, item.id, 0),
                    }))
                  }
                  onSaveForLater={() => {
                    setSaved((prev) => [...prev, item]);
                    setCart((prev) => ({
                      ...prev,
                      items: updateQty(prev.items, item.id, 0),
                    }));
                  }}
                />
              ))}
            </div>
          )}

          {saved.length ? (
            <div className="mt-12">
              <h2 className="text-xl font-semibold text-slate-900">Saved for later</h2>
              <div className="mt-4 space-y-3">
                {saved.map((item) => (
                  <div
                    key={`saved-${item.id}`}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]"
                  >
                    <div className="flex items-center gap-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imageUrl || "/Allbags.png"}
                        alt={item.name}
                        className="h-14 w-14 rounded-2xl border border-slate-100 object-cover"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                        <p className="text-sm text-slate-600">{formatINR(item.price)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => {
                          setCart((prev) => ({
                            ...prev,
                            items: [...prev.items, { ...item, qty: 1 }],
                          }));
                          setSaved((prev) => prev.filter((x) => x.id !== item.id));
                        }}
                        className="text-sm font-medium text-[#0a67ff] hover:underline"
                      >
                        Move to bag
                      </button>
                      <button
                        onClick={() => setSaved((prev) => prev.filter((x) => x.id !== item.id))}
                        className="text-sm font-medium text-[#0a67ff] hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-14 border-t border-slate-100 pt-12">
          <div className="mx-auto max-w-3xl">
            <div className="grid gap-6 md:grid-cols-2 md:items-start">
              <div className="text-sm text-slate-600">
                <p className="font-semibold text-slate-900">Delivery</p>
                <p className="mt-2">Order today. Free shipping on all orders.</p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Ships in 24-48 hrs
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
                    COD available
                  </span>
                </div>
              </div>

              <div className="justify-self-end md:w-full">
                <div className="w-full md:max-w-[420px]">
                  <div className="space-y-3 text-sm text-slate-700">
                    <div className="flex items-center justify-between">
                      <span>Bag subtotal</span>
                      <span className="font-semibold text-slate-900">{totals.subtotalLabel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Shipping</span>
                      <span className="font-semibold text-slate-900">{totals.shippingLabel}</span>
                    </div>
                  </div>

                  <div className="mt-5 h-px w-full bg-slate-100" />

                  <div className="mt-5 grid gap-2">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <p className="text-lg font-semibold text-slate-900">Total</p>
                                              </div>
                      <div className="text-right">
                        <p className="text-3xl font-semibold tracking-tight text-slate-900">{totals.totalLabel}</p>
                                              </div>
                    </div>

                    <p className="mt-1 text-xs text-amber-700">Total savings with eligible offers will appear here.</p>
                  </div>

                  <Link
                    href="/checkout"
                    className="mt-7 inline-flex w-full justify-center rounded-full bg-[#0a67ff] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(10,103,255,0.25)] transition hover:bg-[#0a5ae0]"
                  >
                    Check Out
                  </Link>

                  <p className="mt-3 text-xs text-slate-500">
                    Secure checkout. Delivery details collected next.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-sm text-slate-600">
            <Link href="/products" className="font-medium text-[#0a67ff] hover:underline">
              Continue shopping
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
