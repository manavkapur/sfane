"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { calculateOfferPricing } from "@/lib/offer-pricing";

type CartProductRow = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number | string;
  original_price: number | string | null;
  offer_type: string | null;
  discount_percent: number | null;
  buy_qty: number | null;
  get_qty: number | null;
  discount_start: string | null;
  discount_end: string | null;
  product_images: Array<{ image_url: string }> | null;
};

type CartItemRow = {
  id: number;
  product_id: number;
  quantity: number;
  products: CartProductRow | CartProductRow[] | null;
};

type CartItem = {
  id: number;
  productId: number;
  qty: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  imageUrl: string | null;
  offerType: string | null;
  discountValue: number | null;
  buyQty: number | null;
  getQty: number | null;
  discountStart: string | null;
  discountEnd: string | null;
};

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeProduct(value: CartProductRow | CartProductRow[] | null) {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function QuantitySelect({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (nextQty: number) => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      disabled={disabled}
      className="h-9 rounded-full border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0a67ff]/30 disabled:opacity-50"
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
  pricing,
  disabled,
  onQty,
  onRemove,
  onSaveForLater,
}: {
  item: CartItem;
  pricing: ReturnType<typeof calculateOfferPricing>;
  disabled?: boolean;
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
          {item.description ||
            "Crafted for daily carry with premium materials and a clean, durable finish."}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Quantity</span>
            <QuantitySelect value={item.qty} onChange={onQty} disabled={disabled} />
          </div>

          <button
            onClick={onRemove}
            disabled={disabled}
            className="text-sm font-medium text-[#0a67ff] hover:underline disabled:opacity-50"
          >
            Remove
          </button>
          <button
            onClick={onSaveForLater}
            disabled={disabled}
            className="text-sm font-medium text-[#0a67ff] hover:underline disabled:opacity-50"
          >
            Save for later
          </button>
        </div>
      </div>

      <div className="text-right">
        <p className="text-lg font-semibold text-slate-900">{formatINR(pricing.finalTotal)}</p>
        {pricing.offerApplied ? (
          <p className="mt-1 text-xs text-slate-500 line-through">{formatINR(pricing.baseTotal)}</p>
        ) : null}
        <p className="mt-2 text-xs text-slate-500">{formatINR(item.price)} each</p>
        {pricing.offerApplied ? (
          <p className="mt-1 text-xs font-medium text-emerald-700">
            Saved {formatINR(pricing.discountTotal)}
            {pricing.offerLabel ? ` · ${pricing.offerLabel}` : ""}
          </p>
        ) : null}
        {pricing.freeQty > 0 ? <p className="mt-1 text-xs text-emerald-700">Free qty: {pricing.freeQty}</p> : null}
      </div>
    </div>
  );
}

export default function CartPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();
  const loginRedirectUrl = "/login?redirect=%2Fcart";

  const [session, setSession] = useState<Session | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [saved, setSaved] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [busyItemId, setBusyItemId] = useState<number | null>(null);

  const loadCart = useCallback(async (userId: string) => {
    if (!supabase) return;

    setMessage(null);

    try {
      const { data: activeCart, error: cartError } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "ACTIVE")
        .maybeSingle();

      if (cartError) {
        setItems([]);
        setMessage(cartError.message);
        return;
      }

      if (!activeCart) {
        setItems([]);
        return;
      }

      const { data: rows, error: itemsError } = await supabase
        .from("cart_items")
        .select(
          "id,product_id,quantity,products(id,name,slug,description,price,original_price,offer_type,discount_percent,buy_qty,get_qty,discount_start,discount_end,product_images(image_url))"
        )
        .eq("cart_id", activeCart.id)
        .order("created_at", { ascending: true });

      if (itemsError) {
        setItems([]);
        setMessage(itemsError.message);
        return;
      }

      const mapped = ((rows as CartItemRow[] | null) ?? [])
        .map((row): CartItem | null => {
          const product = normalizeProduct(row.products);
          if (!product) return null;

          return {
            id: row.id,
            productId: row.product_id,
            qty: row.quantity,
            name: product.name,
            slug: product.slug,
            description: product.description ?? "",
            price: toNumber(product.price),
            imageUrl: product.product_images?.[0]?.image_url || null,
            offerType: product.offer_type,
            discountValue: product.discount_percent,
            buyQty: product.buy_qty,
            getQty: product.get_qty,
            discountStart: product.discount_start,
            discountEnd: product.discount_end,
          };
        })
        .filter((item): item is CartItem => Boolean(item));

      setItems(mapped);
    } catch (error) {
      const text = error instanceof Error ? error.message : String(error);
      setItems([]);
      setMessage(`Failed to load cart: ${text}`);
    }
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    const loadingFallback = setTimeout(() => {
      if (!active) return;
      setLoading(false);
      setMessage("Bag is taking longer than expected to load. Please refresh.");
    }, 8000);

    const bootstrap = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!active) return;

        if (error) {
          throw error;
        }

        if (!data.session) {
          setLoading(false);
          router.replace(loginRedirectUrl);
          return;
        }

        setSession(data.session);
        await loadCart(data.session.user.id);
      } catch (error) {
        if (!active) return;
        const text = error instanceof Error ? error.message : String(error);
        setMessage(`Failed to check session: ${text}`);
      } finally {
        if (!active) return;
        setLoading(false);
        clearTimeout(loadingFallback);
      }
    };

    bootstrap();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!active) return;

      if (!nextSession) {
        setSession(null);
        setItems([]);
        setLoading(false);
        router.replace(loginRedirectUrl);
        return;
      }

      setSession(nextSession);
      try {
        await loadCart(nextSession.user.id);
      } catch {
        setLoading(false);
      }
    });

    return () => {
      active = false;
      clearTimeout(loadingFallback);
      listener.subscription.unsubscribe();
    };
  }, [supabase, router, loadCart, loginRedirectUrl]);

  useEffect(() => {
    if (!supabase || loading || session) return;

    router.replace(loginRedirectUrl);

    const fallback = window.setTimeout(() => {
      if (window.location.pathname !== "/login") {
        window.location.assign(loginRedirectUrl);
      }
    }, 700);

    return () => window.clearTimeout(fallback);
  }, [supabase, loading, session, router, loginRedirectUrl]);

  const onQtyChange = async (itemId: number, nextQty: number) => {
    if (!supabase) return;

    setBusyItemId(itemId);
    setMessage(null);

    if (nextQty <= 0) {
      const { error } = await supabase.from("cart_items").delete().eq("id", itemId);
      if (error) {
        setMessage(error.message);
        setBusyItemId(null);
        return;
      }

      setItems((prev) => prev.filter((item) => item.id !== itemId));
      setBusyItemId(null);
      return;
    }

    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: nextQty })
      .eq("id", itemId);

    if (error) {
      setMessage(error.message);
      setBusyItemId(null);
      return;
    }

    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, qty: nextQty } : item))
    );
    setBusyItemId(null);
  };

  const onMoveToBag = async (item: CartItem) => {
    if (!supabase || !session) return;

    setMessage(null);

    const { error } = await supabase.functions.invoke("merge-cart", {
      body: {
        items: [
          {
            product_id: item.productId,
            quantity: 1,
          },
        ],
      },
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setSaved((prev) => prev.filter((savedItem) => savedItem.id !== item.id));
    await loadCart(session.user.id);
  };

  const pricedItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        pricing: calculateOfferPricing({
          unitPrice: item.price,
          quantity: item.qty,
          offerType: item.offerType,
          discountValue: item.discountValue,
          buyQty: item.buyQty,
          getQty: item.getQty,
          discountStart: item.discountStart,
          discountEnd: item.discountEnd,
        }),
      })),
    [items]
  );

  const totals = useMemo(() => {
    const subtotal = pricedItems.reduce((sum, item) => sum + item.pricing.baseTotal, 0);
    const discount = pricedItems.reduce((sum, item) => sum + item.pricing.discountTotal, 0);
    const shipping = 0;
    const total = subtotal - discount + shipping;

    return {
      subtotal,
      discount,
      shipping,
      total,
      subtotalLabel: formatINR(subtotal),
      discountLabel: formatINR(discount),
      shippingLabel: shipping === 0 ? "Free" : formatINR(shipping),
      totalLabel: formatINR(total),
    };
  }, [pricedItems]);

  if (!supabase) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <h1 className="text-3xl font-semibold text-slate-900">Cart</h1>
          <p className="mt-4 text-sm text-slate-600">
            Missing Supabase env vars. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
          </p>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f5f7]">
        <section className="mx-auto w-full max-w-5xl px-6 py-16 md:py-20">
          <div className="max-w-3xl">
            <Image
              src="/logo.jpeg"
              alt="Sfane"
              width={72}
              height={72}
              className="mb-6 rounded-2xl border border-[#d2d2d7] bg-white object-cover p-1"
            />
            <h1 className="text-5xl font-semibold tracking-tight text-[#1d1d1f] md:text-6xl">
              Loading your bag...
            </h1>
            <div className="mt-6 h-6 w-full max-w-2xl animate-pulse rounded bg-[#e4e4e9]" />
            <div className="mt-3 h-6 w-[70%] animate-pulse rounded bg-[#e4e4e9]" />
            <div className="mt-10 h-16 w-full max-w-[420px] animate-pulse rounded-2xl bg-[#e4e4e9]" />
          </div>
        </section>

        <section className="border-y border-[#d2d2d7] bg-[#f5f5f7]">
          <div className="mx-auto max-w-5xl px-6 py-6">
            <div className="h-8 w-full max-w-xl animate-pulse rounded bg-[#e4e4e9]" />
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-6 py-12">
          <div className="h-[320px] w-full animate-pulse rounded bg-[#e4e4e9]" />
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <p className="text-sm text-slate-600">Redirecting to login...</p>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[#f5f5f7]">
        <section className="mx-auto w-full max-w-5xl px-6 py-16 md:py-20">
          <div className="max-w-3xl">
            <Image
              src="/logo.jpeg"
              alt="Sfane"
              width={88}
              height={88}
              className="mb-6 rounded-2xl border border-[#d2d2d7] bg-white object-cover p-1"
            />
            <h1 className="text-5xl font-semibold tracking-tight text-[#1d1d1f] md:text-6xl">
              Your bag is empty.
            </h1>
            <p className="mt-5 max-w-2xl text-xl leading-8 text-[#515154]">
              Buy online and get free two-day delivery on all in-stock items.
            </p>

            <Link
              href="/products"
              className="mt-10 inline-flex min-w-[320px] items-center justify-center rounded-2xl border border-[#0071e3] px-8 py-4 text-2xl font-medium text-[#0071e3] transition hover:bg-[#0071e3]/5 md:min-w-[420px]"
            >
              Continue Shopping
            </Link>
          </div>
        </section>

        <section className="border-y border-[#d2d2d7] bg-[#f5f5f7]">
          <div className="mx-auto max-w-5xl px-6 py-6 text-[28px] leading-9 text-[#1d1d1f]">
            Need some help?{" "}
            <a href="#" className="text-[#0066cc] underline">
              Chat now
            </a>{" "}
            or call 000800 040 1966.
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-6 py-12">
          <div className="grid overflow-hidden rounded-none bg-[#e8e8ed] md:grid-cols-[1fr_1fr]">
            <div className="flex items-center justify-center px-8 py-16 text-center">
              <div>
                <p className="text-6xl font-semibold tracking-tight text-[#1d1d1f] md:text-7xl">
                  New Arrivals
                </p>
                <p className="mt-4 text-2xl text-[#515154]">
                  Check out the latest accessories.
                </p>
                <Link href="/products" className="mt-6 inline-block text-2xl font-medium text-[#0066cc]">
                  Shop &rsaquo;
                </Link>
              </div>
            </div>
            <div className="relative min-h-[320px] md:min-h-[420px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Allbags.png"
                alt="New arrivals"
                className="h-full w-full object-cover object-center"
              />
            </div>
          </div>
        </section>

        {message ? (
          <div className="mx-auto mb-10 max-w-5xl px-6">
            <p className="text-sm text-slate-600">{message}</p>
          </div>
        ) : null}
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
            Your bag is now connected to live product and cart data from Supabase.
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
          {items.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-600">
              <Image
                src="/logo.jpeg"
                alt="Sfane"
                width={64}
                height={64}
                className="mx-auto mb-3 rounded-2xl border border-slate-200 object-cover p-1"
              />
              Your bag is empty.
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-100 bg-white px-6 shadow-[0_22px_60px_rgba(15,23,42,0.06)]">
              {pricedItems.map((item) => (
                <LineItem
                  key={item.id}
                  item={item}
                  pricing={item.pricing}
                  disabled={busyItemId === item.id}
                  onQty={(qty) => onQtyChange(item.id, qty)}
                  onRemove={() => onQtyChange(item.id, 0)}
                  onSaveForLater={() => {
                    setSaved((prev) => [...prev, item]);
                    onQtyChange(item.id, 0);
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
                        onClick={() => onMoveToBag(item)}
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
                      <div className="flex items-center justify-between">
                        <span>Offer savings</span>
                        <span className="font-semibold text-emerald-700">-{totals.discountLabel}</span>
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

                      <p className="mt-1 text-xs text-emerald-700">You saved {totals.discountLabel} with current offers.</p>
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

          {message ? <p className="mt-8 text-sm text-slate-600">{message}</p> : null}

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
