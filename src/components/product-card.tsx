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
        "group relative flex flex-col overflow-hidden rounded-[28px] border border-[#eadfd5]/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(250,245,240,0.92))] shadow-[0_18px_46px_rgba(20,12,10,0.12)]",
        "transition duration-300 hover:-translate-y-1.5 hover:border-[#dbc8ba] hover:shadow-[0_30px_78px_rgba(20,12,10,0.17)]"
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(150deg,rgba(255,255,255,0.34),transparent_45%,rgba(214,185,163,0.08))] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <Link href={productHref} className="block">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.95),rgba(245,237,230,0.9)_58%,rgba(241,232,224,0.88))]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={product.name}
            className={`absolute inset-0 h-full w-full object-contain p-7 mix-blend-multiply drop-shadow-[0_16px_26px_rgba(0,0,0,0.18)] saturate-[1.08] contrast-[1.06] transition duration-500 ${
              hasSecondImage ? "opacity-100 group-hover:scale-[1.02] group-hover:opacity-0" : "group-hover:scale-[1.04]"
            }`}
            loading="lazy"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hoverImageUrl}
            alt={`${product.name} alternate`}
            className={`absolute inset-0 h-full w-full object-contain p-7 mix-blend-multiply drop-shadow-[0_16px_26px_rgba(0,0,0,0.18)] saturate-[1.08] contrast-[1.06] transition duration-500 ${
              hasSecondImage ? "opacity-0 group-hover:scale-[1.04] group-hover:opacity-100" : "hidden"
            }`}
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/35 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#f2e8df]/75 to-transparent" />
          {product.badge ? (
            <span className="absolute left-4 top-4 rounded-full border border-[#3a281b]/30 bg-[#21160f]/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#fff8f2] shadow-[0_8px_22px_rgba(20,12,10,0.3)] backdrop-blur-sm">
              {product.badge}
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2.5 px-6 pb-6 pt-5">
        <Link href={productHref}>
          <h3 className="line-clamp-2 text-[1.35rem] font-semibold leading-tight text-[#1f140d]">{product.name}</h3>
        </Link>
        <div className="flex items-end gap-2">
          <span className="text-xl font-semibold tracking-tight text-[#1f140d]">
            {formatPrice(product.price)}
          </span>
          {hasDiscount ? (
            <span className="pb-0.5 text-sm text-[#a18675] line-through">
              {formatPrice(product.original_price || 0)}
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex items-start gap-2.5">
          {product.buy_link ? (
            <a
              href={product.buy_link}
              target="_blank"
              rel="noreferrer noopener"
              className="flex-1 rounded-full bg-[#1f140d] px-4 py-2.5 text-center text-sm font-semibold text-white shadow-[0_12px_24px_rgba(20,12,10,0.25)] transition hover:bg-[#2b1b12]"
            >
              Buy now
            </a>
          ) : null}
          <Link
            href={productHref}
            className="rounded-full border border-[#d9c8bc] bg-white/70 px-4 py-2.5 text-sm font-semibold text-[#6a4b36] transition hover:border-[#cdb49f] hover:bg-[#f8f2ed]"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}
