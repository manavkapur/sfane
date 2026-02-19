import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductImageGallery } from "@/components/product-image-gallery";
import { getSupabaseClient } from "@/lib/supabase";

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
  product_images: Array<{ image_url: string }> | null;
};
type ProductDetailRow = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number | string;
  original_price: number | string | null;
  offer_type: "NONE" | "PERCENT" | "FIXED" | "BUY_X_GET_Y" | null;
  discount_percent: number | null;
  buy_qty: number | null;
  get_qty: number | null;
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
      "id,name,slug,description,price,original_price,offer_type,discount_percent,buy_qty,get_qty,product_images(image_url),product_categories(category_id,categories(id,name,slug))"
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
    .slice(0, 5);
  const offerLabel =
    data.offer_type === "PERCENT" && data.discount_percent
      ? `-${data.discount_percent}%`
      : data.offer_type === "FIXED" && data.discount_percent
        ? `-₹${data.discount_percent}`
        : data.offer_type === "BUY_X_GET_Y" && data.buy_qty && data.get_qty
          ? `Buy ${data.buy_qty} Get ${data.get_qty}`
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
        .select("id,name,slug,price,original_price,product_images(image_url)")
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
      .select("id,name,slug,price,original_price,product_images(image_url)")
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
    <main className="min-h-screen bg-[#f5f5f7] text-[#0f1111]">
      <div className="mx-auto w-full max-w-[1400px] px-6 pb-16 pt-10">
        <div className="mb-8 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[#7b5a45]">
          <Link href="/products" className="hover:text-[#1f140d]">
            Products
          </Link>
          <span>/</span>
          <span>{data.name}</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          <section className="rounded-2xl border border-[#e3e6e6] bg-white p-4">
            <ProductImageGallery images={imageUrls} productName={data.name} />
            <div className="mt-8 rounded-2xl border border-[#e3e6e6] bg-white p-6">
              <h2 className="text-2xl font-semibold">Similar products</h2>
              <p className="mt-2 text-sm text-[#565959]">Based on the same category.</p>

              {similarProducts.length ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {similarProducts.map((item) => (
                    <article key={item.id} className="rounded-xl border border-[#e3e6e6] bg-white p-3">
                      <Link href={`/products/${item.slug}`} className="block overflow-hidden rounded-lg bg-[#f6f3f1]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.product_images?.[0]?.image_url || "/Allbags.png"}
                          alt={item.name}
                          className="h-36 w-full object-cover"
                        />
                      </Link>
                      <Link href={`/products/${item.slug}`} className="mt-3 block text-sm font-semibold leading-5 text-[#161312]">
                        {item.name}
                      </Link>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#1f140d]">{formatPrice(Number(item.price))}</span>
                        {item.original_price && Number(item.original_price) > Number(item.price) ? (
                          <span className="text-xs text-[#a18675] line-through">{formatPrice(Number(item.original_price))}</span>
                        ) : null}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1">
                          <AddToCartButton productId={item.id} compact />
                        </div>
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
            </div>
          </section>

          <aside className="space-y-5 lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-2xl border border-[#e3e6e6] bg-white p-6">
              <h1 className="text-[40px] font-semibold leading-[1.2]">{data.name}</h1>
              <p className="mt-3 text-[#007185]">Visit the Sfane Store</p>
              <p className="mt-3 text-sm text-[#565959]">4.4 stars (12,452)</p>
              <p className="mt-1 text-sm font-semibold">700+ bought in past month</p>

              <div className="mt-6 border-t border-[#e7e7e7] pt-5">
                {data.offer_type && data.offer_type !== "NONE" ? (
                  <p className="inline-block rounded-md bg-[#cc0c39] px-3 py-1 text-sm font-semibold text-white">Limited time deal</p>
                ) : null}
                <div className="mt-3 flex items-end gap-3">
                  {offerLabel ? <span className="text-[42px] leading-none text-[#cc0c39]">{offerLabel}</span> : null}
                  <span className="text-5xl font-semibold leading-none">{formatPrice(Number(data.price))}</span>
                </div>
                {data.original_price && Number(data.original_price) > Number(data.price) ? (
                  <p className="mt-2 text-sm text-[#565959]">
                    M.R.P. <span className="line-through">{formatPrice(Number(data.original_price))}</span>
                  </p>
                ) : null}
                <p className="mt-4 text-2xl font-semibold text-[#007600]">In stock</p>
              </div>

              <div className="mt-6 space-y-3">
                <AddToCartButton productId={data.id} />
                <Link
                  href="/cart"
                  className="inline-flex w-full items-center justify-center rounded-full bg-[#ffa41c] px-5 py-3 text-base font-semibold"
                >
                  Go to cart
                </Link>
              </div>

              <p className="mt-6 text-sm text-[#565959]">Sold by Sfane. Secure transaction.</p>
            </div>

            {categories.length ? (
              <div className="rounded-2xl border border-[#e3e6e6] bg-white p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-[#7b5a45]">Categories</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {categories.map((category) => (
                    <Link
                      key={category.slug}
                      href={`/shop?category=${category.slug}`}
                      className="rounded-full border border-[#d9c8bc] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#6a4b36]"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}
