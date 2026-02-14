import Link from "next/link";
import { notFound } from "next/navigation";
import { SAMPLE_PRODUCT, formatINR } from "@/lib/sample-product";

export default async function ProductSampleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (slug !== SAMPLE_PRODUCT.slug) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#0f1111]">
      <div className="mx-auto grid w-full max-w-[1400px] gap-8 px-6 pb-16 pt-10 lg:grid-cols-[90px_1fr_420px]">
        <aside className="space-y-3 lg:sticky lg:top-8 lg:self-start">
          {SAMPLE_PRODUCT.gallery.map((image, index) => (
            <button
              key={image}
              type="button"
              className="block w-full overflow-hidden rounded-xl border border-[#d5d9d9] bg-white p-1"
              aria-label={`Product image ${index + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt={`${SAMPLE_PRODUCT.name} ${index + 1}`} className="h-16 w-full object-cover" />
            </button>
          ))}
        </aside>

        <section>
          <div className="overflow-hidden rounded-2xl border border-[#e3e6e6] bg-white p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SAMPLE_PRODUCT.gallery[0]} alt={SAMPLE_PRODUCT.name} className="w-full rounded-xl object-cover" />
          </div>

          <div className="mt-8 rounded-2xl border border-[#e3e6e6] bg-white p-6">
            <h2 className="text-2xl font-semibold">From the Brand</h2>
            <p className="mt-4 text-base leading-7 text-[#37475a]">{SAMPLE_PRODUCT.description}</p>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {SAMPLE_PRODUCT.gallery.slice(1, 5).map((image) => (
                <div key={image} className="rounded-xl border border-[#e3e6e6] p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt={SAMPLE_PRODUCT.name} className="h-40 w-full rounded-lg object-cover" />
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                    {SAMPLE_PRODUCT.bullets.slice(0, 4).map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-8 overflow-hidden rounded-2xl border border-[#e3e6e6]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={SAMPLE_PRODUCT.gallery[5]} alt={SAMPLE_PRODUCT.name} className="w-full object-cover" />
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-[1.2fr_1fr]">
              <div>
                <h3 className="text-3xl font-semibold text-[#f08804]">Sfane</h3>
                <p className="mt-3 text-lg font-semibold">Give Spark To Game!</p>
                <p className="mt-4 text-base text-[#37475a]">Hit the gym with a waterproof shoe compartment and all-day carry comfort.</p>
              </div>
              <div className="rounded-xl border border-[#e3e6e6] bg-[#fafafa] p-4">
                <p className="text-xl font-semibold">Features</p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-base text-[#111]">
                  {SAMPLE_PRODUCT.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-5 lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-2xl border border-[#e3e6e6] bg-white p-6">
            <h1 className="text-[40px] font-semibold leading-[1.2]">{SAMPLE_PRODUCT.name}</h1>
            <p className="mt-3 text-[#007185]">Visit the Sfane Store</p>
            <p className="mt-3 text-sm text-[#565959]">
              {SAMPLE_PRODUCT.rating} stars ({SAMPLE_PRODUCT.reviewCount.toLocaleString("en-IN")})
            </p>
            <p className="mt-1 text-sm font-semibold">{SAMPLE_PRODUCT.soldLastMonth}</p>

            <div className="mt-6 border-t border-[#e7e7e7] pt-5">
              <p className="inline-block rounded-md bg-[#cc0c39] px-3 py-1 text-sm font-semibold text-white">Limited time deal</p>
              <div className="mt-3 flex items-end gap-3">
                <span className="text-[42px] leading-none text-[#cc0c39]">-{SAMPLE_PRODUCT.discountPercent}%</span>
                <span className="text-5xl font-semibold leading-none">{formatINR(SAMPLE_PRODUCT.price)}</span>
              </div>
              <p className="mt-2 text-sm text-[#565959]">
                M.R.P. <span className="line-through">{formatINR(SAMPLE_PRODUCT.originalPrice)}</span>
              </p>
              <p className="mt-4 text-2xl font-semibold text-[#007600]">{SAMPLE_PRODUCT.available}</p>
            </div>

            <div className="mt-6 space-y-3">
              <button className="w-full rounded-full bg-[#ffd814] px-5 py-3 text-base font-semibold">Add to cart</button>
              <button className="w-full rounded-full bg-[#ffa41c] px-5 py-3 text-base font-semibold">Buy now</button>
            </div>

            <p className="mt-6 text-sm text-[#565959]">Sold by {SAMPLE_PRODUCT.brand}. Secure transaction.</p>
          </div>

          <Link href="/products-sample" className="block text-center text-sm font-semibold text-[#0066c0] hover:underline">
            Back to sample products
          </Link>
        </aside>
      </div>
    </main>
  );
}
