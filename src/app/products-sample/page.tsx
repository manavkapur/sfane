import Link from "next/link";
import { SAMPLE_PRODUCT, formatINR } from "@/lib/sample-product";

export default function ProductsSamplePage() {
  return (
    <main className="min-h-screen bg-[#f6f3f1] px-6 pb-20 pt-16">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#7b5a45]">Products</p>
            <h1 className="mt-4 text-3xl font-semibold text-[#161312] md:text-4xl">
              Built for daily carry, styled for everyday.
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-[#5a4637]">
              Sample catalog page. Click the card to open the full product detail page.
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Link
            href={`/products-sample/${SAMPLE_PRODUCT.slug}`}
            className="group relative flex flex-col overflow-hidden rounded-[24px] border border-[#efe6de] bg-white/90 shadow-[0_20px_50px_rgba(20,12,10,0.12)] transition hover:-translate-y-1 hover:shadow-[0_30px_70px_rgba(20,12,10,0.16)]"
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#f6f3f1]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={SAMPLE_PRODUCT.cardImage}
                alt={SAMPLE_PRODUCT.name}
                className="h-full w-full object-contain p-6 transition duration-500 group-hover:scale-[1.03]"
              />
            </div>
            <div className="flex flex-1 flex-col gap-2 px-6 pb-6 pt-5">
              <h3 className="text-lg font-semibold text-[#1f140d]">{SAMPLE_PRODUCT.name}</h3>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-[#1f140d]">{formatINR(SAMPLE_PRODUCT.price)}</span>
                <span className="text-sm text-[#a18675] line-through">{formatINR(SAMPLE_PRODUCT.originalPrice)}</span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
