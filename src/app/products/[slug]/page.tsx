import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductImageGallery } from "@/components/product-image-gallery";
import { manrope, playfairDisplay } from "@/lib/fonts";
import { getSupabaseClient } from "@/lib/supabase";
export const dynamic = "force-dynamic";

type ProductImageRow = { image_url: string | null };
type ProductCategoryRow = {
  category_id: number | null;
  categories: { id: number; name: string; slug: string } | null;
};
type CategoryLinkRow = { product_id: number | null };
type SimilarProductRow = {
  id: number;
  name: string;
  slug: string;
  price: number | string;
  original_price: number | string | null;
  buy_link: string | null;
  product_images: Array<{ image_url: string }> | null;
};
type ProductDetailRow = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number | string;
  original_price: number | string | null;
  offer_type: "NONE" | "PERCENT" | "FIXED" | "BUY_X_GET_Y" | "QTY_TIER_30_40" | null;
  discount_percent: number | null;
  buy_qty: number | null;
  get_qty: number | null;
  buy_link: string | null;
  product_images: ProductImageRow[] | null;
  product_categories: ProductCategoryRow[] | null;
};

function formatPrice(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

const headingFont = playfairDisplay;
const bodyFont = manrope;

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = getSupabaseClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-[#f6f3f1] px-6 pb-20 pt-16">
        <div className="mx-auto w-full max-w-6xl rounded-[24px] border border-dashed border-[#e7d7cc] bg-white/70 p-10 text-center">
          <p className="text-sm text-[#6a4b36]">
            Missing Supabase env vars. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
          </p>
        </div>
      </div>
    );
  }

  const { data: productData, error } = await supabase
    .from("products")
    .select(
      "id,name,slug,description,price,original_price,offer_type,discount_percent,buy_qty,get_qty,buy_link,product_images(image_url),product_categories(category_id,categories(id,name,slug))"
    )
    .eq("slug", slug)
    .eq("active", true)
    .single();

  const data = (productData as ProductDetailRow | null) ?? null;

  if (error || !data) {
    notFound();
  }

  const imageUrls = (data.product_images || [])
    .map((image) => image.image_url)
    .filter((url): url is string => Boolean(url))
    .slice(0, 7);
  const buyLink = data.buy_link?.trim() || null;
  const currentPrice = Number(data.price);
  const originalPrice =
    data.original_price === null || data.original_price === undefined
      ? null
      : Number(data.original_price);
  const hasDiscount = originalPrice !== null && originalPrice > currentPrice;
  const offerLabel =
    data.offer_type === "PERCENT" && data.discount_percent
      ? `-${data.discount_percent}%`
      : data.offer_type === "FIXED" && data.discount_percent
        ? `-₹${data.discount_percent}`
        : data.offer_type === "BUY_X_GET_Y" && data.buy_qty && data.get_qty
          ? `Buy ${data.buy_qty} Get ${data.get_qty}`
          : data.offer_type === "QTY_TIER_30_40"
            ? "30%/40% bulk"
          : null;
  const categories = (data.product_categories || [])
    .map((item) => item.categories)
    .filter(
      (category): category is { id: number; name: string; slug: string } =>
        Boolean(category && typeof category.slug === "string" && typeof category.name === "string")
    );
  const categoryIds = (data.product_categories || [])
    .map((item) => item.category_id)
    .filter((value): value is number => typeof value === "number");
  const relatedHeading =
    categories.length > 0
      ? `More in ${categories[0].name}`
      : "Related products";

  let similarProducts: SimilarProductRow[] = [];

  if (categoryIds.length) {
    const { data: relatedRowsRaw } = await supabase
      .from("product_categories")
      .select("product_id")
      .in("category_id", categoryIds)
      .neq("product_id", data.id)
      .limit(50);
    const relatedRows = (relatedRowsRaw as CategoryLinkRow[] | null) ?? [];

    const similarIds = Array.from(
      new Set(relatedRows.map((row) => row.product_id).filter((value): value is number => typeof value === "number"))
    );

    if (similarIds.length) {
      const { data: rowsRaw } = await supabase
        .from("products")
        .select("id,name,slug,price,original_price,buy_link,product_images(image_url)")
        .in("id", similarIds.slice(0, 12))
        .eq("active", true)
        .limit(4);

      similarProducts = ((rowsRaw as SimilarProductRow[] | null) ?? []).map((row) => ({
        ...row,
        product_images: (row.product_images || [])
          .map((img) => ({ image_url: img.image_url }))
          .filter((img) => Boolean(img.image_url)),
      }));
    }
  }

  if (similarProducts.length === 0) {
    const { data: fallbackRowsRaw } = await supabase
      .from("products")
      .select("id,name,slug,price,original_price,buy_link,product_images(image_url)")
      .neq("id", data.id)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(4);

    similarProducts = ((fallbackRowsRaw as SimilarProductRow[] | null) ?? []).map((row) => ({
      ...row,
      product_images: (row.product_images || [])
        .map((img) => ({ image_url: img.image_url }))
        .filter((img) => Boolean(img.image_url)),
    }));
  }

  return (
    <main
      className={`relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f8f5f2_0%,#f2ece6_55%,#f8f4ef_100%)] text-[#191412] ${bodyFont.className}`}
    >
      <div className="pointer-events-none absolute left-[-8rem] top-24 h-72 w-72 rounded-full bg-[#e8d8ca]/55 blur-[110px]" />
      <div className="pointer-events-none absolute right-[-8rem] top-[22rem] h-72 w-72 rounded-full bg-[#d9c3b1]/35 blur-[130px]" />

      <div className="mx-auto w-full max-w-[1400px] px-4 pb-20 pt-10 sm:px-6">
        <div className="mb-8 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.26em] text-[#7b5a45] sm:text-xs">
          <Link href="/products" className="transition hover:text-[#2c1f15]">
            Products
          </Link>
          <span>/</span>
          <span className="text-[#5a4434]">{data.name}</span>
        </div>

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1.18fr)_400px]">
          <section className="overflow-hidden rounded-[30px] border border-[#e8dbcf] bg-[linear-gradient(160deg,rgba(255,255,255,0.92),rgba(248,242,236,0.8))] p-4 shadow-[0_26px_70px_rgba(20,12,10,0.1)] sm:p-6">
            <ProductImageGallery images={imageUrls} productName={data.name} />

            <div className="mt-8 rounded-[26px] border border-[#e4d5c9]/85 bg-white/85 p-5 shadow-[0_16px_45px_rgba(20,12,10,0.07)] sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#8a6b55]">
                Product Story
              </p>
              <p className="mt-3 text-sm leading-7 text-[#4e3f33] sm:text-[15px]">
                {data.description?.trim() ||
                  "Designed for everyday carry with clean utility, durable construction, and a refined silhouette."}
              </p>
            </div>
          </section>

          <aside className="space-y-5 lg:sticky lg:top-8 lg:self-start">
            <div className="overflow-hidden rounded-[28px] border border-[#e3d6cc]/85 bg-[linear-gradient(160deg,rgba(255,255,255,0.94),rgba(246,238,232,0.86))] p-6 shadow-[0_22px_58px_rgba(20,12,10,0.11)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8b6c57]">
                Signature Carry
              </p>
              <h1 className={`mt-3 text-4xl font-semibold leading-[1.12] text-[#1b120d] ${headingFont.className}`}>
                {data.name}
              </h1>

              <div className="mt-6 border-t border-[#e7d9ce] pt-5">
                {data.offer_type && data.offer_type !== "NONE" ? (
                  <p className="inline-block rounded-full border border-[#9f2626]/25 bg-[#9f2626] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-[0_8px_20px_rgba(135,33,33,0.25)]">
                    Limited time deal
                  </p>
                ) : null}
                <div className="mt-3 flex items-end gap-3">
                  {offerLabel ? (
                    <span className="rounded-lg bg-[#f9e8ea] px-2.5 py-1 text-2xl font-semibold leading-none text-[#b23434]">
                      {offerLabel}
                    </span>
                  ) : null}
                  <span className="text-5xl font-semibold leading-none text-[#18120e]">
                    {formatPrice(currentPrice)}
                  </span>
                </div>
                {hasDiscount ? (
                  <p className="mt-2 text-sm text-[#6f6157]">
                    M.R.P. <span className="line-through">{formatPrice(originalPrice)}</span>
                  </p>
                ) : null}
                <p className="mt-4 text-2xl font-semibold text-[#0b7f3c]">In stock</p>
              </div>

              <div className="mt-6">
                {buyLink ? (
                  <a
                    href={buyLink}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex w-full items-center justify-center rounded-full bg-[#1f140d] px-5 py-3 text-base font-semibold text-white shadow-[0_16px_34px_rgba(20,12,10,0.24)] transition hover:bg-[#2b1b12]"
                  >
                    Buy now
                  </a>
                ) : (
                  <p className="rounded-2xl border border-dashed border-[#d8c8bc] bg-white/70 px-4 py-3 text-sm text-[#6f5d4f]">
                    Purchase link is being configured.
                  </p>
                )}
              </div>
            </div>

            {categories.length ? (
              <div className="rounded-[24px] border border-[#e3d6cc]/85 bg-white/88 p-5 shadow-[0_14px_38px_rgba(20,12,10,0.08)]">
                <p className="text-xs uppercase tracking-[0.3em] text-[#7b5a45]">Categories</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {categories.map((category) => (
                    <Link
                      key={category.slug}
                      href={`/products?category=${category.slug}`}
                      className="rounded-full border border-[#d9c8bc] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#6a4b36] transition hover:border-[#cdb49f] hover:bg-[#faf5f1]"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </div>

        <section className="mt-8 overflow-hidden rounded-[28px] border border-[#e5d9cf] bg-[linear-gradient(160deg,#fdfaf7_0%,#f8f2eb_48%,#f4ece4_100%)] p-5 shadow-[0_20px_60px_rgba(20,12,10,0.08)] sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[#836854]">Curated Picks</p>
              <h2 className={`mt-2 text-2xl font-semibold text-[#1b120d] sm:text-3xl ${headingFont.className}`}>
                {relatedHeading}
              </h2>
              <p className="mt-2 text-sm text-[#5f4b3d]">
                Selected from matching categories.
              </p>
            </div>
            <Link
              href="/products"
              className="rounded-full border border-[#d9c6b5] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#4a372a] transition hover:bg-white"
            >
              Browse all
            </Link>
          </div>

          {similarProducts.length ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {similarProducts.map((item) => (
                <article
                  key={item.id}
                  className="group rounded-2xl border border-[#eaded3] bg-white/95 p-3 shadow-[0_12px_30px_rgba(24,14,10,0.07)] transition duration-300 hover:-translate-y-1.5 hover:border-[#dbc8ba] hover:shadow-[0_20px_45px_rgba(24,14,10,0.12)]"
                >
                  <Link
                    href={`/products/${item.slug}`}
                    className="block overflow-hidden rounded-xl bg-[radial-gradient(circle_at_20%_20%,#fff,#f6eee8_62%,#f2e8df)]"
                  >
                    <div className="relative h-48 w-full overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.product_images?.[0]?.image_url || "/Allbags.png"}
                        alt={item.name}
                        className={`absolute inset-0 h-full w-full object-contain p-3 transition duration-500 ${
                          item.product_images?.[1]?.image_url
                            ? "opacity-100 group-hover:scale-[1.02] group-hover:opacity-0"
                            : "group-hover:scale-[1.03]"
                        }`}
                      />
                      {item.product_images?.[1]?.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.product_images[1].image_url || item.product_images[0]?.image_url || "/Allbags.png"}
                          alt={`${item.name} alternate`}
                          className="absolute inset-0 h-full w-full object-contain p-3 opacity-0 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
                        />
                      ) : null}
                    </div>
                  </Link>
                  <Link
                    href={`/products/${item.slug}`}
                    className="mt-3 line-clamp-2 block text-base font-semibold leading-6 text-[#161312]"
                  >
                    {item.name}
                  </Link>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-base font-semibold text-[#1f140d]">
                      {formatPrice(Number(item.price))}
                    </span>
                    {item.original_price && Number(item.original_price) > Number(item.price) ? (
                      <span className="text-xs text-[#a18675] line-through">
                        {formatPrice(Number(item.original_price))}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    {item.buy_link ? (
                      <a
                        href={item.buy_link}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="flex-1 rounded-full bg-[#1f140d] px-3 py-2 text-center text-xs font-semibold text-white shadow-[0_8px_18px_rgba(20,12,10,0.22)] transition hover:bg-[#2b1b12]"
                      >
                        Buy now
                      </a>
                    ) : null}
                    <Link
                      href={`/products/${item.slug}`}
                      className="rounded-full border border-[#d9c8bc] px-3 py-2 text-xs font-semibold text-[#6a4b36]"
                    >
                      View
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-[#565959]">No similar products found yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}
