"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { calculateOfferPricing } from "@/lib/offer-pricing";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  landmark: string;
  pincode: string;
  city: string;
  state: string;
  country: string;
  isBusiness: boolean;
};

type SavedAddress = {
  id: string;
  label: string;
  isDefault?: boolean;
  firstName: string;
  lastName: string;
  line1: string;
  line2?: string;
  landmark?: string;
  pincode: string;
  city: string;
  state: string;
  country: string;
};

type CheckoutProductRow = {
  id: number;
  name: string;
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

type CheckoutItemRow = {
  id: number;
  quantity: number;
  product_id: number;
  products: CheckoutProductRow | CheckoutProductRow[] | null;
};

type CheckoutItem = {
  id: number;
  productId: number;
  name: string;
  qty: number;
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

function normalizeCheckoutProduct(value: CheckoutProductRow | CheckoutProductRow[] | null) {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

const MOCK_ADDRESSES: SavedAddress[] = [
  {
    id: "addr_default",
    label: "Home",
    isDefault: true,
    firstName: "Mohinder",
    lastName: "Krishan",
    line1: "221B, Example Street",
    line2: "Near Central Park",
    landmark: "Gate 2",
    pincode: "110017",
    city: "South Delhi",
    state: "Delhi",
    country: "India",
  },
];

function isLikelyE164(phone: string) {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}

function addressToForm(a: SavedAddress, existing: FormState): FormState {
  return {
    ...existing,
    firstName: a.firstName,
    lastName: a.lastName,
    line1: a.line1,
    line2: a.line2 ?? "",
    landmark: a.landmark ?? "",
    pincode: a.pincode,
    city: a.city,
    state: a.state,
    country: a.country,
  };
}

export default function CheckoutPage() {
  const mode = process.env.NEXT_PUBLIC_CHECKOUT_MODE || "mock";
  const isMock = mode === "mock";

  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(Boolean(supabase));

  const [selectedAddressId, setSelectedAddressId] = useState<string>(MOCK_ADDRESSES[0]?.id ?? "new");
  const [showSummary, setShowSummary] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CheckoutItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(Boolean(supabase));

  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    line1: "",
    line2: "",
    landmark: "",
    pincode: "",
    city: "",
    state: "",
    country: "India",
    isBusiness: false,
  });

  const loadCart = useCallback(
    async (userId: string) => {
      if (!supabase) return;

      const { data: activeCart, error: cartError } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "ACTIVE")
        .maybeSingle();

      if (cartError || !activeCart) {
        setCartItems([]);
        setLoadingCart(false);
        return;
      }

      const { data: rows, error: itemsError } = await supabase
        .from("cart_items")
        .select(
          "id,quantity,product_id,products(id,name,price,original_price,offer_type,discount_percent,buy_qty,get_qty,discount_start,discount_end,product_images(image_url))"
        )
        .eq("cart_id", activeCart.id)
        .order("created_at", { ascending: true });

      if (itemsError) {
        setCartItems([]);
        setLoadingCart(false);
        setMessage(itemsError.message);
        return;
      }

      const mapped = ((rows as CheckoutItemRow[] | null) ?? [])
        .map((row): CheckoutItem | null => {
          const product = normalizeCheckoutProduct(row.products);
          if (!product) return null;

          return {
            id: row.id,
            productId: row.product_id,
            name: product.name,
            qty: row.quantity,
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
        .filter((item): item is CheckoutItem => Boolean(item));

      setCartItems(mapped);
      setLoadingCart(false);
    },
    [supabase]
  );

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      setLoadingAuth(false);

      const phone = data.session?.user?.phone ?? "";
      const email = data.session?.user?.email ?? "";

      if (phone || email) {
        setForm((prev) => ({
          ...prev,
          phone: phone || prev.phone,
          email: email || prev.email,
        }));
      }

      if (data.session) {
        await loadCart(data.session.user.id);
      } else {
        setLoadingCart(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        setLoadingCart(true);
        await loadCart(nextSession.user.id);
      } else {
        setCartItems([]);
        setLoadingCart(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase, loadCart]);

  useEffect(() => {
    if (!supabase) return;
    if (loadingAuth) return;
    if (!session) {
      router.replace("/login?redirect=/checkout");
    }
  }, [supabase, loadingAuth, session, router]);

  const pricedItems = useMemo(
    () =>
      cartItems.map((item) => ({
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
    [cartItems]
  );

  const subtotal = pricedItems.reduce((sum, item) => sum + item.pricing.baseTotal, 0);
  const discount = pricedItems.reduce((sum, item) => sum + item.pricing.discountTotal, 0);
  const shipping = 0;
  const total = subtotal - discount + shipping;

  const validate = () => {
    if (selectedAddressId === "new") {
      if (!form.firstName.trim()) return "First name is required.";
      if (!form.lastName.trim()) return "Last name is required.";
      if (!form.line1.trim()) return "Address line 1 is required.";
      if (!form.pincode.trim()) return "PIN code is required.";
      if (!/^[0-9]{5,6}$/.test(form.pincode.trim())) return "PIN code looks invalid.";
      if (!form.city.trim()) return "City is required.";
      if (!form.state.trim()) return "State is required.";
    }

    if (!form.phone.trim()) return "Phone is required.";
    if (!isLikelyE164(form.phone.trim())) return "Phone must be in international format, e.g. +919876543210.";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Email looks invalid.";
    return null;
  };

  const onSubmit = async () => {
    if (pricedItems.length === 0) {
      setMessage("Your bag is empty.");
      return;
    }

    const error = validate();
    if (error) {
      setMessage(error);
      return;
    }

    setSubmitting(true);
    setMessage(null);

    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setSubmitting(false);
      setMessage("Mock checkout complete. Next step is Razorpay payment UI.");
      return;
    }

    setSubmitting(false);
    setMessage("Real checkout mode is not enabled yet.");
  };

  if (!supabase) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <p className="rounded-2xl border border-dashed border-[#d2d2d7] bg-white p-6 text-sm text-[#6e6e73]">
            Missing Supabase env vars.
          </p>
        </div>
      </main>
    );
  }

  if (loadingAuth || loadingCart) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <p className="text-sm text-[#6e6e73]">Checking session...</p>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <p className="text-sm text-[#6e6e73]">Redirecting to login...</p>
        </div>
      </main>
    );
  }

  const selectedSaved = MOCK_ADDRESSES.find((a) => a.id === selectedAddressId) ?? null;

  return (
    <main className="min-h-screen bg-white text-[#1d1d1f]">
      <div className="mx-auto max-w-5xl px-6 pb-24 pt-10">
        <header className="flex items-center justify-between gap-4 border-b border-[#d2d2d7] pb-4">
          <h1 className="text-2xl font-semibold">Checkout</h1>
          <button
            type="button"
            onClick={() => setShowSummary((v) => !v)}
            className="text-sm font-medium text-[#0066cc] hover:underline"
          >
            {showSummary ? "Hide Order Summary" : `Show Order Summary: ${formatINR(total)}`}
          </button>
        </header>

        {showSummary ? (
          <section className="mt-6 rounded-2xl border border-[#d2d2d7] bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Order Summary</h2>
              <p className="text-sm font-semibold">{formatINR(total)}</p>
            </div>

            <div className="mt-5 space-y-4">
              {pricedItems.length === 0 ? (
                <p className="text-sm text-[#6e6e73]">Your bag is empty.</p>
              ) : null}
              {pricedItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl || "/Allbags.png"}
                    alt={item.name}
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-[#6e6e73]">Qty {item.qty}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatINR(item.pricing.finalTotal)}</p>
                    {item.pricing.offerApplied ? (
                      <p className="text-xs text-[#6e6e73] line-through">{formatINR(item.pricing.baseTotal)}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-[#d2d2d7] pt-4 text-sm text-[#6e6e73]">
              <div className="flex items-center justify-between">
                <span>Bag Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Shipping</span>
                <span>{shipping === 0 ? "FREE" : formatINR(shipping)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-emerald-700">
                <span>Offer savings</span>
                <span>-{formatINR(discount)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-base font-semibold text-[#1d1d1f]">
                <span>Total</span>
                <span>{formatINR(total)}</span>
              </div>
            </div>
          </section>
        ) : null}

        <div className="mt-10 grid gap-10 md:grid-cols-[1.2fr_0.8fr]">
          <section>
            <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">Where should we send your order?</h2>

            <div className="mt-10">
              <p className="text-lg font-semibold">Select an address:</p>

              <div className="mt-4 space-y-4">
                {MOCK_ADDRESSES.map((a) => {
                  const selected = selectedAddressId === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        setSelectedAddressId(a.id);
                        setMessage(null);
                        setForm((prev) => addressToForm(a, prev));
                      }}
                      className={
                        "w-full rounded-2xl border px-5 py-5 text-left transition " +
                        (selected
                          ? "border-[#0071e3] shadow-[0_0_0_1px_#0071e3]"
                          : "border-[#d2d2d7] hover:bg-[#fafafa]")
                      }
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold">{a.firstName} {a.lastName}</p>
                          <p className="mt-1 text-sm text-[#6e6e73]">
                            {a.line1}{a.city ? `, ${a.city}` : ""}
                          </p>
                        </div>
                        {a.isDefault ? <span className="text-sm text-[#6e6e73]">Default</span> : null}
                      </div>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    setSelectedAddressId("new");
                    setMessage(null);
                  }}
                  className={
                    "w-full rounded-2xl border px-5 py-6 text-left transition " +
                    (selectedAddressId === "new"
                      ? "border-[#0071e3] shadow-[0_0_0_1px_#0071e3]"
                      : "border-[#d2d2d7] hover:bg-[#fafafa]")
                  }
                >
                  <p className="text-base font-semibold">Use a new address</p>
                </button>
              </div>

              {selectedSaved ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAddressId("new");
                    setForm((prev) => addressToForm(selectedSaved, prev));
                    setMessage(null);
                  }}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#0066cc] hover:underline"
                >
                  Edit this address <span className="text-base leading-none">+</span>
                </button>
              ) : null}

              {selectedAddressId === "new" ? (
                <div className="mt-8 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      value={form.firstName}
                      onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                      placeholder="First Name"
                      className="rounded-xl border border-[#d2d2d7] px-4 py-3 text-sm outline-none focus:border-[#0071e3]"
                    />
                    <input
                      value={form.lastName}
                      onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                      placeholder="Last Name"
                      className="rounded-xl border border-[#d2d2d7] px-4 py-3 text-sm outline-none focus:border-[#0071e3]"
                    />
                  </div>

                  <input
                    value={form.line1}
                    onChange={(e) => setForm((p) => ({ ...p, line1: e.target.value }))}
                    placeholder="Address Line 1"
                    className="w-full rounded-xl border border-[#d2d2d7] px-4 py-3 text-sm outline-none focus:border-[#0071e3]"
                  />
                  <input
                    value={form.line2}
                    onChange={(e) => setForm((p) => ({ ...p, line2: e.target.value }))}
                    placeholder="Address Line 2 (Optional)"
                    className="w-full rounded-xl border border-[#d2d2d7] px-4 py-3 text-sm outline-none focus:border-[#0071e3]"
                  />
                  <input
                    value={form.landmark}
                    onChange={(e) => setForm((p) => ({ ...p, landmark: e.target.value }))}
                    placeholder="Landmark (Optional)"
                    className="w-full rounded-xl border border-[#d2d2d7] px-4 py-3 text-sm outline-none focus:border-[#0071e3]"
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      value={form.pincode}
                      onChange={(e) => setForm((p) => ({ ...p, pincode: e.target.value }))}
                      placeholder="PIN Code"
                      className="rounded-xl border border-[#d2d2d7] px-4 py-3 text-sm outline-none focus:border-[#0071e3]"
                    />
                    <input
                      value={form.city}
                      onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                      placeholder="City"
                      className="rounded-xl border border-[#d2d2d7] px-4 py-3 text-sm outline-none focus:border-[#0071e3]"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      value={form.state}
                      onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                      placeholder="State"
                      className="rounded-xl border border-[#d2d2d7] px-4 py-3 text-sm outline-none focus:border-[#0071e3]"
                    />
                    <input
                      value={form.country}
                      onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                      placeholder="Country"
                      className="rounded-xl border border-[#d2d2d7] px-4 py-3 text-sm outline-none focus:border-[#0071e3]"
                    />
                  </div>

                  <label className="flex items-center gap-3 text-sm text-[#6e6e73]">
                    <input
                      type="checkbox"
                      checked={form.isBusiness}
                      onChange={(e) => setForm((p) => ({ ...p, isBusiness: e.target.checked }))}
                      className="h-5 w-5 rounded border-[#bdbdc2]"
                    />
                    This is a business address
                  </label>
                </div>
              ) : null}
            </div>

            <div className="mt-16 border-t border-[#d2d2d7] pt-10">
              <h3 className="text-2xl font-semibold">What&apos;s your contact information?</h3>

              <div className="mt-6 grid gap-10 md:grid-cols-[1fr_0.9fr]">
                <div className="space-y-4">
                  <input
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="Email Address (optional)"
                    className="w-full rounded-xl border border-[#d2d2d7] px-4 py-3 text-sm outline-none focus:border-[#0071e3]"
                  />
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="Mobile Number (e.g. +919876543210)"
                    className="w-full rounded-xl border border-[#d2d2d7] px-4 py-3 text-sm outline-none focus:border-[#0071e3]"
                  />
                </div>

                <div className="text-sm text-[#6e6e73]">
                  <p>We&apos;ll email you a receipt and send order updates to your mobile phone via SMS.</p>
                  <p className="mt-6 font-semibold text-[#1d1d1f]">For a successful delivery, make sure your phone number is correct:</p>
                  <ul className="mt-3 list-disc space-y-2 pl-5">
                    <li>The courier may contact you on this number.</li>
                    <li>Keep access to this phone on the day of delivery.</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting || pricedItems.length === 0}
              className="mt-12 w-full rounded-2xl bg-[#0071e3] px-6 py-4 text-base font-semibold text-white shadow-[0_18px_40px_rgba(0,113,227,0.25)] transition hover:bg-[#0077ed] disabled:opacity-60"
            >
              {submitting ? "Continuing..." : pricedItems.length === 0 ? "Bag is empty" : "Continue to Payment"}
            </button>

            {message ? <p className="mt-4 text-sm text-[#6e6e73]">{message}</p> : null}

            <div className="mt-10">
              <Link href="/cart" className="text-sm font-medium text-[#0066cc] hover:underline">
                Back to bag
              </Link>
            </div>

            {isMock ? (
              <p className="mt-6 text-xs text-[#86868b]">
                Mock checkout UI. Next step is wiring saved addresses + payments with Supabase.
              </p>
            ) : null}
          </section>

          <aside className="pt-2 text-sm text-[#6e6e73]">
            <p className="font-semibold text-[#1d1d1f]">Need help?</p>
            <p className="mt-2">Chat with us or call support. We&apos;re here to help with delivery and order questions.</p>
            <div className="mt-6 border-t border-[#d2d2d7] pt-6">
              <p className="font-semibold text-[#1d1d1f]">Delivery</p>
              <p className="mt-2">Order today. Free shipping on all orders.</p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
