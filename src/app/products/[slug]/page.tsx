import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { getSupabaseClient } from "@/lib/supabase";

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

  const { data, error } = await supabase
    .from("products")
    .select(
      "id,name,slug,description,price,original_price,offer_type,discount_percent,product_images(image_url),product_categories(categories(name,slug))"
    )
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (error || !data) {
    notFound();
  }

  const images = data.product_images || [];
  const primaryImage = images[0]?.image_url || "/Allbags.png";
  const categories = (data.product_categories || [])
    .map((item) => item.categories)
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-[#f6f3f1] px-6 pb-20 pt-16">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-10 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[#7b5a45]">
          <Link href="/products" className="hover:text-[#1f140d]">
            Products
          </Link>
          <span>/</span>
          <span>{data.name}</span>
        </div>

        <div className="grid gap-12 md:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-[#efe6de] bg-white/90 p-6 shadow-[0_20px_50px_rgba(20,12,10,0.12)]">
            <div className="aspect-[4/5] w-full overflow-hidden rounded-[22px] bg-[#f6f3f1]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={primaryImage} alt={data.name} className="h-full w-full object-contain p-6" />
            </div>
            {images.length > 1 ? (
              <div className="mt-6 grid grid-cols-3 gap-4">
                {images.slice(0, 3).map((image, index) => (
                  <div
                    key={`${image.image_url}-${index}`}
                    className="aspect-square overflow-hidden rounded-[18px] border border-[#efe6de] bg-white"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.image_url}
                      alt={`${data.name} preview ${index + 1}`}
                      className="h-full w-full object-contain p-3"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#7b5a45]">
              {data.offer_type && data.offer_type !== "NONE" ? "Offer" : "Signature"}
            </p>
            <h1 className="mt-4 text-3xl font-semibold text-[#161312] md:text-4xl">{data.name}</h1>
            <p className="mt-4 text-base text-[#5a4637]">
              {data.description ||
                "Designed to keep your essentials light, organized, and ready for every commute."}
            </p>

            <div className="mt-6 flex items-end gap-4">
              <span className="text-2xl font-semibold text-[#1f140d]">{formatPrice(Number(data.price))}</span>
              {data.original_price && Number(data.original_price) > Number(data.price) ? (
                <span className="text-sm text-[#a18675] line-through">{formatPrice(Number(data.original_price))}</span>
              ) : null}
              {data.discount_percent ? (
                <span className="rounded-full bg-[#1f140d] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                  {data.discount_percent}% off
                </span>
              ) : null}
            </div>

            <div className="mt-8">
              <AddToCartButton productId={data.id} />
            </div>

            {categories.length ? (
              <div className="mt-10">
                <p className="text-xs uppercase tracking-[0.3em] text-[#7b5a45]">Categories</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {categories.map((category) => (
                    <Link
                      key={category.slug}
                      href={`/shop?category=${category.slug}`}
                      className="rounded-full border border-[#e7d7cc] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#6a4b36]"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
