"use client";

import { useMemo, useState } from "react";

type ProductImageGalleryProps = {
  images: string[];
  productName: string;
};

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const gallery = useMemo(() => images.map((image) => image.trim()).filter(Boolean).slice(0, 5), [images]);
  const [activeIndex, setActiveIndex] = useState(0);

  if (gallery.length === 0) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center rounded-[22px] border border-[#efe6de] bg-[#f6f3f1] p-6 text-sm text-[#6a4b36]">
        No product images uploaded yet.
      </div>
    );
  }

  const selectedIndex = Math.min(activeIndex, gallery.length - 1);
  const activeImage = gallery[selectedIndex];

  return (
    <div className="grid gap-4 md:grid-cols-[84px_1fr]">
      <div className="order-2 flex gap-2 overflow-x-auto md:order-1 md:flex-col md:overflow-visible">
        {gallery.map((image, index) => {
          const isActive = index === selectedIndex;

          return (
            <button
              key={`${image}-${index}`}
              type="button"
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onClick={() => setActiveIndex(index)}
              className={`shrink-0 overflow-hidden rounded-[14px] border bg-white p-1 transition ${
                isActive ? "border-[#1f140d]" : "border-[#d9c8bc] hover:border-[#8a684d]"
              }`}
              aria-label={`${productName} image ${index + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt={`${productName} thumbnail ${index + 1}`} className="h-16 w-16 rounded-[10px] object-cover" />
            </button>
          );
        })}
      </div>

      <div className="order-1 aspect-[4/5] w-full overflow-hidden rounded-[22px] border border-[#efe6de] bg-[#f6f3f1]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={activeImage} alt={productName} className="h-full w-full object-contain p-6" />
      </div>
    </div>
  );
}
