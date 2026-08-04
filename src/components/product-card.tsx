import Link from "next/link";

import { normalizeProductSlug } from "@/lib/product-slug";
import { cn } from "@/lib/utils";

export type ProductCardData = {
  id: number;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  buy_link?: string | null;
  image_url?: string | null;
  hover_image_url?: string | null;
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
  const hoverImageUrl = product.hover_image_url || imageUrl;
  const hasSecondImage = Boolean(product.hover_image_url && product.hover_image_url !== imageUrl);
  const productHref = `/products/${normalizeProductSlug(product.slug, product.name)}`;

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[22px] border border-[#eadfd5]/90 bg-[linear-gradient(180deg,#ffffff,#fcf8f5)] shadow-sm sm:rounded-[28px]",
        "transition duration-300 hover:border-[#d8c6b9] sm:hover:-translate-y-1"
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(150deg,rgba(255,255,255,0.34),transparent_45%,rgba(214,185,163,0.08))] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <Link href={productHref} className="block">
        <div className="relative aspect-square w-full overflow-hidden bg-[#f8f4f0] sm:aspect-[4/5]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={product.name}
            className={`absolute inset-0 h-full w-full scale-[1.04] object-contain p-1.5 saturate-[1.03] contrast-[1.03] transition duration-500 sm:scale-[1.08] sm:p-3 ${
              hasSecondImage ? "opacity-100 group-hover:scale-[1.1] group-hover:opacity-0" : "group-hover:scale-[1.1]"
            }`}
            loading="lazy"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hoverImageUrl}
            alt={`${product.name} alternate`}
            className={`absolute inset-0 h-full w-full scale-[1.04] object-contain p-1.5 saturate-[1.03] contrast-[1.03] transition duration-500 sm:scale-[1.08] sm:p-3 ${
              hasSecondImage ? "opacity-0 group-hover:scale-[1.1] group-hover:opacity-100" : "hidden"
            }`}
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/35 to-transparent" />
          {product.badge ? (
            <span className="absolute left-2.5 top-2.5 rounded-full border border-[#3a281b]/30 bg-[#21160f]/90 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.16em] text-[#fff8f2] shadow-[0_8px_22px_rgba(20,12,10,0.3)] backdrop-blur-sm sm:left-4 sm:top-4 sm:px-3 sm:py-1 sm:text-[10px] sm:tracking-[0.22em]">
              {product.badge}
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 px-3.5 pb-3.5 pt-3 sm:gap-2.5 sm:px-6 sm:pb-6 sm:pt-5">
        <Link href={productHref}>
          <h3 className="line-clamp-2 text-base font-semibold leading-tight text-[#1f140d] sm:text-[1.35rem]">{product.name}</h3>
        </Link>
        <div className="flex items-end gap-2">
          <span className="text-base font-semibold tracking-tight text-[#1f140d] sm:text-xl">
            {formatPrice(product.price)}
          </span>
          {hasDiscount ? (
            <span className="pb-0.5 text-xs text-[#a18675] line-through sm:text-sm">
              {formatPrice(product.original_price || 0)}
            </span>
          ) : null}
        </div>

        <div className="mt-2 flex items-start gap-2 sm:mt-3 sm:gap-2.5">
          {product.buy_link ? (
            <a
              href={product.buy_link}
              target="_blank"
              rel="noreferrer noopener"
              className="flex-1 rounded-full bg-[#1f140d] px-3 py-2 text-center text-xs font-semibold text-white shadow-[0_12px_24px_rgba(20,12,10,0.25)] transition hover:bg-[#2b1b12] sm:px-4 sm:py-2.5 sm:text-sm"
            >
              Buy now
            </a>
          ) : null}
          <Link
            href={productHref}
            className="rounded-full border border-[#d9c8bc] bg-white/70 px-3 py-2 text-xs font-semibold text-[#6a4b36] transition hover:border-[#cdb49f] hover:bg-[#f8f2ed] sm:px-4 sm:py-2.5 sm:text-sm"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}
