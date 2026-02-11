import { SiteHeader } from "@/components/site-header";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] text-slate-900">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl px-6 pb-24 pt-16">
        <section className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
              Mac mini
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
              More muscle. More memory. More mini.
            </h1>
            <p className="mt-5 max-w-lg text-base text-slate-600">
              A compact desktop designed to stay out of the way until you need
              it. Engineered for pro apps, deep focus, and an effortlessly clean
              workspace.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-600">
              <div className="rounded-full border border-slate-200 bg-white/70 px-4 py-2">
                M-series performance
              </div>
              <div className="rounded-full border border-slate-200 bg-white/70 px-4 py-2">
                Up to 32GB unified memory
              </div>
              <div className="rounded-full border border-slate-200 bg-white/70 px-4 py-2">
                Thunderbolt 4
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-white via-slate-100 to-slate-200 p-10 shadow-[0_30px_60px_rgba(15,23,42,0.12)]">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/70 blur-2xl" />
            <div className="absolute -bottom-16 left-6 h-48 w-48 rounded-full bg-slate-300/60 blur-3xl" />
            <div className="relative z-10">
              <div className="aspect-[4/3] rounded-2xl bg-white/90 shadow-inner" />
              <p className="mt-6 text-xs uppercase tracking-[0.32em] text-slate-500">
                Apple-inspired scene
              </p>
            </div>
          </div>
        </section>

        <section className="mt-24 grid gap-6 md:grid-cols-3">
          {["Design", "Performance", "Connectivity"].map((title) => (
            <div
              key={title}
              className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-[0_20px_40px_rgba(15,23,42,0.08)]"
            >
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-3 text-sm text-slate-600">
                Carefully balanced proportions, soft materials, and a quiet
                confidence that fits everywhere.
              </p>
            </div>
          ))}
        </section>

        <section className="mt-24 space-y-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-white/60 bg-white/70 p-6 text-sm text-slate-600 shadow-[0_20px_40px_rgba(15,23,42,0.08)]"
            >
              This filler content is here to make the header sticky while you
              scroll, mirroring the second screenshot behavior.
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
