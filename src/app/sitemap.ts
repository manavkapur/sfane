import type { MetadataRoute } from "next";
import { getSupabaseClient } from "@/lib/supabase";
import { getSiteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();
  const baseRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/products`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
  ];

  const supabase = getSupabaseClient();
  if (!supabase) {
    return baseRoutes;
  }

  const [{ data: productsRaw }, { data: categoriesRaw }] = await Promise.all([
    supabase
      .from("products")
      .select("slug,updated_at,created_at")
      .eq("active", true),
    supabase
      .from("categories")
      .select("slug,updated_at,created_at")
      .eq("active", true),
  ]);

  const products = ((productsRaw as Array<{
    slug: string;
    updated_at?: string | null;
    created_at?: string | null;
  }> | null) ?? []).filter((item) => typeof item.slug === "string" && item.slug.length > 0);

  const categories = ((categoriesRaw as Array<{
    slug: string;
    updated_at?: string | null;
    created_at?: string | null;
  }> | null) ?? []).filter((item) => typeof item.slug === "string" && item.slug.length > 0);

  const productRoutes: MetadataRoute.Sitemap = products.map((item) => ({
    url: `${siteUrl}/products/${item.slug}`,
    lastModified: item.updated_at || item.created_at || now,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  // Categories route to /products with query param in this app.
  const categoryRoutes: MetadataRoute.Sitemap = categories.map((item) => ({
    url: `${siteUrl}/products?category=${encodeURIComponent(item.slug)}`,
    lastModified: item.updated_at || item.created_at || now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...baseRoutes, ...categoryRoutes, ...productRoutes];
}
