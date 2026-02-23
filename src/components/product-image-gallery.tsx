"use client";

import { useMemo, useState } from "react";

type ProductImageGalleryProps = {
  images: string[];
  productName: string;
};

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const gallery = useMemo(() => images.map((image) => image.trim()).filter(Boolean).slice(0, 7), [images]);
  const [activeIndex, setActiveIndex] = useState(0);

  if (gallery.length === 0) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center rounded-[24px] border border-[#e9ddd2] bg-[radial-gradient(circle_at_18%_18%,#ffffff,#f6eee8_58%,#f1e8df)] p-6 text-sm text-[#6a4b36]">
        No product images uploaded yet.
      </div>
    );
  }

  const selectedIndex = Math.min(activeIndex, gallery.length - 1);
  const activeImage = gallery[selectedIndex];

  return (
    <div className="grid gap-4 md:grid-cols-[92px_1fr]">
      <div className="order-2 flex gap-2.5 overflow-x-auto pb-1 md:order-1 md:flex-col md:overflow-visible md:pb-0">
        {gallery.map((image, index) => {
          const isActive = index === selectedIndex;

          return (
            <button
              key={`${image}-${index}`}
              type="button"
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onClick={() => setActiveIndex(index)}
              className={`shrink-0 overflow-hidden rounded-[14px] border bg-white p-1.5 shadow-sm transition ${
                isActive
                  ? "border-[#1f140d] shadow-[0_10px_24px_rgba(20,12,10,0.25)]"
                  : "border-[#d9c8bc] hover:border-[#8a684d]"
              }`}
              aria-label={`${productName} image ${index + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={`${productName} thumbnail ${index + 1}`}
                className="h-16 w-16 rounded-[10px] object-cover md:h-[72px] md:w-[72px]"
              />
            </button>
          );
        })}
      </div>

      <div className="order-1 aspect-[4/5] w-full overflow-hidden rounded-[24px] border border-[#e9ddd2] bg-[radial-gradient(circle_at_18%_18%,#ffffff,#f6eee8_58%,#f1e8df)] shadow-[0_24px_55px_rgba(20,12,10,0.1)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={activeImage} alt={productName} className="h-full w-full object-contain p-4 sm:p-6" />
      </div>
    </div>
  );
}
