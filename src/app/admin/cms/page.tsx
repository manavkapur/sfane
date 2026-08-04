"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { normalizeProductSlug } from "@/lib/product-slug";
import {
  fetchAdminOrdersPayload,
  formatINR,
  type AdminOrder,
  type AdminUserAnalytics,
  type OrderStatus,
  updateAdminOrderStatus,
} from "@/lib/admin-orders";

type OfferType = "PERCENT" | "FIXED" | "BUY_X_GET_Y" | "QTY_TIER_30_40";
type CouponType = "PERCENT" | "FIXED";
const PRODUCT_CATEGORY_OPTIONS = [
  { slug: "duffle", label: "Duffle" },
  { slug: "toiletry-kit", label: "Toiletry Kit" },
  { slug: "tiffin", label: "Tiffin" },
] as const;
type ProductCategorySlug = (typeof PRODUCT_CATEGORY_OPTIONS)[number]["slug"];
const DEFAULT_PRODUCT_CATEGORY: ProductCategorySlug = PRODUCT_CATEGORY_OPTIONS[0].slug;

type AdminProduct = {
  id: number;
  name: string;
  slug: string;
  price: number;
  category: string;
  categorySlugs: string[];
  stock: number;
  active: boolean;
  imageUrl: string;
  imageUrls: string[];
  buyLink: string | null;
  offerType: "NONE" | "PERCENT" | "FIXED" | "BUY_X_GET_Y" | "QTY_TIER_30_40";
  discountValue: number | null;
  buyQty: number | null;
  getQty: number | null;
  discountStart: string | null;
  discountEnd: string | null;
  displayRank: number;
};

type AdminProductRow = {
  id: number;
  name: string;
  slug: string;
  price: number | string;
  active: boolean;
  buy_link: string | null;
  product_images: Array<{ image_url: string }> | null;
  product_categories: Array<{ categories: { name: string; slug: string } | null }> | null;
  offer_type: string | null;
  discount_percent: number | null;
  buy_qty: number | null;
  get_qty: number | null;
  discount_start: string | null;
  discount_end: string | null;
  display_rank?: number | null;
};

type AdminCoupon = {
  id: number;
  code: string;
  type: CouponType;
  value: number;
  minOrder: number;
  usageLimit: number;
  usedCount: number;
  startAt: string | null;
  endAt: string | null;
  active: boolean;
};

type AdminCouponRow = {
  id: number;
  code: string;
  coupon_type: string | null;
  discount_value: number | string | null;
  min_order_value: number | string | null;
  usage_limit: number | null;
  used_count: number | null;
  start_at: string | null;
  end_at: string | null;
  active: boolean | null;
};

type AdminCategoryRow = {
  id: number;
  slug: string;
};

type NewProductForm = {
  name: string;
  slug: string;
  price: string;
  category: ProductCategorySlug;
  stock: string;
  buyLink: string;
  imageUrls: string[];
};

const initialCoupons: AdminCoupon[] = [];
const MAX_PRODUCT_IMAGE_URLS = 7;
const ORDERS_PAGE_SIZE = 5;
const PRODUCTS_PAGE_SIZE = 12;

function mapBackendProductToAdminProduct(product: AdminProductRow): AdminProduct {
  const category =
    product.product_categories
      ?.map((item) => item.categories?.name)
      .filter(Boolean)
      .join(", ") || "Uncategorized";
  const categorySlugs =
    product.product_categories
      ?.map((item) => item.categories?.slug)
      .filter((slug): slug is string => Boolean(slug)) ?? [];

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: Number(product.price),
    category,
    categorySlugs,
    stock: 0,
    active: product.active,
    imageUrl: product.product_images?.[0]?.image_url || "/sfanelogo.png",
    imageUrls: product.product_images?.map((image) => image.image_url).filter(Boolean) ?? [],
    buyLink: product.buy_link,
    offerType:
      product.offer_type === "PERCENT" ||
      product.offer_type === "FIXED" ||
      product.offer_type === "BUY_X_GET_Y" ||
      product.offer_type === "QTY_TIER_30_40"
        ? product.offer_type
        : "NONE",
    discountValue: product.discount_percent,
    buyQty: product.buy_qty,
    getQty: product.get_qty,
    discountStart: product.discount_start,
    discountEnd: product.discount_end,
    displayRank: Number(product.display_rank ?? 0),
  };
}

function mapBackendCouponToAdminCoupon(coupon: AdminCouponRow): AdminCoupon {
  return {
    id: coupon.id,
    code: (coupon.code ?? "").toUpperCase(),
    type: coupon.coupon_type === "FIXED" ? "FIXED" : "PERCENT",
    value: Number(coupon.discount_value ?? 0),
    minOrder: Number(coupon.min_order_value ?? 0),
    usageLimit: Number(coupon.usage_limit ?? 0),
    usedCount: Number(coupon.used_count ?? 0),
    startAt: coupon.start_at,
    endAt: coupon.end_at,
    active: Boolean(coupon.active),
  };
}

function parseFlexibleNumber(value: string) {
  const normalized = value.replace(/[,%₹\s]/g, "").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function fuzzyMatches(value: string, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = value.toLowerCase();
  if (haystack.includes(needle)) return true;

  let position = 0;
  for (const character of needle) {
    position = haystack.indexOf(character, position);
    if (position === -1) return false;
    position += 1;
  }
  return true;
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

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [analytics, setAnalytics] = useState<AdminUserAnalytics | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState<"ALL" | ProductCategorySlug>("ALL");
  const [visibleProductCount, setVisibleProductCount] = useState(PRODUCTS_PAGE_SIZE);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [savingProductId, setSavingProductId] = useState<number | null>(null);
  const [coupons, setCoupons] = useState<AdminCoupon[]>(initialCoupons);

  const [sessionReady, setSessionReady] = useState(!supabase);
  const [sessionCheckSlow, setSessionCheckSlow] = useState(false);
  const [shouldRedirectToLogin, setShouldRedirectToLogin] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [orderFilter, setOrderFilter] = useState<"ALL" | OrderStatus>("ALL");
  const [orderSearch, setOrderSearch] = useState("");
  const [visibleOrderCount, setVisibleOrderCount] = useState(ORDERS_PAGE_SIZE);
  const ordersScrollRef = useRef<HTMLDivElement | null>(null);

  const [newProduct, setNewProduct] = useState<NewProductForm>({
    name: "",
    slug: "",
    price: "",
    category: DEFAULT_PRODUCT_CATEGORY,
    stock: "",
    buyLink: "",
    imageUrls: Array.from({ length: MAX_PRODUCT_IMAGE_URLS }, () => ""),
  });
  const [categorySlugToId, setCategorySlugToId] = useState<
    Partial<Record<ProductCategorySlug, number>>
  >({});

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

  const refreshProductCategoryMap = useCallback(async () => {
    if (!supabase) return false;

    const allowedSlugs = PRODUCT_CATEGORY_OPTIONS.map((option) => option.slug);
    const { data, error } = await supabase
      .from("categories")
      .select("id,slug")
      .in("slug", allowedSlugs);

    if (error) {
      setMessage(`Failed to load product categories: ${error.message}`);
      return false;
    }

    const nextMap: Partial<Record<ProductCategorySlug, number>> = {};
    for (const row of ((data ?? []) as AdminCategoryRow[])) {
      if ((allowedSlugs as readonly string[]).includes(row.slug)) {
        nextMap[row.slug as ProductCategorySlug] = row.id;
      }
    }
    setCategorySlugToId(nextMap);

    const missingLabels = PRODUCT_CATEGORY_OPTIONS.filter((option) => !nextMap[option.slug]).map(
      (option) => option.label
    );
    if (missingLabels.length > 0) {
      setMessage(`Missing categories in database: ${missingLabels.join(", ")}.`);
      return false;
    }

    return true;
  }, [supabase]);

  const refreshCoupons = useCallback(async () => {
    if (!supabase) return false;

    const { data, error } = await supabase
      .from("coupons")
      .select("id,code,coupon_type,discount_value,min_order_value,usage_limit,used_count,start_at,end_at,active")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Failed to load coupons: ${error.message}`);
      return false;
    }

    const rows = (data ?? []) as AdminCouponRow[];
    setCoupons(rows.map(mapBackendCouponToAdminCoupon));
    return true;
  }, [supabase]);

  const refreshOrdersAndAnalytics = useCallback(async () => {
    if (!supabase) return false;
    setOrdersLoading(true);

    try {
      const payload = await fetchAdminOrdersPayload(supabase, 120);
      setOrders(payload.orders ?? []);
      setAnalytics(payload.analytics ?? null);
      return true;
    } catch (error) {
      const text = error instanceof Error ? error.message : String(error);
      setMessage(`Failed to load orders: ${text}`);
      setOrders([]);
      setAnalytics(null);
      return false;
    } finally {
      setOrdersLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;

    let active = true;

    const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

    const bootstrap = async () => {
      const slowTimer = window.setTimeout(() => {
        if (!active) return;
        setSessionCheckSlow(true);
      }, 4500);

      try {
        setSessionCheckSlow(false);
        let resolvedSession = null as Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"] | null;
        let lastError: Error | null = null;
        const retryDelays = [0, 350, 900];

        for (const delay of retryDelays) {
          if (!active) return;
          if (delay > 0) {
            await sleep(delay);
          }

          const { data, error } = await supabase.auth.getSession();
          if (error) {
            lastError = error;
            continue;
          }
          if (data.session) {
            resolvedSession = data.session;
            break;
          }
        }

        if (!active) return;
        if (!resolvedSession) {
          if (lastError) {
            setMessage(`Could not restore admin session: ${lastError.message}`);
          }
          setShouldRedirectToLogin(true);
          return;
        }

        setShouldRedirectToLogin(false);
        setSessionReady(true);

        const results = await Promise.allSettled([
          refreshProductCategoryMap(),
          refreshProducts(),
          refreshCoupons(),
          refreshOrdersAndAnalytics(),
        ]);

        if (!active) return;
        const failedLoads = results.filter((result) => result.status === "rejected").length;
        if (failedLoads > 0) {
          setMessage("Some dashboard data is delayed. Please refresh once network stabilizes.");
        }
      } catch (error) {
        if (!active) return;
        const text = error instanceof Error ? error.message : String(error);
        setMessage(`Failed to check admin session: ${text}`);
      } finally {
        window.clearTimeout(slowTimer);
      }
    };

    bootstrap();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      if (!nextSession) {
        setShouldRedirectToLogin(true);
      } else {
        setShouldRedirectToLogin(false);
        setSessionReady(true);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase, refreshProductCategoryMap, refreshProducts, refreshCoupons, refreshOrdersAndAnalytics]);

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
      (order.phone ?? "").toLowerCase().includes(query) ||
      (order.email ?? "").toLowerCase().includes(query);
    return statusMatch && searchMatch;
  });
  const hasMoreVisibleOrders = visibleOrderCount < visibleOrders.length;
  const renderedOrders = visibleOrders.slice(0, visibleOrderCount);

  useEffect(() => {
    setVisibleOrderCount(ORDERS_PAGE_SIZE);
    if (ordersScrollRef.current) {
      ordersScrollRef.current.scrollTop = 0;
    }
  }, [orderFilter, orderSearch, ordersLoading, visibleOrders.length]);

  const revenue =
    analytics?.kpis.totalRevenue ??
    orders
      .filter((order) => order.paymentStatus.toUpperCase() === "PAID")
      .reduce((sum, order) => sum + order.total, 0);
  const activeOfferProducts = products.filter(
    (product) => product.active && product.offerType !== "NONE"
  );
  const filteredProducts = useMemo(
    () =>
      products
        .filter((product) =>
          productCategoryFilter === "ALL" || product.categorySlugs.includes(productCategoryFilter)
        )
        .filter((product) => fuzzyMatches(`${product.name} ${product.slug} ${product.category}`, productSearch))
        .sort(
          (left, right) =>
            right.displayRank - left.displayRank ||
            left.category.localeCompare(right.category) ||
            left.name.localeCompare(right.name)
        ),
    [products, productCategoryFilter, productSearch]
  );
  const renderedProducts = filteredProducts.slice(0, visibleProductCount);

  useEffect(() => {
    setVisibleProductCount(PRODUCTS_PAGE_SIZE);
  }, [productSearch, productCategoryFilter]);

  const updateOrderStatus = async (orderId: number, status: OrderStatus) => {
    if (!supabase) return;
    setUpdatingOrderId(orderId);

    try {
      const updated = await updateAdminOrderStatus(supabase, orderId, status);
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, status: updated.status } : order))
      );
      setMessage(`Order #${orderId} marked as ${updated.status}.`);
    } catch (error) {
      const text = error instanceof Error ? error.message : String(error);
      setMessage(`Failed to update order #${orderId}: ${text}`);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const createProduct = async () => {
    if (!supabase) return;

    setMessage(null);
    const price = Number(newProduct.price);
    const normalizedSlug = normalizeProductSlug(newProduct.slug, newProduct.name);
    if (!newProduct.name || !normalizedSlug || !Number.isFinite(price)) {
      setMessage("Product name, slug, and price are required.");
      return;
    }
    const categoryId = categorySlugToId[newProduct.category];
    if (!categoryId) {
      setMessage("Selected category is not configured yet. Refresh after applying latest migration.");
      return;
    }
    if (newProduct.buyLink.trim()) {
      try {
        const parsed = new URL(newProduct.buyLink.trim());
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          setMessage("Buy link must start with http:// or https://");
          return;
        }
      } catch {
        setMessage("Buy link must be a valid URL.");
        return;
      }
    }

    const productName = newProduct.name;
    const imageUrls = newProduct.imageUrls
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, MAX_PRODUCT_IMAGE_URLS);
    const { error } = await supabase.functions.invoke("admin-products", {
      method: "POST",
      body: {
        action: editingProductId ? "update" : "create",
        product: {
          ...(editingProductId ? { id: editingProductId } : {}),
          name: newProduct.name,
          slug: normalizedSlug,
          price,
          buy_link: newProduct.buyLink.trim() || null,
          images: imageUrls,
          category_ids: [categoryId],
        },
      },
    });

    if (error) {
      setMessage(await extractFunctionErrorMessage(error as { message?: string; context?: Response }));
      return;
    }

    cancelEditingProduct();
    setMessage(`Product ${productName} ${editingProductId ? "updated" : "created"}.`);
    await refreshProducts();
  };

  const removeProduct = async (productId: number) => {
    if (!supabase) return;

    setMessage(null);
    const { error } = await supabase.functions.invoke("admin-products", {
      method: "POST",
      body: { action: "delete", product: { id: productId } },
    });
    if (error) {
      const details = await extractFunctionErrorMessage(error as { message?: string; context?: Response });
      setMessage(`Failed deleting product #${productId}: ${details}`);
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
      setMessage(await extractFunctionErrorMessage(error as { message?: string; context?: Response }));
      return;
    }

    await refreshProducts();
  };

  const beginEditingProduct = (product: AdminProduct) => {
    const category = product.categorySlugs.find((slug): slug is ProductCategorySlug =>
      (PRODUCT_CATEGORY_OPTIONS.map((option) => option.slug) as readonly string[]).includes(slug)
    );
    setEditingProductId(product.id);
    setNewProduct({
      name: product.name,
      slug: product.slug,
      price: String(product.price),
      category: category ?? DEFAULT_PRODUCT_CATEGORY,
      stock: String(product.stock),
      buyLink: product.buyLink ?? "",
      imageUrls: Array.from(
        { length: MAX_PRODUCT_IMAGE_URLS },
        (_, index) => product.imageUrls[index] ?? ""
      ),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEditingProduct = () => {
    setEditingProductId(null);
    setNewProduct({
      name: "", slug: "", price: "", category: DEFAULT_PRODUCT_CATEGORY, stock: "", buyLink: "",
      imageUrls: Array.from({ length: MAX_PRODUCT_IMAGE_URLS }, () => ""),
    });
  };

  const moveProductHigher = async (product: AdminProduct) => {
    if (!supabase || savingProductId !== null) return;
    const categoryProducts = filteredProducts.filter((item) => item.categorySlugs.some((slug) => product.categorySlugs.includes(slug)));
    const index = categoryProducts.findIndex((item) => item.id === product.id);
    if (index <= 0) return;

    const higherProduct = categoryProducts[index - 1];
    setSavingProductId(product.id);
    setProducts((current) =>
      current.map((item) => {
        if (item.id === product.id) return { ...item, displayRank: higherProduct.displayRank + 1 };
        if (item.id === higherProduct.id) return { ...item, displayRank: product.displayRank };
        return item;
      })
    );

    const results = await Promise.all([
      supabase.functions.invoke("admin-products", {
        method: "POST", body: { action: "update", product: { id: product.id, display_rank: higherProduct.displayRank + 1 } },
      }),
      supabase.functions.invoke("admin-products", {
        method: "POST", body: { action: "update", product: { id: higherProduct.id, display_rank: product.displayRank } },
      }),
    ]);
    const failed = results.find((result) => result.error)?.error;
    if (failed) {
      setMessage(`Could not update display order: ${await extractFunctionErrorMessage(failed as { message?: string; context?: Response })}`);
    } else {
      setMessage(`${product.name} moved higher in ${product.category}.`);
    }
    setSavingProductId(null);
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
            discount_percent:
              normalizedType === "BUY_X_GET_Y" || normalizedType === "QTY_TIER_30_40" ? null : value,
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
      setMessage(await extractFunctionErrorMessage(error as { message?: string; context?: Response }));
      return;
    }

    setMessage(`Offer removed from product #${productId}.`);
    await refreshProducts();
  };

  const createCoupon = async () => {
    if (!supabase) return;

    const value = parseFlexibleNumber(newCoupon.value);
    const minOrder = parseFlexibleNumber(newCoupon.minOrder);
    const usageLimit = parseFlexibleNumber(newCoupon.usageLimit);
    if (!newCoupon.code.trim() || value === null || minOrder === null || usageLimit === null) {
      setMessage("Coupon code, value, min order, and usage limit are required.");
      return;
    }

    if (newCoupon.type === "PERCENT" && (value <= 0 || value > 100)) {
      setMessage("Percent coupon requires value between 1 and 100.");
      return;
    }

    if (newCoupon.type === "FIXED" && value <= 0) {
      setMessage("Fixed coupon requires amount greater than 0.");
      return;
    }

    if (minOrder < 0) {
      setMessage("Minimum order must be 0 or greater.");
      return;
    }

    if (usageLimit <= 0) {
      setMessage("Usage limit must be greater than 0.");
      return;
    }

    let startAt: string | null = null;
    let endAt: string | null = null;
    try {
      startAt = toIsoDateTimeOrNull(newCoupon.startAt);
      endAt = toIsoDateTimeOrNull(newCoupon.endAt);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
      return;
    }

    if (startAt && endAt && new Date(startAt) > new Date(endAt)) {
      setMessage("Coupon end date/time must be after start date/time.");
      return;
    }

    const payload = {
      code: newCoupon.code.trim().toUpperCase(),
      coupon_type: newCoupon.type,
      discount_value: value,
      min_order_value: minOrder,
      usage_limit: Math.floor(usageLimit),
      used_count: 0,
      start_at: startAt,
      end_at: endAt,
      active: true,
    };

    const { data, error } = await supabase
      .from("coupons")
      .insert(payload)
      .select("id,code,coupon_type,discount_value,min_order_value,usage_limit,used_count,start_at,end_at,active")
      .single();

    if (error) {
      setMessage(`Failed creating coupon: ${error.message}`);
      return;
    }

    const createdCode = ((data as { code?: string } | null)?.code ?? newCoupon.code).toUpperCase();
    setNewCoupon({ code: "", type: "PERCENT", value: "", minOrder: "", usageLimit: "", startAt: "", endAt: "" });
    await refreshCoupons();
    setMessage(`Coupon ${createdCode} created.`);
  };

  const toggleCouponActive = async (couponId: number) => {
    if (!supabase) return;
    const existingCoupon = coupons.find((coupon) => coupon.id === couponId);
    if (!existingCoupon) return;

    const { error } = await supabase
      .from("coupons")
      .update({ active: !existingCoupon.active })
      .eq("id", couponId);

    if (error) {
      setMessage(`Failed updating coupon: ${error.message}`);
      return;
    }

    await refreshCoupons();
  };

  const removeCoupon = async (couponId: number) => {
    if (!supabase) return;

    const { error } = await supabase.from("coupons").delete().eq("id", couponId);

    if (error) {
      setMessage(`Failed removing coupon: ${error.message}`);
      return;
    }

    await refreshCoupons();
    setMessage(`Coupon #${couponId} removed.`);
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  if (!sessionReady) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#0f0d0a] px-6 py-10 text-[#f3ebdd]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(183,145,96,0.22),transparent_42%),radial-gradient(circle_at_86%_8%,rgba(68,122,90,0.18),transparent_38%),linear-gradient(160deg,#14110d_0%,#0f0d0a_58%,#17130e_100%)]" />
        <div className="relative mx-auto flex min-h-[78vh] max-w-2xl flex-col items-center justify-center text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#c8b08f]">Admin Console</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
            {shouldRedirectToLogin ? "Redirecting to Sign In" : "Loading Dashboard"}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-[#d8cab4]">
            {shouldRedirectToLogin
              ? "Session is missing or expired. We are taking you to the secure admin login."
              : sessionCheckSlow
              ? "Connection is slower than usual. Your session is still being restored."
              : "Validating credentials and syncing live operations data."}
          </p>

          <div className="mt-9 flex items-center gap-4">
            <span className="h-11 w-11 animate-spin rounded-full border-2 border-[#b99668]/40 border-t-[#dfc49e]" />
            <div className="flex gap-2">
              <span className="h-2 w-2 animate-bounce rounded-full bg-[#d6bc98] [animation-delay:-0.2s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-[#d6bc98] [animation-delay:-0.1s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-[#d6bc98]" />
            </div>
          </div>

          <div className="mt-10 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-[#3a2f23]/75">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-[#b48b59] via-[#e0c49c] to-[#b48b59]" />
          </div>

          <div className="mt-8">
            <Link
              href={adminLoginUrl}
              className="rounded-full border border-[#8d7356] px-5 py-2 text-sm font-semibold text-[#f4e8d6] transition hover:border-[#c4a27a] hover:bg-[#2a2118]"
            >
              Go to admin login
            </Link>
          </div>

          {message ? (
            <p className="mt-5 rounded-xl border border-[#6d4d35] bg-[#2a1d14]/80 px-4 py-3 text-xs text-[#ffd7bd]">{message}</p>
          ) : null}
        </div>
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
            <Link
              href="/admin/user-analytics"
              className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm font-semibold text-[#333333]"
            >
              User analytics
            </Link>
            <button
              onClick={signOut}
              className="rounded-full bg-[#1f140d] px-4 py-2 text-sm font-semibold text-white"
            >
              Sign out
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-6">
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
          <article className="rounded-2xl border border-[#e2e2e2] bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-[#555555]">Unique Customers</p>
            <p className="mt-2 text-2xl font-semibold text-[#1f140d]">{analytics?.kpis.uniqueCustomers ?? 0}</p>
          </article>
          <article className="rounded-2xl border border-[#e2e2e2] bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-[#555555]">Registered Users</p>
            <p className="mt-2 text-2xl font-semibold text-[#1f140d]">{analytics?.kpis.registeredUsers ?? 0}</p>
          </article>
        </section>

        <section className="rounded-3xl border border-[#e2e2e2] bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-[#1f140d]">Orders</h2>
            <div className="flex flex-wrap gap-2">
              <input
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search by customer, phone, email, order id"
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

          <div
            ref={ordersScrollRef}
            className="mt-4 max-h-[72vh] space-y-3 overflow-y-auto pr-1"
            onScroll={(event) => {
              if (!hasMoreVisibleOrders || ordersLoading) return;

              const node = event.currentTarget;
              const isNearBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 120;
              if (!isNearBottom) return;

              setVisibleOrderCount((current) =>
                Math.min(current + ORDERS_PAGE_SIZE, visibleOrders.length)
              );
            }}
          >
            {ordersLoading ? (
              <p className="text-sm text-[#555555]">Loading live orders...</p>
            ) : null}

            {!ordersLoading && !visibleOrders.length ? (
              <p className="rounded-2xl border border-dashed border-[#d8d8d8] bg-[#fafafa] p-4 text-sm text-[#555555]">
                No orders found for the current filters.
              </p>
            ) : null}

            {renderedOrders.map((order) => (
              <article key={order.id} className="rounded-2xl border border-[#e7e7e7] bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#1f140d]">Order #{order.id}</p>
                    <p className="text-sm text-[#333333]">
                      {order.customerName} · {order.phone ?? "No phone"} · {order.itemCount} items
                    </p>
                    <p className="text-xs text-[#555555]">{order.email ?? "No email captured"}</p>
                    <p className="text-xs text-[#555555]">{new Date(order.createdAt).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#f6efe8] px-3 py-1 text-sm font-semibold text-[#333333]">
                      {formatINR(order.total)}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        order.paymentStatus.toUpperCase() === "PAID"
                          ? "bg-[#e8f6ea] text-[#1f7a34]"
                          : "bg-[#fff3e2] text-[#996100]"
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                    <select
                      value={order.status}
                      onChange={(e) => {
                        void updateOrderStatus(order.id, e.target.value as OrderStatus);
                      }}
                      disabled={updatingOrderId === order.id}
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

                <div className="mt-3 grid gap-3 text-sm text-[#444444] md:grid-cols-[1.4fr_1fr]">
                  <div className="rounded-xl border border-[#efefef] bg-[#fafafa] p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#6a6a6a]">Items</p>
                    <div className="mt-2 space-y-1">
                      {order.items.map((item) => (
                        <p key={item.id}>
                          {item.productName} x {item.qty} · {formatINR(item.itemTotal || item.finalPrice)}
                          {item.freeQty > 0 ? ` (+${item.freeQty} free)` : ""}
                        </p>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-[#666666]">
                      Subtotal {formatINR(order.subTotal)} · Discount {formatINR(order.discountTotal)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#efefef] bg-[#fafafa] p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#6a6a6a]">Shipping</p>
                    <p className="mt-2">
                      {order.shippingAddress?.line1 ?? "Address not captured"}
                    </p>
                    <p className="text-xs text-[#666666]">
                      {[order.shippingAddress?.city, order.shippingAddress?.state, order.shippingAddress?.pincode]
                        .filter(Boolean)
                        .join(", ") || "City/State unavailable"}
                    </p>
                  </div>
                </div>
              </article>
            ))}

            {!ordersLoading && hasMoreVisibleOrders ? (
              <div className="rounded-2xl border border-dashed border-[#d8d8d8] bg-[#fafafa] p-3 text-center text-xs text-[#666666]">
                Scroll down to load more orders ({renderedOrders.length}/{visibleOrders.length})
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-3xl border border-[#e2e2e2] bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[#1f140d]">User Analytics</h2>
              <p className="text-sm text-[#555555]">Quick snapshot from live order data.</p>
            </div>
            <Link
              href="/admin/user-analytics"
              className="rounded-full bg-[#1f140d] px-4 py-2 text-sm font-semibold text-white"
            >
              Open full analytics
            </Link>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-6">
            <article className="rounded-2xl border border-[#e7e7e7] bg-[#fafafa] p-4">
              <p className="text-xs uppercase tracking-wide text-[#666666]">Paid Orders</p>
              <p className="mt-2 text-xl font-semibold text-[#1f140d]">{analytics?.kpis.paidOrders ?? 0}</p>
            </article>
            <article className="rounded-2xl border border-[#e7e7e7] bg-[#fafafa] p-4">
              <p className="text-xs uppercase tracking-wide text-[#666666]">Pending Payments</p>
              <p className="mt-2 text-xl font-semibold text-[#1f140d]">{analytics?.kpis.pendingPaymentOrders ?? 0}</p>
            </article>
            <article className="rounded-2xl border border-[#e7e7e7] bg-[#fafafa] p-4">
              <p className="text-xs uppercase tracking-wide text-[#666666]">Repeat Customers</p>
              <p className="mt-2 text-xl font-semibold text-[#1f140d]">{analytics?.kpis.repeatCustomers ?? 0}</p>
            </article>
            <article className="rounded-2xl border border-[#e7e7e7] bg-[#fafafa] p-4">
              <p className="text-xs uppercase tracking-wide text-[#666666]">Avg Order Value</p>
              <p className="mt-2 text-xl font-semibold text-[#1f140d]">
                {formatINR(analytics?.kpis.avgOrderValue ?? 0)}
              </p>
            </article>
            <article className="rounded-2xl border border-[#e7e7e7] bg-[#fafafa] p-4">
              <p className="text-xs uppercase tracking-wide text-[#666666]">Website Clicks</p>
              <p className="mt-2 text-xl font-semibold text-[#1f140d]">{analytics?.kpis.websiteClicks ?? 0}</p>
            </article>
            <article className="rounded-2xl border border-[#e7e7e7] bg-[#fafafa] p-4">
              <p className="text-xs uppercase tracking-wide text-[#666666]">Unique Visitors (30d)</p>
              <p className="mt-2 text-xl font-semibold text-[#1f140d]">
                {analytics?.kpis.websiteUniqueVisitorsLast30Days ?? 0}
              </p>
            </article>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-[#e2e2e2] bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-semibold text-[#1f140d]">{editingProductId ? "Edit product" : "Add product"}</h2>
                <p className="mt-1 text-xs text-[#666666]">
                  {editingProductId ? "Update the details below, then save your changes." : "Create a product and assign its category."}
                </p>
              </div>
              {editingProductId ? (
                <button type="button" onClick={cancelEditingProduct} className="rounded-full border border-[#d0d0d0] px-3 py-1.5 text-xs font-semibold text-[#333333]">
                  Cancel edit
                </button>
              ) : null}
            </div>
            {editingProductId ? (
              <div className="mt-4 overflow-hidden rounded-2xl border border-[#e4d7cc] bg-[linear-gradient(145deg,#fffdfb,#f7efe9)] p-3">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#76533d]">Live storefront preview</p>
                <div className="flex items-center gap-4">
                  <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-xl bg-white shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={newProduct.imageUrls.find((url) => url.trim()) || "/sfanelogo.png"}
                      alt={newProduct.name || "Product preview"}
                      className="h-full w-full object-contain p-2"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-2 font-semibold text-[#1f140d]">{newProduct.name || "Product name"}</p>
                    <p className="mt-1 text-sm font-semibold text-[#1f140d]">
                      {newProduct.price ? formatINR(Number(newProduct.price) || 0) : "Add a price"}
                    </p>
                    <p className="mt-1 text-xs text-[#76533d]">
                      {PRODUCT_CATEGORY_OPTIONS.find((option) => option.slug === newProduct.category)?.label} · Image updates live as you edit
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct((prev) => {
                    const name = e.target.value;
                    return {
                      ...prev,
                      name,
                      slug: prev.slug ? prev.slug : normalizeProductSlug("", name),
                    };
                  })
                }
                placeholder="Product name"
                className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
              />
              <input
                value={newProduct.slug}
                onChange={(e) =>
                  setNewProduct((prev) => ({ ...prev, slug: normalizeProductSlug(e.target.value) }))
                }
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
              <select
                value={newProduct.category}
                onChange={(e) =>
                  setNewProduct((prev) => ({ ...prev, category: e.target.value as ProductCategorySlug }))
                }
                className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
              >
                {PRODUCT_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.slug} value={option.slug}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                value={newProduct.buyLink}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, buyLink: e.target.value }))}
                placeholder="Buy link URL (https://...)"
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
              type="button"
              onClick={createProduct}
              className="mt-4 rounded-full bg-[#1f140d] px-4 py-2 text-sm font-semibold text-white"
            >
              {editingProductId ? "Save changes" : "Add product"}
            </button>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-[#e7e7e7] bg-[#fafafa] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[#1f140d]">Catalog ({filteredProducts.length})</p>
                    <p className="text-xs text-[#666666]">Sorted by category and display rank. Showing {renderedProducts.length} at a time.</p>
                  </div>
                  <select
                    value={productCategoryFilter}
                    onChange={(event) => setProductCategoryFilter(event.target.value as "ALL" | ProductCategorySlug)}
                    className="rounded-full border border-[#d0d0d0] bg-white px-3 py-2 text-xs"
                  >
                    <option value="ALL">All categories</option>
                    {PRODUCT_CATEGORY_OPTIONS.map((option) => <option key={option.slug} value={option.slug}>{option.label}</option>)}
                  </select>
                </div>
                <input
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  placeholder="Search products (partial names work too)"
                  className="mt-3 w-full rounded-full border border-[#d0d0d0] bg-white px-4 py-2 text-sm"
                />
              </div>
              {renderedProducts.map((product, index) => (
                <div key={product.id} className="rounded-2xl border border-[#e7e7e7] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#eee2d8] bg-[#faf6f2]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={product.imageUrl} alt="" className="h-full w-full object-contain p-1.5" />
                      </div>
                      <div className="min-w-0">
                      <p className="line-clamp-2 font-semibold text-[#1f140d]">{product.name}</p>
                      <p className="text-sm text-[#333333]">
                        {formatINR(product.price)} · {product.category} · {product.active ? "Active" : "Inactive"}
                      </p>
                      {product.buyLink ? (
                        <a
                          href={product.buyLink}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-xs font-medium text-[#0c6f8f] underline"
                        >
                          Buy link
                        </a>
                      ) : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void moveProductHigher(product)}
                        disabled={savingProductId !== null || index === 0}
                        title="Move higher within this category"
                        className="rounded-full border border-[#d0d0d0] px-3 py-1 text-xs font-semibold text-[#333333] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ↑ Move up
                      </button>
                      <button
                        type="button"
                        onClick={() => beginEditingProduct(product)}
                        className="rounded-full border border-[#d0d0d0] px-3 py-1 text-xs font-semibold text-[#333333]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleProductActive(product.id)}
                        className="rounded-full border border-[#d0d0d0] px-3 py-1 text-xs font-semibold text-[#333333]"
                      >
                        {product.active ? "Disable" : "Enable"}
                      </button>
                      <button
                        type="button"
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
                        : product.offerType === "QTY_TIER_30_40"
                          ? "30% off (qty > 2) · 40% off (qty > 3)"
                        : `${product.offerType} ${product.discountValue ?? 0}`}
                    </p>
                  ) : null}
                </div>
              ))}
              {!renderedProducts.length ? (
                <p className="rounded-2xl border border-dashed border-[#d8d8d8] p-4 text-sm text-[#666666]">No products match this search.</p>
              ) : null}
              {renderedProducts.length < filteredProducts.length ? (
                <button
                  type="button"
                  onClick={() => setVisibleProductCount((current) => current + PRODUCTS_PAGE_SIZE)}
                  className="w-full rounded-full border border-[#d0d0d0] px-4 py-2 text-sm font-semibold text-[#333333]"
                >
                  Show more products ({renderedProducts.length}/{filteredProducts.length})
                </button>
              ) : null}
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
                <option value="QTY_TIER_30_40">Qty Tier 30/40</option>
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
              ) : newOffer.type === "QTY_TIER_30_40" ? (
                <p className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm text-[#555555]">
                  Auto rule: 30% off when qty &gt; 2, 40% off when qty &gt; 3.
                </p>
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
                          : product.offerType === "QTY_TIER_30_40"
                            ? "QTY_TIER_30_40 · 30% (qty > 2), 40% (qty > 3)"
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
