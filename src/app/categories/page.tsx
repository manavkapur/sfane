import Link from "next/link";
import type { Metadata } from "next";
import { getCatalogData } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Categories | Sfane",
  description: "Browse product categories",
};

export default async function CategoriesPage() {
  const { categories } = await getCatalogData();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-[#7b5a45]">Catalog</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#1f140d]">Categories</h1>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/shop?category=${category.slug}`}
            className="rounded-3xl border border-[#efe2d9] bg-white p-5 shadow-[0_12px_30px_rgba(31,20,13,0.06)]"
          >
            <p className="text-lg font-semibold text-[#1f140d]">{category.name}</p>
            <p className="mt-2 text-sm text-[#6a4b36]">{category.productCount} active products</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
