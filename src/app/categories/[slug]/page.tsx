import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductCard, type ProductCardData } from "@/components/product-card";
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

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = getSupabaseClient();

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id,name,slug")
    .eq("slug", params.slug)
    .eq("active", true)
    .single();

  if (categoryError || !category) {
    notFound();
  }

  const { data, error } = await supabase
    .from("product_categories")
    .select(
      "products(id,name,slug,price,original_price,offer_type,discount_percent,product_images(image_url))"
    )
    .eq("category_id", category.id);

  if (error) {
    throw new Error(error.message);
  }

  const products: ProductCardData[] = (data || [])
    .map((row) => row.products)
    .filter(Boolean)
    .map((product) => ({
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

  return (
    <div className="min-h-screen bg-[#f6f3f1] px-6 pb-20 pt-16">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-10 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[#7b5a45]">
          <Link href="/products" className="hover:text-[#1f140d]">
            Products
          </Link>
          <span>/</span>
          <span>{category.name}</span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#7b5a45]">
              Category
            </p>
            <h1 className="mt-4 text-3xl font-semibold text-[#161312] md:text-4xl">
              {category.name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-[#5a4637]">
              Curated pieces designed for {category.name.toLowerCase()} moments.
            </p>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="mt-12 rounded-[24px] border border-dashed border-[#e7d7cc] bg-white/70 p-10 text-center">
            <p className="text-sm text-[#6a4b36]">
              No products assigned to this category yet.
            </p>
          </div>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
