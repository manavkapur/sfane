import Link from "next/link";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { cn } from "@/lib/utils";

export type ProductCardData = {
  id: number;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  image_url?: string | null;
  badge?: string | null;
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

export function ProductCard({ product }: { product: ProductCardData }) {
  const hasDiscount = product.original_price && product.original_price > product.price;
  const imageUrl = product.image_url || "/Allbags.png";

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[24px] border border-[#efe6de] bg-white/90 shadow-[0_20px_50px_rgba(20,12,10,0.12)]",
        "transition hover:-translate-y-1 hover:shadow-[0_30px_70px_rgba(20,12,10,0.16)]"
      )}
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#f6f3f1]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-contain p-6 transition duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
          {product.badge ? (
            <span className="absolute left-4 top-4 rounded-full bg-[#1f140d] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
              {product.badge}
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 px-6 pb-6 pt-5">
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-lg font-semibold text-[#1f140d]">{product.name}</h3>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-[#1f140d]">
            {formatPrice(product.price)}
          </span>
          {hasDiscount ? (
            <span className="text-sm text-[#a18675] line-through">
              {formatPrice(product.original_price || 0)}
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex items-start gap-2">
          <div className="flex-1">
            <AddToCartButton productId={product.id} compact />
          </div>
          <Link
            href={`/products/${product.slug}`}
            className="rounded-full border border-[#d9c8bc] px-4 py-2 text-sm font-semibold text-[#6a4b36] transition hover:bg-[#f8f2ed]"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}
