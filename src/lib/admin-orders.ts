import type { SupabaseClient } from "@supabase/supabase-js";

export type OrderStatus = "CREATED" | "PAID" | "PACKED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export type AdminOrderItem = {
  id: number;
  productName: string;
  qty: number;
  finalPrice: number;
  itemTotal: number;
  freeQty: number;
};

export type AdminOrder = {
  id: number;
  userId: string;
  customerName: string;
  phone: string | null;
  email: string | null;
  itemCount: number;
  total: number;
  subTotal: number;
  discountTotal: number;
  paymentStatus: string;
  status: OrderStatus;
  createdAt: string;
  shippingAddress: {
    line1?: string;
    city?: string;
    state?: string;
    pincode?: string;
  } | null;
  items: AdminOrderItem[];
};

export type AnalyticsDailyPoint = {
  date: string;
  orders: number;
  revenue: number;
};

export type AnalyticsBreakdownPoint = {
  status: string;
  count: number;
};

export type AnalyticsTopCustomer = {
  user_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  order_count: number;
  paid_order_count: number;
  total_spend: number;
  avg_order_value: number;
  last_order_at: string;
};

export type AdminUserAnalytics = {
  kpis: {
    totalOrders: number;
    paidOrders: number;
    pendingPaymentOrders: number;
    uniqueCustomers: number;
    registeredUsers: number;
    websiteClicks: number;
    websiteClicksLast30Days: number;
    websiteUniqueVisitorsLast30Days: number;
    repeatCustomers: number;
    totalRevenue: number;
    avgOrderValue: number;
  };
  trends: {
    daily: AnalyticsDailyPoint[];
    statusBreakdown: AnalyticsBreakdownPoint[];
    paymentBreakdown: AnalyticsBreakdownPoint[];
  };
  topCustomers: AnalyticsTopCustomer[];
};

export type AdminOrdersPayload = {
  orders: AdminOrder[];
  analytics: AdminUserAnalytics;
  generated_at: string;
};

const FUNCTION_TIMEOUT_MS = 15000;

function getFunctionBaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing Supabase env vars");
  }

  return {
    functionsUrl: `${url}/functions/v1`,
    anonKey,
  };
}

async function getAccessToken(supabase: SupabaseClient) {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(error.message);
  }

  const accessToken = data.session?.access_token;
  if (!accessToken) {
    throw new Error("Missing admin session access token");
  }

  return accessToken;
}

async function readErrorBody(response: Response) {
  const text = await response.text().catch(() => "");
  if (!text) return `Request failed (${response.status})`;

  try {
    const parsed = JSON.parse(text) as { error?: string; message?: string };
    return parsed.error ?? parsed.message ?? text;
  } catch {
    return text;
  }
}

async function callAdminOrdersFunction<T>(
  supabase: SupabaseClient,
  init: RequestInit,
  search = ""
): Promise<T> {
  const { functionsUrl, anonKey } = getFunctionBaseUrl();
  const accessToken = await getAccessToken(supabase);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FUNCTION_TIMEOUT_MS);

  try {
    const response = await fetch(`${functionsUrl}/admin-orders${search}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: anonKey,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(await readErrorBody(response));
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Admin analytics request timed out. Check Supabase function deployment/logs.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchAdminOrdersPayload(
  supabase: SupabaseClient,
  limit = 80
): Promise<AdminOrdersPayload> {
  const safeLimit = Number.isFinite(limit) ? Math.max(20, Math.min(250, Math.round(limit))) : 80;
  const payload = (await callAdminOrdersFunction<Partial<AdminOrdersPayload>>(
    supabase,
    { method: "GET" },
    `?limit=${safeLimit}`
  )) as Partial<AdminOrdersPayload>;

  return {
    orders: payload.orders ?? [],
    analytics:
      payload.analytics ??
      {
        kpis: {
          totalOrders: 0,
          paidOrders: 0,
          pendingPaymentOrders: 0,
          uniqueCustomers: 0,
          registeredUsers: 0,
          websiteClicks: 0,
          websiteClicksLast30Days: 0,
          websiteUniqueVisitorsLast30Days: 0,
          repeatCustomers: 0,
          totalRevenue: 0,
          avgOrderValue: 0,
        },
        trends: {
          daily: [],
          statusBreakdown: [],
          paymentBreakdown: [],
        },
        topCustomers: [],
      },
    generated_at: payload.generated_at ?? new Date().toISOString(),
  };
}

export async function updateAdminOrderStatus(
  supabase: SupabaseClient,
  orderId: number,
  status: OrderStatus
): Promise<{ id: number; status: OrderStatus; payment_status: string | null }> {
  const data = await callAdminOrdersFunction<{ updated_order: { id: number; status: OrderStatus; payment_status: string | null } }>(
    supabase,
    {
      method: "POST",
      body: JSON.stringify({
        action: "update-order-status",
        order_id: orderId,
        status,
      }),
    }
  );

  return data.updated_order;
}

export function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}
