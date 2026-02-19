import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductImageGallery } from "@/components/product-image-gallery";
import { getSupabaseClient } from "@/lib/supabase";

function formatINR(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function ProductSampleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = getSupabaseClient();

  if (!supabase) {
    return (
      <main className="min-h-screen bg-[#f6f3f1] px-6 pb-20 pt-16">
        <div className="mx-auto w-full max-w-6xl rounded-[24px] border border-dashed border-[#e7d7cc] bg-white/70 p-10 text-center">
          <p className="text-sm text-[#6a4b36]">
            Missing Supabase env vars. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
          </p>
        </div>
      </main>
    );
  }

  const { data, error } = await supabase
    .from("products")
    .select("id,name,slug,description,price,original_price,offer_type,discount_percent,buy_qty,get_qty,product_images(image_url)")
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (error || !data) {
    notFound();
  }

  const imageUrls = (data.product_images || []).map((image) => image.image_url).filter(Boolean).slice(0, 5);
  const offerLabel =
    data.offer_type === "PERCENT" && data.discount_percent
      ? `-${data.discount_percent}%`
      : data.offer_type === "FIXED" && data.discount_percent
        ? `-₹${data.discount_percent}`
        : data.offer_type === "BUY_X_GET_Y" && data.buy_qty && data.get_qty
          ? `Buy ${data.buy_qty} Get ${data.get_qty}`
          : null;

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#0f1111]">
      <div className="mx-auto grid w-full max-w-[1400px] gap-8 px-6 pb-16 pt-10 lg:grid-cols-[1fr_420px]">
        <section className="rounded-2xl border border-[#e3e6e6] bg-white p-4">
          <ProductImageGallery images={imageUrls} productName={data.name} />
          {data.description ? (
            <p className="mt-6 rounded-xl border border-[#e3e6e6] bg-[#fafafa] p-4 text-base leading-7 text-[#37475a]">
              {data.description}
            </p>
          ) : null}
        </section>

        <aside className="space-y-5 lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-2xl border border-[#e3e6e6] bg-white p-6">
            <h1 className="text-[40px] font-semibold leading-[1.2]">{data.name}</h1>
            <p className="mt-3 text-[#007185]">Visit the Sfane Store</p>

            <div className="mt-6 border-t border-[#e7e7e7] pt-5">
              {data.offer_type && data.offer_type !== "NONE" ? (
                <p className="inline-block rounded-md bg-[#cc0c39] px-3 py-1 text-sm font-semibold text-white">Limited time deal</p>
              ) : null}
              <div className="mt-3 flex items-end gap-3">
                {offerLabel ? <span className="text-[42px] leading-none text-[#cc0c39]">{offerLabel}</span> : null}
                <span className="text-5xl font-semibold leading-none">{formatINR(Number(data.price))}</span>
              </div>
              {data.original_price && Number(data.original_price) > Number(data.price) ? (
                <p className="mt-2 text-sm text-[#565959]">
                  M.R.P. <span className="line-through">{formatINR(Number(data.original_price))}</span>
                </p>
              ) : null}
              <p className="mt-4 text-2xl font-semibold text-[#007600]">In stock</p>
            </div>

            <div className="mt-6 space-y-3">
              <AddToCartButton productId={data.id} />
              <Link
                href="/checkout"
                className="inline-flex w-full items-center justify-center rounded-full bg-[#ffa41c] px-5 py-3 text-base font-semibold"
              >
                Buy now
              </Link>
            </div>

            <p className="mt-6 text-sm text-[#565959]">Sold by Sfane. Secure transaction.</p>
          </div>

          <Link href="/products-sample" className="block text-center text-sm font-semibold text-[#0066c0] hover:underline">
            Back to sample products
          </Link>
        </aside>
      </div>
    </main>
  );
}
