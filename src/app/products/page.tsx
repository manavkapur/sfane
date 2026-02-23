import Link from "next/link";
import type { Metadata } from "next";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { ProductsToolbar } from "@/components/products-toolbar";
import { manrope, playfairDisplay } from "@/lib/fonts";
import { absoluteUrl } from "@/lib/seo";
import { getSupabaseClient } from "@/lib/supabase";

type CategoryRow = { id: number };
type ProductCategoryMapRow = { product_id: number | null };
type ProductListRow = {
  id: number;
  name: string;
  slug: string;
  price: number | string;
  original_price: number | string | null;
  offer_type: string | null;
  discount_percent: number | null;
  buy_qty: number | null;
  get_qty: number | null;
  buy_link: string | null;
  created_at: string;
  product_images: Array<{ image_url: string | null }> | null;
};

const headingFont = playfairDisplay;
const bodyFont = manrope;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop Products",
  description:
    "Explore Sfane products: premium duffle bags, toiletry kits, and tiffin bags for everyday carry.",
  alternates: {
    canonical: "/products",
  },
  openGraph: {
    title: "Shop Products | Sfane",
    description:
      "Explore Sfane products: premium duffle bags, toiletry kits, and tiffin bags for everyday carry.",
    url: "/products",
    type: "website",
    images: [
      {
        url: absoluteUrl("/Allbags.png"),
        width: 1200,
        height: 630,
        alt: "Sfane product collection",
      },
    ],
  },
};

function buildBadge(product: { offer_type: string | null; discount_percent: number | null; buy_qty?: number | null; get_qty?: number | null }) {
  if (!product.offer_type || product.offer_type === "NONE") {
    return null;
  }

  if (product.offer_type === "PERCENT" && product.discount_percent) {
    return `${product.discount_percent}% off`;
  }

  if (product.offer_type === "FIXED" && product.discount_percent) {
    return `₹${product.discount_percent} off`;
  }

  if (product.offer_type === "BUY_X_GET_Y" && product.buy_qty && product.get_qty) {
    return `Buy ${product.buy_qty} Get ${product.get_qty}`;
  }

  if (product.offer_type === "QTY_TIER_30_40") {
    return "30% off qty>2 · 40% off qty>3";
  }

  return "Offer";
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ sort?: string; filter?: string; q?: string; category?: string }>;
}) {
  const params = (await searchParams) || {};
  const supabase = getSupabaseClient();
  const selectedCategoryLabel = params.category
    ? params.category
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : null;

  let backendMessage: string | null = null;
  let products: ProductCardData[] = [];

  if (!supabase) {
    backendMessage =
      "Missing Supabase env vars. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.";
  } else {
    let categoryProductIds: number[] | null = null;

    if (params.category) {
      const { data: categoryRowRaw, error: categoryError } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", params.category)
        .eq("active", true)
        .maybeSingle();
      const categoryRow = (categoryRowRaw as CategoryRow | null) ?? null;

      if (categoryError) {
        throw new Error(categoryError.message);
      }

      if (!categoryRow) {
        categoryProductIds = [];
      } else {
        const { data: mappedRowsRaw, error: mappedError } = await supabase
          .from("product_categories")
          .select("product_id")
          .eq("category_id", categoryRow.id);

        if (mappedError) {
          throw new Error(mappedError.message);
        }

        const mappedRows = (mappedRowsRaw as ProductCategoryMapRow[] | null) ?? [];
        categoryProductIds = mappedRows
          .map((row) => row.product_id)
          .filter((value): value is number => typeof value === "number");
      }
    }

    let query = supabase
      .from("products")
      .select(
        "id,name,slug,price,original_price,offer_type,discount_percent,buy_qty,get_qty,buy_link,created_at,product_images(image_url)"
      )
      .eq("active", true);

    if (params.category) {
      if (!categoryProductIds || categoryProductIds.length === 0) {
        products = [];
      } else {
        query = query.in("id", categoryProductIds);
      }
    }

    if (products.length === 0 && params.category && (!categoryProductIds || categoryProductIds.length === 0)) {
      // Skip query when category has no mapped products.
    } else if (params.filter === "offers") {
      query = query.neq("offer_type", "NONE");
    }

    if (products.length !== 0 || !params.category || (categoryProductIds && categoryProductIds.length > 0)) {
      if (params.q) {
        query = query.ilike("name", `%${params.q}%`);
      }

      if (params.sort === "price-asc") {
        query = query.order("price", { ascending: true });
      } else if (params.sort === "price-desc") {
        query = query.order("price", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data: productsRaw, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      const data = (productsRaw as ProductListRow[] | null) ?? [];

      products = data.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: Number(product.price),
        original_price: product.original_price ? Number(product.original_price) : null,
        buy_link: product.buy_link,
        image_url: product.product_images?.[0]?.image_url || null,
        hover_image_url: product.product_images?.[1]?.image_url || null,
        badge: buildBadge({
          offer_type: product.offer_type,
          discount_percent: product.discount_percent,
          buy_qty: product.buy_qty,
          get_qty: product.get_qty,
        }),
      }));
    }
  }

  return (
    <div
      className={`relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f8f5f2_0%,#f4eee8_52%,#f8f4f0_100%)] px-4 pb-20 pt-12 sm:px-6 md:px-8 ${bodyFont.className}`}
    >
      <div className="pointer-events-none absolute left-0 top-24 h-64 w-64 rounded-full bg-[#e5d4c6]/55 blur-[100px]" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-72 w-72 rounded-full bg-[#ead9cc]/45 blur-[120px]" />

      <div className="mx-auto w-full max-w-6xl">
        <div className="relative overflow-hidden rounded-[32px] border border-[#e7dacf]/85 bg-[linear-gradient(140deg,rgba(255,255,255,0.88),rgba(246,238,232,0.78))] p-6 shadow-[0_32px_90px_rgba(20,12,10,0.1)] backdrop-blur-sm md:p-9">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/65 to-transparent" />
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-[#7b5a45]">Products</p>
              <h1
                className={`mt-4 text-4xl font-semibold leading-[1.02] text-[#161312] md:text-5xl ${headingFont.className}`}
              >
                Built for daily carry,
                <span className="block text-[#5f4432]">styled for everyday.</span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm text-[#5a4637] md:text-base">
                Explore the full collection of Sfane essentials and filter for the perfect fit.
              </p>
            </div>

            <ProductsToolbar currentSort={params.sort} currentFilter={params.filter} />
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {backendMessage ? (
          <div className="mt-8 rounded-[24px] border border-dashed border-[#ddccbf] bg-white/70 p-8 text-center shadow-[0_10px_30px_rgba(20,12,10,0.08)]">
            <p className="text-sm text-[#6a4b36]">{backendMessage}</p>
          </div>
        ) : null}

        {!backendMessage && products.length === 0 ? (
          <div className="relative mt-8 overflow-hidden rounded-[28px] border border-[#e3d1c2]/85 bg-[linear-gradient(160deg,rgba(255,255,255,0.92),rgba(247,238,230,0.88))] p-10 text-center shadow-[0_24px_70px_rgba(20,12,10,0.1)]">
            <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-[#ead6c4]/50 blur-3xl" />
            {selectedCategoryLabel ? (
              <p className="relative text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8a6a55]">
                {selectedCategoryLabel}
              </p>
            ) : null}
            <h3 className={`relative mt-2 text-3xl font-semibold text-[#1d140f] md:text-4xl ${headingFont.className}`}>
              Products coming soon for you
            </h3>
            <p className="relative mx-auto mt-3 max-w-xl text-sm text-[#6a4b36] md:text-base">
              We are curating this collection right now. Fresh arrivals will be live shortly.
            </p>
            <div className="relative mt-6">
              <Link
                href="/products"
                className="inline-flex rounded-full border border-[#d9c4b3] bg-white/85 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#5d4331] transition hover:border-[#cbb19e] hover:bg-white"
              >
                Browse all categories
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
