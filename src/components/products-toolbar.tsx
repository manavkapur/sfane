"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const sortOptions = [
  { label: "Newest", value: "new" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
];

export function ProductsToolbar({
  currentSort,
  currentFilter,
}: {
  currentSort?: string;
  currentFilter?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/products?filter=offers"
        className="rounded-full border border-[#e7d7cc] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#6a4b36]"
      >
        Offers
      </Link>
      <div className="relative">
        <select
          defaultValue={currentSort || "new"}
          className="rounded-full border border-[#e7d7cc] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#6a4b36]"
          onChange={(event) => {
            const value = event.target.value;
            const params = new URLSearchParams(searchParams.toString());
            params.set("sort", value);
            if (currentFilter) {
              params.set("filter", currentFilter);
            }
            router.push(`/products?${params.toString()}`);
          }}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
