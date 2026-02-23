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
  const offersParams = new URLSearchParams(searchParams.toString());
  offersParams.set("filter", "offers");
  const isOffersActive = currentFilter === "offers";

  return (
    <div className="flex w-full flex-wrap items-center gap-2 rounded-full border border-[#e6d9cf]/80 bg-white/75 p-1.5 shadow-[0_14px_34px_rgba(27,19,14,0.08)] backdrop-blur-md sm:w-auto sm:gap-3">
      <Link
        href={`/products?${offersParams.toString()}`}
        className={`rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
          isOffersActive
            ? "border-[#2b1b12] bg-[#2b1b12] text-white shadow-[0_10px_22px_rgba(27,19,14,0.2)]"
            : "border-[#e7d7cc] bg-white/70 text-[#6a4b36] hover:border-[#d5bca8] hover:bg-[#fbf6f2]"
        }`}
      >
        Offers
      </Link>
      <div className="relative">
        <select
          defaultValue={currentSort || "new"}
          className="min-w-[150px] appearance-none rounded-full border border-[#e7d7cc] bg-white/85 px-4 py-2 pr-10 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6a4b36] outline-none transition hover:border-[#d5bca8] sm:min-w-[170px]"
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
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#846651]">
          ▼
        </span>
      </div>
    </div>
  );
}
