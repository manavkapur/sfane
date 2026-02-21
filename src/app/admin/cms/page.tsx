"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type OrderStatus = "CREATED" | "PAID" | "PACKED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
type OfferType = "PERCENT" | "FIXED" | "BUY_X_GET_Y";
type CouponType = "PERCENT" | "FIXED";

type AdminOrder = {
  id: number;
  customerName: string;
  phone: string;
  itemCount: number;
  total: number;
  paymentStatus: "paid" | "pending";
  status: OrderStatus;
  createdAt: string;
};

type AdminProduct = {
  id: number;
  name: string;
  slug: string;
  price: number;
  category: string;
  stock: number;
  active: boolean;
  imageUrl: string;
  offerType: "NONE" | "PERCENT" | "FIXED" | "BUY_X_GET_Y";
  discountValue: number | null;
  buyQty: number | null;
  getQty: number | null;
  discountStart: string | null;
  discountEnd: string | null;
};

type AdminProductRow = {
  id: number;
  name: string;
  slug: string;
  price: number | string;
  active: boolean;
  product_images: Array<{ image_url: string }> | null;
  product_categories: Array<{ categories: { name: string } | null }> | null;
  offer_type: string | null;
  discount_percent: number | null;
  buy_qty: number | null;
  get_qty: number | null;
  discount_start: string | null;
  discount_end: string | null;
};

type AdminCoupon = {
  id: number;
  code: string;
  type: CouponType;
  value: number;
  minOrder: number;
  usageLimit: number;
  usedCount: number;
  startAt: string;
  endAt: string;
  active: boolean;
};

const initialOrders: AdminOrder[] = [
  {
    id: 31021,
    customerName: "Manav Kapur",
    phone: "+91 98765 43210",
    itemCount: 2,
    total: 25900,
    paymentStatus: "paid",
    status: "PACKED",
    createdAt: "2026-02-13T12:30:00Z",
  },
  {
    id: 31020,
    customerName: "Mohinder Krishan",
    phone: "+91 98111 11193",
    itemCount: 1,
    total: 15800,
    paymentStatus: "paid",
    status: "SHIPPED",
    createdAt: "2026-02-13T10:10:00Z",
  },
  {
    id: 31019,
    customerName: "Ananya Sharma",
    phone: "+91 98989 12212",
    itemCount: 3,
    total: 31200,
    paymentStatus: "pending",
    status: "CREATED",
    createdAt: "2026-02-12T18:42:00Z",
  },
];

const initialCoupons: AdminCoupon[] = [
  {
    id: 1,
    code: "SFAFIRST10",
    type: "PERCENT",
    value: 10,
    minOrder: 999,
    usageLimit: 300,
    usedCount: 54,
    startAt: "2026-02-10T00:00",
    endAt: "2026-03-01T23:59",
    active: true,
  },
];

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function mapBackendProductToAdminProduct(product: AdminProductRow): AdminProduct {
  const category =
    product.product_categories
      ?.map((item) => item.categories?.name)
      .filter(Boolean)
      .join(", ") || "Uncategorized";

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: Number(product.price),
    category,
    stock: 0,
    active: product.active,
    imageUrl: product.product_images?.[0]?.image_url || "/sfanelogo.png",
    offerType:
      product.offer_type === "PERCENT" || product.offer_type === "FIXED" || product.offer_type === "BUY_X_GET_Y"
        ? product.offer_type
        : "NONE",
    discountValue: product.discount_percent,
    buyQty: product.buy_qty,
    getQty: product.get_qty,
    discountStart: product.discount_start,
    discountEnd: product.discount_end,
  };
}

function parseFlexibleNumber(value: string) {
  const normalized = value.replace(/[,%₹\s]/g, "").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function toIsoDateTimeOrNull(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime())) {
    return direct.toISOString();
  }

  const match = trimmed.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/
  );
  if (!match) {
    throw new Error(`Invalid date/time: "${value}". Please use the picker.`);
  }

  const [, dd, mm, yyyy, hhRaw, min, ampm] = match;
  let hh = Number(hhRaw);
  if (!Number.isFinite(hh)) {
    throw new Error(`Invalid hour in date/time: "${value}".`);
  }

  if (ampm) {
    const upper = ampm.toUpperCase();
    if (upper === "AM" && hh == 12) hh = 0;
    if (upper == "PM" && hh < 12) hh += 12;
  }

  const parsed = new Date(Number(yyyy), Number(mm) - 1, Number(dd), hh, Number(min), 0, 0);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date/time: "${value}". Please use the picker.`);
  }

  return parsed.toISOString();
}

async function extractFunctionErrorMessage(
  error:
    | {
        message?: string;
        name?: string;
        context?: Response;
        response?: Response;
        status?: number;
        details?: string;
      }
    | null
) {
  if (!error) return "Unknown function error";

  const response =
    error.context ??
    error.response ??
    ((error as unknown as { cause?: { context?: Response; response?: Response } })?.cause?.context ??
      (error as unknown as { cause?: { context?: Response; response?: Response } })?.cause?.response);

  const status = response?.status ?? error.status ?? null;
  const prefix = error.name ? `${error.name}` : "Function error";

  if (response) {
    try {
      const textValue = await response.clone().text();
      if (textValue) {
        try {
          const body = JSON.parse(textValue);
          const backendError =
            typeof body?.error === "string"
              ? body.error
              : typeof body?.message === "string"
              ? body.message
              : textValue;
          return `${prefix}${status ? ` (${status})` : ""}: ${backendError}`;
        } catch {
          return `${prefix}${status ? ` (${status})` : ""}: ${textValue}`;
        }
      }
    } catch {
      // Fall through to message/details fallback.
    }
  }

  if (error.details) {
    return `${prefix}${status ? ` (${status})` : ""}: ${error.details}`;
  }

  if (error.message) {
    return `${prefix}${status ? ` (${status})` : ""}: ${error.message}`;
  }

  return `${prefix}${status ? ` (${status})` : ""}`;
}

export default function AdminCmsPage() {

  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const adminLoginUrl = "/admin/login";

  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [coupons, setCoupons] = useState<AdminCoupon[]>(initialCoupons);

  const [sessionReady, setSessionReady] = useState(!supabase);
  const [shouldRedirectToLogin, setShouldRedirectToLogin] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [orderFilter, setOrderFilter] = useState<"ALL" | OrderStatus>("ALL");
  const [orderSearch, setOrderSearch] = useState("");

  const [newProduct, setNewProduct] = useState({
    name: "",
    slug: "",
    price: "",
    category: "",
    stock: "",
    imageUrls: ["", "", "", "", ""],
  });

  const [newOffer, setNewOffer] = useState({
    title: "",
    type: "PERCENT" as OfferType,
    value: "",
    startAt: "",
    endAt: "",
    buyQty: "",
    getQty: "",
    productIds: [] as number[],
  });

  const [newCoupon, setNewCoupon] = useState({
    code: "",
    type: "PERCENT" as CouponType,
    value: "",
    minOrder: "",
    usageLimit: "",
    startAt: "",
    endAt: "",
  });

  const refreshProducts = useCallback(async () => {
    if (!supabase) return false;

    const { data, error } = await supabase.functions.invoke("admin-products", { method: "GET" });
    if (error) {
      setMessage(error.message);
      return false;
    }

    const rows = (data?.products ?? []) as AdminProductRow[];
    setProducts(rows.map(mapBackendProductToAdminProduct));
    return true;
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    const loadingFallback = window.setTimeout(() => {
      if (!active) return;
      setMessage("Admin session check is taking longer than expected. Redirecting to login.");
      setShouldRedirectToLogin(true);
    }, 7000);

    const bootstrap = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!active) return;

        if (error) {
          throw error;
        }

        if (!data.session) {
          setShouldRedirectToLogin(true);
          return;
        }

        const ok = await refreshProducts();
        if (!active) return;
        if (!ok) {
          await supabase.auth.signOut();
          setShouldRedirectToLogin(true);
          return;
        }

        setSessionReady(true);
      } catch (error) {
        if (!active) return;
        const text = error instanceof Error ? error.message : String(error);
        setMessage(`Failed to check admin session: ${text}`);
        setShouldRedirectToLogin(true);
      } finally {
        if (!active) return;
        clearTimeout(loadingFallback);
      }
    };

    bootstrap();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      if (!nextSession) {
        setShouldRedirectToLogin(true);
      }
    });

    return () => {
      active = false;
      clearTimeout(loadingFallback);
      listener.subscription.unsubscribe();
    };
  }, [supabase, refreshProducts]);

  useEffect(() => {
    if (!supabase || !shouldRedirectToLogin) return;

    router.replace(adminLoginUrl);

    const fallback = window.setTimeout(() => {
      if (window.location.pathname !== "/admin/login") {
        window.location.assign(adminLoginUrl);
      }
    }, 700);

    return () => window.clearTimeout(fallback);
  }, [supabase, shouldRedirectToLogin, router, adminLoginUrl]);

  const visibleOrders = orders.filter((order) => {
    const statusMatch = orderFilter === "ALL" || order.status === orderFilter;
    const query = orderSearch.trim().toLowerCase();
    const searchMatch =
      !query ||
      order.customerName.toLowerCase().includes(query) ||
      String(order.id).includes(query) ||
      order.phone.toLowerCase().includes(query);
    return statusMatch && searchMatch;
  });

  const revenue = orders.filter((o) => o.paymentStatus === "paid").reduce((sum, o) => sum + o.total, 0);
  const activeOfferProducts = products.filter((product) => product.offerType !== "NONE");

  const updateOrderStatus = (orderId: number, status: OrderStatus) => {
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status } : order)));
    setMessage(`Order #${orderId} marked as ${status}.`);
  };

  const createProduct = async () => {
    if (!supabase) return;

    setMessage(null);
    const price = Number(newProduct.price);
    if (!newProduct.name || !newProduct.slug || !Number.isFinite(price)) {
      setMessage("Product name, slug, and price are required.");
      return;
    }

    const createdName = newProduct.name;
    const imageUrls = newProduct.imageUrls.map((value) => value.trim()).filter(Boolean).slice(0, 5);
    const { error } = await supabase.functions.invoke("admin-products", {
      method: "POST",
      body: {
        action: "create",
        product: {
          name: newProduct.name,
          slug: newProduct.slug,
          price,
          images: imageUrls,
        },
      },
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setNewProduct({ name: "", slug: "", price: "", category: "", stock: "", imageUrls: ["", "", "", "", ""] });
    setMessage(`Product ${createdName} created.`);
    await refreshProducts();
  };

  const removeProduct = async (productId: number) => {
    if (!supabase) return;

    const { error } = await supabase.functions.invoke("admin-products", {
      method: "POST",
      body: { action: "delete", product: { id: productId } },
    });
    if (error) {
      setMessage(error.message);
      return;
    }

    await refreshProducts();
    setMessage(`Product #${productId} removed.`);
  };

  const toggleProductActive = async (productId: number) => {
    if (!supabase) return;

    const current = products.find((product) => product.id === productId);
    if (!current) return;

    const { error } = await supabase.functions.invoke("admin-products", {
      method: "POST",
      body: {
        action: "update",
        product: { id: productId, active: !current.active },
      },
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    await refreshProducts();
  };

  const createOffer = async () => {
    if (!supabase) return;

    setMessage(null);

    if (!newOffer.title.trim()) {
      setMessage("Offer title is required.");
      return;
    }

    if (newOffer.productIds.length === 0) {
      setMessage("Select at least one product for this offer.");
      return;
    }

    const normalizedType = newOffer.type.toUpperCase() as OfferType;
    const value = parseFlexibleNumber(newOffer.value);
    const buyQty = parseFlexibleNumber(newOffer.buyQty);
    const getQty = parseFlexibleNumber(newOffer.getQty);

    if (normalizedType === "PERCENT" && (value === null || value <= 0 || value > 100)) {
      setMessage("Percent offer requires value between 1 and 100.");
      return;
    }

    if (normalizedType === "FIXED" && (value === null || value <= 0)) {
      setMessage("Fixed offer requires amount greater than 0.");
      return;
    }

    if (
      normalizedType === "BUY_X_GET_Y" &&
      (buyQty === null || buyQty <= 0 || getQty === null || getQty <= 0)
    ) {
      setMessage("Buy X Get Y requires valid buy and get quantities.");
      return;
    }

    let discountStart: string | null = null;
    let discountEnd: string | null = null;

    try {
      discountStart = toIsoDateTimeOrNull(newOffer.startAt);
      discountEnd = toIsoDateTimeOrNull(newOffer.endAt);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
      return;
    }

    if (discountStart && discountEnd && new Date(discountStart) > new Date(discountEnd)) {
      setMessage("Offer end date/time must be after start date/time.");
      return;
    }

    for (const productId of newOffer.productIds) {
      const { error } = await supabase.functions.invoke("admin-products", {
        method: "POST",
        body: {
          action: "update",
          product: {
            id: productId,
            offer_type: normalizedType,
            discount_percent: normalizedType === "BUY_X_GET_Y" ? null : value,
            buy_qty: normalizedType === "BUY_X_GET_Y" ? buyQty : null,
            get_qty: normalizedType === "BUY_X_GET_Y" ? getQty : null,
            discount_start: discountStart,
            discount_end: discountEnd,
          },
        },
      });

      if (error) {
        const details = await extractFunctionErrorMessage(error as { message?: string; context?: Response });
        setMessage(`Failed applying offer to product ${productId}: ${details}`);
        return;
      }
    }

    setNewOffer({ title: "", type: "PERCENT", value: "", startAt: "", endAt: "", buyQty: "", getQty: "", productIds: [] });
    setMessage("Offer applied to selected products.");
    await refreshProducts();
  };

  const removeOfferFromProduct = async (productId: number) => {
    if (!supabase) return;

    const { error } = await supabase.functions.invoke("admin-products", {
      method: "POST",
      body: {
        action: "update",
        product: {
          id: productId,
          offer_type: "NONE",
          discount_percent: null,
          buy_qty: null,
          get_qty: null,
          discount_start: null,
          discount_end: null,
        },
      },
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(`Offer removed from product #${productId}.`);
    await refreshProducts();
  };

  const createCoupon = () => {
    const value = Number(newCoupon.value);
    const minOrder = Number(newCoupon.minOrder);
    const usageLimit = Number(newCoupon.usageLimit);
    if (!newCoupon.code || !Number.isFinite(value) || !Number.isFinite(minOrder) || !Number.isFinite(usageLimit)) {
      setMessage("Coupon code, value, min order, and usage limit are required.");
      return;
    }

    const nextId = Math.max(...coupons.map((c) => c.id), 0) + 1;
    const coupon: AdminCoupon = {
      id: nextId,
      code: newCoupon.code.toUpperCase(),
      type: newCoupon.type,
      value,
      minOrder,
      usageLimit,
      usedCount: 0,
      startAt: newCoupon.startAt,
      endAt: newCoupon.endAt,
      active: true,
    };

    setCoupons((prev) => [coupon, ...prev]);
    setNewCoupon({ code: "", type: "PERCENT", value: "", minOrder: "", usageLimit: "", startAt: "", endAt: "" });
    setMessage(`Coupon ${coupon.code} created.`);
  };

  const toggleCouponActive = (couponId: number) => {
    setCoupons((prev) => prev.map((coupon) => (coupon.id === couponId ? { ...coupon, active: !coupon.active } : coupon)));
  };

  const removeCoupon = (couponId: number) => {
    setCoupons((prev) => prev.filter((coupon) => coupon.id !== couponId));
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  if (!sessionReady) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-sm text-[#5b4739]">
          {shouldRedirectToLogin ? "Redirecting to admin login..." : "Checking admin session..."}
        </p>
        <Link href={adminLoginUrl} className="mt-3 inline-block text-sm text-[#5b4739] underline">
          Go to admin login
        </Link>
        {message ? <p className="mt-3 text-xs text-[#7a4d30]">{message}</p> : null}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 pb-16 pt-10 text-[#111111] [&_input]:text-[#111111] [&_input]:placeholder:text-[#7a7a7a] [&_select]:text-[#111111]">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[#e2e2e2] bg-white px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#555555]">Admin CMS</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1f140d]">Operations Dashboard</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/products" className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm font-semibold text-[#333333]">
              Storefront
            </Link>
            <button
              onClick={signOut}
              className="rounded-full bg-[#1f140d] px-4 py-2 text-sm font-semibold text-white"
            >
              Sign out
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <article className="rounded-2xl border border-[#e2e2e2] bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-[#555555]">Orders</p>
            <p className="mt-2 text-2xl font-semibold text-[#1f140d]">{orders.length}</p>
          </article>
          <article className="rounded-2xl border border-[#e2e2e2] bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-[#555555]">Revenue</p>
            <p className="mt-2 text-2xl font-semibold text-[#1f140d]">{formatINR(revenue)}</p>
          </article>
          <article className="rounded-2xl border border-[#e2e2e2] bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-[#555555]">Products</p>
            <p className="mt-2 text-2xl font-semibold text-[#1f140d]">{products.length}</p>
          </article>
          <article className="rounded-2xl border border-[#e2e2e2] bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-[#555555]">Coupons Live</p>
            <p className="mt-2 text-2xl font-semibold text-[#1f140d]">{coupons.filter((c) => c.active).length}</p>
          </article>
        </section>

        <section className="rounded-3xl border border-[#e2e2e2] bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-[#1f140d]">Orders</h2>
            <div className="flex flex-wrap gap-2">
              <input
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search by customer, phone, order id"
                className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
              />
              <select
                value={orderFilter}
                onChange={(e) => setOrderFilter(e.target.value as "ALL" | OrderStatus)}
                className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
              >
                <option value="ALL">All statuses</option>
                <option value="CREATED">Created</option>
                <option value="PAID">Paid</option>
                <option value="PACKED">Packed</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {visibleOrders.map((order) => (
              <article key={order.id} className="rounded-2xl border border-[#e7e7e7] bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#1f140d]">Order #{order.id}</p>
                    <p className="text-sm text-[#333333]">
                      {order.customerName} · {order.phone} · {order.itemCount} items
                    </p>
                    <p className="text-xs text-[#555555]">{new Date(order.createdAt).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#f6efe8] px-3 py-1 text-sm font-semibold text-[#333333]">
                      {formatINR(order.total)}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        order.paymentStatus === "paid" ? "bg-[#e8f6ea] text-[#1f7a34]" : "bg-[#fff3e2] text-[#996100]"
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                      className="rounded-full border border-[#d0d0d0] px-3 py-1 text-sm"
                    >
                      <option value="CREATED">Created</option>
                      <option value="PAID">Paid</option>
                      <option value="PACKED">Packed</option>
                      <option value="SHIPPED">Shipped</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-[#e2e2e2] bg-white p-6">
            <h2 className="text-xl font-semibold text-[#1f140d]">Products</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                value={newProduct.name}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Product name"
                className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
              />
              <input
                value={newProduct.slug}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="slug"
                className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
              />
              <input
                value={newProduct.price}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="Price"
                className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
              />
              <input
                value={newProduct.stock}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, stock: e.target.value }))}
                placeholder="Stock"
                className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
              />
              <input
                value={newProduct.category}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, category: e.target.value }))}
                placeholder="Category"
                className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
              />
              {newProduct.imageUrls.map((imageUrl, index) => (
                <input
                  key={`cms-image-url-${index}`}
                  value={imageUrl}
                  onChange={(e) =>
                    setNewProduct((prev) => ({
                      ...prev,
                      imageUrls: prev.imageUrls.map((item, itemIndex) => (itemIndex === index ? e.target.value : item)),
                    }))
                  }
                  placeholder={`Image URL ${index + 1}${index === 0 ? " (primary)" : ""}`}
                  className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
                />
              ))}
            </div>
            <button
              onClick={createProduct}
              className="mt-4 rounded-full bg-[#1f140d] px-4 py-2 text-sm font-semibold text-white"
            >
              Add product
            </button>

            <div className="mt-5 space-y-3">
              {products.map((product) => (
                <div key={product.id} className="rounded-2xl border border-[#e7e7e7] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-[#1f140d]">{product.name}</p>
                      <p className="text-sm text-[#333333]">
                        {formatINR(product.price)} · {product.category} · {product.active ? "Active" : "Inactive"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => toggleProductActive(product.id)}
                        className="rounded-full border border-[#d0d0d0] px-3 py-1 text-xs font-semibold text-[#333333]"
                      >
                        {product.active ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => removeProduct(product.id)}
                        className="rounded-full border border-[#efc5c5] px-3 py-1 text-xs font-semibold text-[#9f2626]"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  {product.offerType !== "NONE" ? (
                    <p className="mt-2 text-xs font-medium text-[#1f7a34]">
                      Offer:{" "}
                      {product.offerType === "BUY_X_GET_Y"
                        ? `Buy ${product.buyQty} Get ${product.getQty}`
                        : `${product.offerType} ${product.discountValue ?? 0}`}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-[#e2e2e2] bg-white p-6">
            <h2 className="text-xl font-semibold text-[#1f140d]">Offers</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                value={newOffer.title}
                onChange={(e) => setNewOffer((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Offer title"
                className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
              />
              <select
                value={newOffer.type}
                onChange={(e) => setNewOffer((prev) => ({ ...prev, type: e.target.value as OfferType }))}
                className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
              >
                <option value="PERCENT">Percent</option>
                <option value="FIXED">Fixed</option>
                <option value="BUY_X_GET_Y">Buy X Get Y</option>
              </select>

              {newOffer.type === "BUY_X_GET_Y" ? (
                <>
                  <input
                    value={newOffer.buyQty}
                    onChange={(e) => setNewOffer((prev) => ({ ...prev, buyQty: e.target.value }))}
                    placeholder="Buy quantity (X)"
                    className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
                  />
                  <input
                    value={newOffer.getQty}
                    onChange={(e) => setNewOffer((prev) => ({ ...prev, getQty: e.target.value }))}
                    placeholder="Free quantity (Y)"
                    className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
                  />
                </>
              ) : (
                <input
                  value={newOffer.value}
                  onChange={(e) => setNewOffer((prev) => ({ ...prev, value: e.target.value }))}
                  placeholder={newOffer.type === "PERCENT" ? "Discount % (x)" : "Fixed amount off (₹)"}
                  className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
                />
              )}

              <input
                type="datetime-local"
                value={newOffer.startAt}
                onChange={(e) => setNewOffer((prev) => ({ ...prev, startAt: e.target.value }))}
                className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
              />
              <input
                type="datetime-local"
                value={newOffer.endAt}
                onChange={(e) => setNewOffer((prev) => ({ ...prev, endAt: e.target.value }))}
                className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
              />
            </div>

            <div className="mt-4 rounded-2xl border border-[#e7e7e7] p-3">
              <p className="text-sm font-semibold text-[#1f140d]">Apply to products</p>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                {products.map((product) => (
                  <label key={product.id} className="flex items-center gap-2 text-sm text-[#333333]">
                    <input
                      type="checkbox"
                      checked={newOffer.productIds.includes(product.id)}
                      onChange={(e) => {
                        setNewOffer((prev) => ({
                          ...prev,
                          productIds: e.target.checked
                            ? [...prev.productIds, product.id]
                            : prev.productIds.filter((id) => id !== product.id),
                        }));
                      }}
                    />
                    {product.name}
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={createOffer}
              className="mt-4 rounded-full bg-[#1f140d] px-4 py-2 text-sm font-semibold text-white"
            >
              Apply offer
            </button>

            {message ? <p className="mt-3 text-sm text-[#9f2626]">{message}</p> : null}

            <div className="mt-5 space-y-3">
              {activeOfferProducts.map((product) => (
                <div key={`offer-${product.id}`} className="rounded-2xl border border-[#e7e7e7] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-[#1f140d]">{product.name}</p>
                      <p className="text-sm text-[#333333]">
                        {product.offerType === "BUY_X_GET_Y"
                          ? `BUY_X_GET_Y · Buy ${product.buyQty} Get ${product.getQty}`
                          : `${product.offerType} · ${product.discountValue ?? 0}`}
                      </p>
                      <p className="text-xs text-[#555555]">
                        {product.discountStart ? new Date(product.discountStart).toLocaleString("en-IN") : "No start"} to{" "}
                        {product.discountEnd ? new Date(product.discountEnd).toLocaleString("en-IN") : "No end"}
                      </p>
                    </div>
                    <button
                      onClick={() => removeOfferFromProduct(product.id)}
                      className="rounded-full border border-[#efc5c5] px-3 py-1 text-xs font-semibold text-[#9f2626]"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              {!activeOfferProducts.length ? (
                <p className="text-sm text-[#555555]">No active product offers.</p>
              ) : null}
            </div>
          </article>
        </section>

        <section className="rounded-3xl border border-[#e2e2e2] bg-white p-6">
          <h2 className="text-xl font-semibold text-[#1f140d]">Coupons</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input
              value={newCoupon.code}
              onChange={(e) => setNewCoupon((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
              placeholder="Coupon code"
              className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
            />
            <select
              value={newCoupon.type}
              onChange={(e) => setNewCoupon((prev) => ({ ...prev, type: e.target.value as CouponType }))}
              className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
            >
              <option value="PERCENT">Percent</option>
              <option value="FIXED">Fixed amount</option>
            </select>
            <input
              value={newCoupon.value}
              onChange={(e) => setNewCoupon((prev) => ({ ...prev, value: e.target.value }))}
              placeholder="Discount value"
              className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
            />
            <input
              value={newCoupon.minOrder}
              onChange={(e) => setNewCoupon((prev) => ({ ...prev, minOrder: e.target.value }))}
              placeholder="Minimum order"
              className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
            />
            <input
              value={newCoupon.usageLimit}
              onChange={(e) => setNewCoupon((prev) => ({ ...prev, usageLimit: e.target.value }))}
              placeholder="Usage limit"
              className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
            />
            <input
              type="datetime-local"
              value={newCoupon.startAt}
              onChange={(e) => setNewCoupon((prev) => ({ ...prev, startAt: e.target.value }))}
              className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
            />
            <input
              type="datetime-local"
              value={newCoupon.endAt}
              onChange={(e) => setNewCoupon((prev) => ({ ...prev, endAt: e.target.value }))}
              className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
            />
          </div>

          <button
            onClick={createCoupon}
            className="mt-4 rounded-full bg-[#1f140d] px-4 py-2 text-sm font-semibold text-white"
          >
            Add coupon
          </button>

          <div className="mt-5 space-y-3">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="rounded-2xl border border-[#e7e7e7] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#1f140d]">{coupon.code}</p>
                    <p className="text-sm text-[#333333]">
                      {coupon.type} {coupon.value} · Min {formatINR(coupon.minOrder)} · Used {coupon.usedCount}/{coupon.usageLimit}
                    </p>
                    <p className="text-xs text-[#555555]">
                      {coupon.startAt ? new Date(coupon.startAt).toLocaleString("en-IN") : "No start"} to{" "}
                      {coupon.endAt ? new Date(coupon.endAt).toLocaleString("en-IN") : "No end"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleCouponActive(coupon.id)}
                      className="rounded-full border border-[#d0d0d0] px-3 py-1 text-xs font-semibold text-[#333333]"
                    >
                      {coupon.active ? "Pause" : "Activate"}
                    </button>
                    <button
                      onClick={() => removeCoupon(coupon.id)}
                      className="rounded-full border border-[#efc5c5] px-3 py-1 text-xs font-semibold text-[#9f2626]"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
