import Link from "next/link";

import { ProductCard, type ProductCardData } from "@/components/product-card";
import { ProductsToolbar } from "@/components/products-toolbar";
import { SAMPLE_PRODUCT, formatINR } from "@/lib/sample-product";
import { getSupabaseClient } from "@/lib/supabase";

function buildBadge(product: { offer_type: string | null; discount_percent: number | null }) {
  if (product.offer_type && product.offer_type !== "NONE") {
    if (product.discount_percent) {
      return `${product.discount_percent}% off`;
    }
    return "Offer";
  }
  return null;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ sort?: string; filter?: string; q?: string }>;
}) {
  const params = (await searchParams) || {};
  const supabase = getSupabaseClient();

  let backendMessage: string | null = null;
  let products: ProductCardData[] = [];

  if (!supabase) {
    backendMessage =
      "Missing Supabase env vars. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.";
  } else {
    let query = supabase
      .from("products")
      .select(
        "id,name,slug,price,original_price,offer_type,discount_percent,created_at,product_images(image_url)"
      )
      .eq("active", true);

    if (params.filter === "offers") {
      query = query.neq("offer_type", "NONE");
    }

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

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    products = (data || []).map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: Number(product.price),
      original_price: product.original_price ? Number(product.original_price) : null,
      image_url: product.product_images?.[0]?.image_url || null,
      badge: buildBadge({
        offer_type: product.offer_type,
        discount_percent: product.discount_percent,
      }),
    }));
  }

  return (
    <div className="min-h-screen bg-[#f6f3f1] px-6 pb-20 pt-16">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#7b5a45]">Products</p>
            <h1 className="mt-4 text-3xl font-semibold text-[#161312] md:text-4xl">
              Built for daily carry, styled for everyday.
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-[#5a4637]">
              Explore the full collection of Sfane essentials and filter for the perfect fit.
            </p>
          </div>

          <ProductsToolbar currentSort={params.sort} currentFilter={params.filter} />
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="group relative flex flex-col overflow-hidden rounded-[24px] border border-[#efe6de] bg-white/90 shadow-[0_20px_50px_rgba(20,12,10,0.12)]">
            <Link href={`/products-sample/${SAMPLE_PRODUCT.slug}`} className="block">
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#f6f3f1]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={SAMPLE_PRODUCT.cardImage}
                  alt={SAMPLE_PRODUCT.name}
                  className="h-full w-full object-contain p-6 transition duration-500 group-hover:scale-[1.03]"
                />
              </div>
            </Link>

            <div className="flex flex-1 flex-col gap-2 px-6 pb-6 pt-5">
              <Link href={`/products-sample/${SAMPLE_PRODUCT.slug}`}>
                <h3 className="text-lg font-semibold text-[#1f140d]">{SAMPLE_PRODUCT.name}</h3>
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-[#1f140d]">{formatINR(SAMPLE_PRODUCT.price)}</span>
                <span className="text-sm text-[#a18675] line-through">{formatINR(SAMPLE_PRODUCT.originalPrice)}</span>
              </div>

              <div className="mt-3 flex gap-2">
                <Link
                  href="/cart"
                  className="rounded-full bg-[#1f140d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2b1b12]"
                >
                  Add to cart
                </Link>
                <Link
                  href={`/products-sample/${SAMPLE_PRODUCT.slug}`}
                  className="rounded-full border border-[#d9c8bc] px-4 py-2 text-sm font-semibold text-[#6a4b36] transition hover:bg-[#f8f2ed]"
                >
                  View details
                </Link>
              </div>
            </div>
          </div>

          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {backendMessage ? (
          <div className="mt-8 rounded-[24px] border border-dashed border-[#e7d7cc] bg-white/70 p-8 text-center">
            <p className="text-sm text-[#6a4b36]">{backendMessage}</p>
          </div>
        ) : null}

        {!backendMessage && products.length === 0 ? (
          <div className="mt-8 rounded-[24px] border border-dashed border-[#e7d7cc] bg-white/70 p-10 text-center">
            <p className="text-sm text-[#6a4b36]">No backend products found for the selected filters.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
