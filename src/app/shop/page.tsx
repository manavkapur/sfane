import Link from "next/link";
import type { Metadata } from "next";
import { getCatalogData } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop | Sfane",
  description: "Browse active products from Supabase",
};

type ShopPageProps = {
  searchParams: Promise<{
    category?: string;
  }>;
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { category } = await searchParams;
  const { products, categories } = await getCatalogData(category);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#7b5a45]">Shop</p>
          <h1 className="mt-2 text-3xl font-semibold text-[#1f140d]">All Products</h1>
        </div>
        <Link
          href="/categories"
          className="rounded-full border border-[#e8d9cf] px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#6a4b36]"
        >
          View Categories
        </Link>
      </header>

      <section className="mb-8 flex flex-wrap gap-2">
        <Link
          href="/shop"
          className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] ${
            !category
              ? "bg-[#1f140d] text-white"
              : "border border-[#e8d9cf] text-[#6a4b36]"
          }`}
        >
          All
        </Link>
        {categories.map((item) => (
          <Link
            key={item.id}
            href={`/shop?category=${item.slug}`}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] ${
              category === item.slug
                ? "bg-[#1f140d] text-white"
                : "border border-[#e8d9cf] text-[#6a4b36]"
            }`}
          >
            {item.name}
          </Link>
        ))}
      </section>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const primaryImage = product.images[0] ?? "/DuffleBag.jpg";
          return (
            <article
              key={product.id}
              className="rounded-3xl border border-[#efe2d9] bg-white p-5 shadow-[0_15px_35px_rgba(31,20,13,0.08)]"
            >
              <Link href={`/shop/${product.slug}`}>
                <img
                  src={primaryImage}
                  alt={product.name}
                  className="h-56 w-full rounded-2xl object-cover"
                />
              </Link>
              <div className="mt-4">
                <p className="text-xs uppercase tracking-[0.14em] text-[#8a6a55]">
                  {product.categories.map((categoryItem) => categoryItem.name).join(" · ") || "Uncategorized"}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-[#1f140d]">{product.name}</h2>
                <p className="mt-1 text-sm text-[#5b4739]">₹{product.price.toFixed(2)}</p>
                <Link
                  href={`/shop/${product.slug}`}
                  className="mt-4 inline-flex rounded-full bg-[#1f140d] px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white"
                >
                  View Product
                </Link>
              </div>
            </article>
          );
        })}
      </section>

      {products.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-[#dfc8b7] p-6 text-sm text-[#6a4b36]">
          No products found for this category.
        </p>
      ) : null}
    </main>
  );
}
