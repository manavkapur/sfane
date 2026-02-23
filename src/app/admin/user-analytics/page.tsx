"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  fetchAdminOrdersPayload,
  formatINR,
  type AdminUserAnalytics,
  type AnalyticsBreakdownPoint,
  type AnalyticsDailyPoint,
} from "@/lib/admin-orders";

function maxFrom(values: number[]) {
  if (!values.length) return 1;
  return Math.max(1, ...values);
}

function ordersPath(points: AnalyticsDailyPoint[], width: number, height: number) {
  if (!points.length) return "";
  const maxY = maxFrom(points.map((point) => point.orders));

  return points
    .map((point, index) => {
      const x = (index / Math.max(1, points.length - 1)) * width;
      const y = height - (point.orders / maxY) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function revenuePath(points: AnalyticsDailyPoint[], width: number, height: number) {
  if (!points.length) return "";
  const maxY = maxFrom(points.map((point) => point.revenue));

  return points
    .map((point, index) => {
      const x = (index / Math.max(1, points.length - 1)) * width;
      const y = height - (point.revenue / maxY) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ").toLowerCase();
}

function BreakdownBars({ title, rows }: { title: string; rows: AnalyticsBreakdownPoint[] }) {
  const maxCount = maxFrom(rows.map((row) => row.count));

  return (
    <article className="rounded-3xl border border-[#e2e2e2] bg-white p-6">
      <h3 className="text-lg font-semibold text-[#1f140d]">{title}</h3>
      <div className="mt-4 space-y-3">
        {rows.map((row) => {
          const width = (row.count / maxCount) * 100;
          return (
            <div key={`${title}-${row.status}`}>
              <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-[#666666]">
                <span>{statusLabel(row.status)}</span>
                <span>{row.count}</span>
              </div>
              <div className="h-2 rounded-full bg-[#efefef]">
                <div className="h-2 rounded-full bg-[#1f140d]" style={{ width: `${Math.max(width, 4)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

export default function AdminUserAnalyticsPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [analytics, setAnalytics] = useState<AdminUserAnalytics | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    const bootstrap = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!active) return;

        if (!sessionData.session) {
          router.replace("/admin/login");
          return;
        }

        const payload = await fetchAdminOrdersPayload(supabase, 220);
        if (!active) return;

        setAnalytics(payload.analytics ?? null);
      } catch (error) {
        if (!active) return;
        const text = error instanceof Error ? error.message : String(error);
        setMessage(`Failed to load analytics: ${text}`);
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, [supabase, router]);

  if (!supabase) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <p className="rounded-2xl border border-dashed border-[#d8c2b1] bg-white p-6 text-sm text-[#5b4739]">
          Missing Supabase env vars.
        </p>
      </main>
    );
  }

  const daily = analytics?.trends.daily ?? [];
  const orderTrendPath = ordersPath(daily, 640, 180);
  const revenueTrendPath = revenuePath(daily, 640, 180);

  return (
    <main className="min-h-screen bg-white px-6 pb-16 pt-10 text-[#111111]">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[#e2e2e2] bg-white px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#555555]">Admin analytics</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1f140d]">User Analytics Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/cms" className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm font-semibold text-[#333333]">
              Back to CMS
            </Link>
          </div>
        </header>

        {loading ? <p className="text-sm text-[#555555]">Loading analytics...</p> : null}
        {message ? <p className="text-sm text-[#9f2626]">{message}</p> : null}

        {!loading && analytics ? (
          <>
            <section className="grid gap-4 md:grid-cols-6">
              <article className="rounded-2xl border border-[#e2e2e2] bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-[#555555]">Total Revenue</p>
                <p className="mt-2 text-2xl font-semibold text-[#1f140d]">{formatINR(analytics.kpis.totalRevenue)}</p>
              </article>
              <article className="rounded-2xl border border-[#e2e2e2] bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-[#555555]">Registered Users</p>
                <p className="mt-2 text-2xl font-semibold text-[#1f140d]">{analytics.kpis.registeredUsers}</p>
              </article>
              <article className="rounded-2xl border border-[#e2e2e2] bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-[#555555]">Unique Customers</p>
                <p className="mt-2 text-2xl font-semibold text-[#1f140d]">{analytics.kpis.uniqueCustomers}</p>
              </article>
              <article className="rounded-2xl border border-[#e2e2e2] bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-[#555555]">Repeat Customers</p>
                <p className="mt-2 text-2xl font-semibold text-[#1f140d]">{analytics.kpis.repeatCustomers}</p>
              </article>
              <article className="rounded-2xl border border-[#e2e2e2] bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-[#555555]">Avg Order Value</p>
                <p className="mt-2 text-2xl font-semibold text-[#1f140d]">{formatINR(analytics.kpis.avgOrderValue)}</p>
              </article>
              <article className="rounded-2xl border border-[#e2e2e2] bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-[#555555]">Website Clicks</p>
                <p className="mt-2 text-2xl font-semibold text-[#1f140d]">{analytics.kpis.websiteClicks}</p>
                <p className="mt-1 text-xs text-[#666666]">Page views tracked from live site traffic.</p>
              </article>
              <article className="rounded-2xl border border-[#e2e2e2] bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-[#555555]">Visitors (30d)</p>
                <p className="mt-2 text-2xl font-semibold text-[#1f140d]">
                  {analytics.kpis.websiteUniqueVisitorsLast30Days}
                </p>
                <p className="mt-1 text-xs text-[#666666]">{analytics.kpis.websiteClicksLast30Days} clicks in last 30d.</p>
              </article>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <article className="rounded-3xl border border-[#e2e2e2] bg-white p-6">
                <h2 className="text-xl font-semibold text-[#1f140d]">Orders Trend (Last 30 Days)</h2>
                <div className="mt-4 overflow-x-auto">
                  <svg viewBox="0 0 640 190" className="h-[220px] w-full min-w-[640px]">
                    <line x1="0" y1="180" x2="640" y2="180" stroke="#d9d9d9" strokeWidth="1" />
                    <path d={orderTrendPath} fill="none" stroke="#1f140d" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </div>
              </article>

              <article className="rounded-3xl border border-[#e2e2e2] bg-white p-6">
                <h2 className="text-xl font-semibold text-[#1f140d]">Revenue Trend (Last 30 Days)</h2>
                <div className="mt-4 overflow-x-auto">
                  <svg viewBox="0 0 640 190" className="h-[220px] w-full min-w-[640px]">
                    <line x1="0" y1="180" x2="640" y2="180" stroke="#d9d9d9" strokeWidth="1" />
                    <path d={revenueTrendPath} fill="none" stroke="#9b5938" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </div>
              </article>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <BreakdownBars title="Order Status Mix" rows={analytics.trends.statusBreakdown} />
              <BreakdownBars title="Payment Status Mix" rows={analytics.trends.paymentBreakdown} />
            </section>

            <section className="rounded-3xl border border-[#e2e2e2] bg-white p-6">
              <h2 className="text-xl font-semibold text-[#1f140d]">Top Users by Spend</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#ececec] text-xs uppercase tracking-wide text-[#666666]">
                      <th className="px-3 py-2 font-semibold">User</th>
                      <th className="px-3 py-2 font-semibold">Contact</th>
                      <th className="px-3 py-2 font-semibold">Orders</th>
                      <th className="px-3 py-2 font-semibold">Paid Orders</th>
                      <th className="px-3 py-2 font-semibold">Total Spend</th>
                      <th className="px-3 py-2 font-semibold">AOV</th>
                      <th className="px-3 py-2 font-semibold">Last Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topCustomers.map((customer) => (
                      <tr key={customer.user_id} className="border-b border-[#f1f1f1] text-[#2d2d2d]">
                        <td className="px-3 py-3 font-medium">{customer.name}</td>
                        <td className="px-3 py-3 text-xs text-[#555555]">
                          {customer.phone ?? "No phone"}
                          <br />
                          {customer.email ?? "No email"}
                        </td>
                        <td className="px-3 py-3">{customer.order_count}</td>
                        <td className="px-3 py-3">{customer.paid_order_count}</td>
                        <td className="px-3 py-3">{formatINR(customer.total_spend)}</td>
                        <td className="px-3 py-3">{formatINR(customer.avg_order_value)}</td>
                        <td className="px-3 py-3 text-xs">{new Date(customer.last_order_at).toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
