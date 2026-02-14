import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCatalogData, getProductBySlug } from "@/lib/catalog";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found | Sfane",
    };
  }

  return {
    title: `${product.name} | Sfane`,
    description: product.description ?? "Product details",
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const { products } = await getCatalogData();
  const relatedProducts = products
    .filter(
      (item) =>
        item.slug !== product.slug &&
        item.categories.some((category) =>
          product.categories.some((productCategory) => productCategory.id === category.id)
        )
    )
    .slice(0, 4);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/shop" className="text-sm text-[#6a4b36] underline underline-offset-4">
        Back to shop
      </Link>

      <section className="mt-5 grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-3xl border border-[#efe2d9] bg-white p-4">
          <img
            src={product.images[0] ?? "/DuffleBag.jpg"}
            alt={product.name}
            className="h-[480px] w-full rounded-2xl object-cover"
          />
        </div>

        <div className="rounded-3xl border border-[#efe2d9] bg-white p-6">
          <p className="text-xs uppercase tracking-[0.14em] text-[#8a6a55]">
            {product.categories.map((item) => item.name).join(" · ") || "Uncategorized"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[#1f140d]">{product.name}</h1>
          <p className="mt-2 text-lg text-[#4e392c]">₹{product.price.toFixed(2)}</p>
          {product.originalPrice ? (
            <p className="mt-1 text-sm text-[#8a6a55] line-through">₹{product.originalPrice.toFixed(2)}</p>
          ) : null}
          {product.discountPercent ? (
            <p className="mt-2 inline-flex rounded-full bg-[#f5e9df] px-3 py-1 text-xs font-semibold text-[#8a4f23]">
              {product.discountPercent}% OFF
            </p>
          ) : null}
          <p className="mt-5 text-sm leading-7 text-[#5b4739]">
            {product.description ?? "No description available for this product yet."}
          </p>

          <div className="mt-6 rounded-2xl bg-[#f8f2ed] p-4 text-sm text-[#5b4739]">
            <p className="font-semibold text-[#1f140d]">Checkout pipeline linked to backend</p>
            <p className="mt-1">
              This product is connected to Supabase product tables. Next step is wiring authenticated cart and checkout
              via `merge-cart` and `create-order` edge functions.
            </p>
          </div>

          <Link
            href="/cart"
            className="mt-6 inline-flex rounded-full bg-[#1f140d] px-5 py-2 text-sm font-semibold text-white"
          >
            Go to Cart
          </Link>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-[#1f140d]">Related Products</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {relatedProducts.map((item) => (
            <Link
              key={item.id}
              href={`/shop/${item.slug}`}
              className="rounded-2xl border border-[#efe2d9] bg-white p-4"
            >
              <img
                src={item.images[0] ?? "/DuffleBag.jpg"}
                alt={item.name}
                className="h-36 w-full rounded-xl object-cover"
              />
              <p className="mt-3 text-sm font-semibold text-[#1f140d]">{item.name}</p>
              <p className="text-sm text-[#6a4b36]">₹{item.price.toFixed(2)}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
