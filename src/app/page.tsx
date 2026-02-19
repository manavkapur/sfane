"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { manrope, playfairDisplay } from "@/lib/fonts";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const headlineFont = playfairDisplay;

const bodyFont = manrope;

function VideoSection() {
  const [open, setOpen] = useState(false);

  return (
    <section className="relative h-[58vh] min-h-[360px] w-full overflow-hidden sm:h-[62vh] md:snap-start md:h-screen">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group absolute inset-0 h-full w-full"
      >
        <video
          src="/safneVideo.mp4"
          poster="/sfanelogo.jpg"
          preload="metadata"
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/50" />

        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="max-w-3xl text-center text-white">
            <p className="text-xs uppercase tracking-[0.3em] text-white/80">
              Brand Film
            </p>
            <h2 className="mt-4 text-3xl font-semibold md:text-5xl">
              Built for the daily carry.
            </h2>
            <p className="mt-4 text-base text-white/80 md:text-lg">
              A quick look at how Sfane bags move with you—gym, office, and
              weekend travel.
            </p>

            <span className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/60 bg-white/10 px-6 py-3 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition group-hover:scale-[1.03]">
              Watch the film
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#1f140d]">
                ▶
              </span>
            </span>
          </div>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="relative w-full max-w-4xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute -top-10 right-0 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#1f140d]"
            >
              Close
            </button>
            <div className="overflow-hidden rounded-2xl bg-black shadow-[0_40px_90px_rgba(0,0,0,0.5)]">
              <video
                src="/safneVideo.mp4"
                controls
                autoPlay
                muted
                playsInline
                className="h-auto w-full"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function BestSellersSection() {
  const categories = [
    {
      name: "Duffle",
      slug: "duffle",
      image: "/DuffleBag.jpg",
      blurb: "Structured carry for gym, travel, and quick weekend moves.",
      meta: "Classic hold-all",
    },
    {
      name: "Toiletry Kit",
      slug: "toiletry-kit",
      image: "/Toiletrykit.jpeg",
      blurb: "Compact grooming carry with clean compartments for daily travel.",
      meta: "Travel organizer",
    },
    {
      name: "Tiffin",
      slug: "tiffin",
      image: "/Tiffin.jpg",
      blurb: "Clean lunch carry with practical insulation and structure.",
      meta: "Daily meal companion",
    },
  ];

  return (
    <section className="flex w-full items-start py-14 md:snap-start md:h-screen md:items-center md:py-0">
      <div className="mx-auto flex h-full w-full flex-col justify-start px-6 md:justify-center">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#7b5a45]">
              Categories
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-[#161312] md:text-4xl">
              Choose your everyday carry.
            </h2>
          </div>
          <Link
            href="/products"
            className="rounded-full border border-[#e7d7cc] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#6a4b36] transition hover:border-[#c8b4a6] hover:bg-white/70"
          >
            View All
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {categories.map((category, index) => (
            <motion.div
              key={category.slug}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              whileHover={{ y: -8 }}
              whileTap={{ scale: 0.985 }}
              className="group"
            >
              <Link
                href={`/products?category=${category.slug}`}
                className="relative block overflow-hidden rounded-[30px] border border-[#f1dfd0]/65 bg-[linear-gradient(160deg,rgba(250,245,240,0.28),rgba(235,220,206,0.12))] shadow-[0_26px_70px_rgba(20,12,10,0.18)] backdrop-blur-md transition-all duration-300 hover:border-[#f4e7da] hover:shadow-[0_38px_95px_rgba(20,12,10,0.24)]"
              >
                <div className="relative h-[340px] overflow-hidden rounded-[22px] bg-[#f2e6dc]/14">
                  <Image
                    src={category.image}
                    alt={category.name}
                    width={900}
                    height={700}
                    className="h-full w-full object-contain p-2 transition duration-700 group-hover:scale-[1.02]"
                  />

                  <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/16 to-transparent" />

                  <motion.div
                    className="absolute inset-0 bg-gradient-to-b from-[#25170f]/20 via-[#2b1b12]/12 to-[#2d1f15]/26"
                    animate={{ opacity: [0.56, 0.46, 0.56] }}
                    transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
                  />

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#1a120d]/54 via-[#1a120d]/22 to-transparent" />

                  <div className="absolute left-4 top-4 rounded-full border border-white/28 bg-[#2d1f15]/22 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.24em] text-[#fff8f2]/90 backdrop-blur-sm">
                    {category.meta}
                  </div>

                  <div className="absolute bottom-5 left-5 right-5 text-[#fff8f1]">
                    <h3 className="text-3xl font-semibold leading-none tracking-[-0.01em] text-[#fffaf6] drop-shadow-[0_8px_20px_rgba(0,0,0,0.62)]">
                      {category.name}
                    </h3>
                    <p className="mt-2 max-w-[95%] text-sm font-medium text-[#f9eee4]/92 drop-shadow-[0_5px_14px_rgba(0,0,0,0.58)]">
                      {category.blurb}
                    </p>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      className="inline-flex items-center gap-3 rounded-full border border-[#f6e7d8]/78 bg-[linear-gradient(135deg,rgba(33,23,17,0.74),rgba(33,23,17,0.58))] px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#fff7ef] shadow-[0_18px_44px_rgba(0,0,0,0.34)] backdrop-blur-md"
                      whileHover={{ scale: 1.04 }}
                      transition={{ type: "spring", stiffness: 360, damping: 20 }}
                    >
                      <span>{`Explore ${category.name}`}</span>
                      <motion.span
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#fff7ef] text-[#1f140d] shadow-[0_6px_16px_rgba(0,0,0,0.2)]"
                        animate={{ x: [0, 2, 0] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        →
                      </motion.span>
                    </motion.div>
                  </div>

                  <motion.div
                    className="pointer-events-none absolute inset-0 rounded-[22px] border border-white/24"
                    initial={{ opacity: 0.4 }}
                    whileHover={{ opacity: 0.9 }}
                    transition={{ duration: 0.25 }}
                  >
                  </motion.div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MaterialsSection() {
  return (
    <section className="flex w-full items-start py-14 md:snap-start md:min-h-screen md:items-center md:py-0">
      <div className="mx-auto w-full px-6 pb-16 pt-6 md:pb-24 md:pt-10">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[#7b5a45]">
            Materials & Craft
          </p>
          <h2 className="mt-4 text-4xl font-semibold text-[#161312] md:text-6xl">
            Looks durable. <span className="text-[#6a4b36]">Lives ready.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-base text-[#5a4637]">
            Built with premium polyester and clean construction, each bag stays
            light, durable, and ready for everyday performance.
          </p>
        </div>

        <div className="relative left-1/2 mt-16 w-screen -translate-x-1/2">
          <div className="absolute inset-x-0 -top-10 h-24 bg-[#f7f1ec] blur-3xl" />
          <div className="relative w-full">
            <Image
              src="/Allbags.png"
              alt="Sfane bag lineup"
              width={2200}
              height={1000}
              className="h-auto w-full object-cover drop-shadow-[0_30px_70px_rgba(20,12,10,0.2)]"
            />
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-4xl text-center text-sm text-[#6a4b36]">
          Designed for daily wear with a finish that stays sharp over time.
        </div>
      </div>
    </section>
  );
}

function MaterialCard({ feature }: { feature: { title: string; body: string } }) {
  return (
    <div className="rounded-[22px] border border-[#efe6de] bg-white/70 p-6 shadow-[0_18px_40px_rgba(20,12,10,0.08)]">
      <h3 className="text-base font-semibold text-[#1f140d]">
        {feature.title}
      </h3>
      <p className="mt-3 text-sm text-[#6a4b36]">{feature.body}</p>
    </div>
  );
}

function FooterSection() {
  return (
    <footer className="w-full bg-[#f3ede8]">
      <div className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <p className="text-lg font-semibold text-[#1f140d]">Sfane</p>
            <p className="mt-3 max-w-sm text-sm text-[#6a4b36]">
              Premium duffle, toiletry, and tiffin carry designed for everyday
              performance. Durable materials, refined details, and a clean
              finish.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <span className="rounded-full border border-[#e7d7cc] px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-[#7b5a45]">
                Jalandhar, IN
              </span>
              <span className="text-xs text-[#7b5a45]">
                © 2026 Sfane
              </span>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#7b5a45]">
              Shop
            </p>
            <ul className="mt-4 space-y-3 text-sm text-[#6a4b36]">
              <li>Bestsellers</li>
              <li>Duffle</li>
              <li>Toiletry</li>
              <li>Tiffin</li>
            </ul>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#7b5a45]">
              Company
            </p>
            <ul className="mt-4 space-y-3 text-sm text-[#6a4b36]">
              <li>About</li>
              <li>Materials & Craft</li>
              <li>Contact</li>
            </ul>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#7b5a45]">
              Custom & Bulk
            </p>
            <p className="mt-4 text-sm text-[#6a4b36]">
              For customise or bulk order, in-house manufacturing we can create
              for you.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <a
                href="tel:+919646005533"
                className="group inline-flex items-center gap-2 rounded-full border border-[#e7d7cc] bg-[linear-gradient(135deg,rgba(255,255,255,0.88),rgba(246,236,228,0.88))] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1f140d] shadow-[0_10px_28px_rgba(20,12,10,0.12)] transition hover:-translate-y-0.5 hover:border-[#d9c2b0] hover:shadow-[0_16px_34px_rgba(20,12,10,0.18)]"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#1f140d] text-white">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.7 2.6a2 2 0 0 1-.4 2.1L8 9.7a16 16 0 0 0 6.3 6.3l1.3-1.3a2 2 0 0 1 2.1-.4c.8.4 1.7.6 2.6.7A2 2 0 0 1 22 16.9z" />
                  </svg>
                </span>
                +91 9646005533
              </a>

              <a
                href="https://wa.me/919646005533"
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 rounded-full border border-[#cfe7d2] bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(228,248,231,0.88))] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1f140d] shadow-[0_10px_28px_rgba(20,12,10,0.12)] transition hover:-translate-y-0.5 hover:border-[#b7d8bc] hover:shadow-[0_16px_34px_rgba(20,12,10,0.18)]"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#25D366] text-white">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
                    <path d="M17.5 14.3c-.3-.1-1.8-.9-2.1-1-.3-.1-.5-.1-.7.1l-.6.7c-.2.2-.4.2-.7.1-1.8-.9-3-2.5-3.2-2.9-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.4.3-.6 0-.2 0-.4-.1-.5-.1-.1-.7-1.7-.9-2.3-.2-.6-.4-.5-.7-.5h-.6c-.2 0-.5.1-.7.3-.2.2-.8.8-.8 1.9 0 1.1.8 2.1.9 2.3.1.2 1.6 2.5 3.9 3.5.5.2 1 .4 1.4.5.6.2 1.1.2 1.5.1.5-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.3z" />
                    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-2.9-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
                  </svg>
                </span>
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[#e7d7cc] pt-6 text-xs text-[#7b5a45]">
          <span>Privacy · Terms</span>
          <span>support@sfane.in</span>
        </div>
      </div>
    </footer>
  );
}

// Pinned Product Section Component
function PinnedProductSection() {
  const containerRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 20,
    mass: 0.2,
  });

  const products = [
    {
      id: 1,
      title: "Duffle",
      description: "Structured builds with clean storage for gym, travel, and quick weekends.",
      icon: "🎒",
      image: "/DuffleBag.jpg",
      bgGradient: "from-[#2d1f15] via-[#3d2819] to-[#2d1f15]",
      accentGradient: "from-[#8b6f47] to-[#6a4b36]",
    },
    {
      id: 2,
      title: "Sling",
      description: "Compact, ergonomic carry for essentials that stay close and secure.",
      icon: "💼",
      image: "/SlingBag.jpg",
      bgGradient: "from-[#4a3426] via-[#5d4230] to-[#4a3426]",
      accentGradient: "from-[#a07856] to-[#7b5a45]",
    },
    {
      id: 3,
      title: "Tiffin",
      description: "Smart lunch carriers designed for durability, insulation, and style.",
      icon: "🍱",
      image: "/Tiffin.jpg",
      bgGradient: "from-[#f9f5f2] via-[#f6f0eb] to-[#f9f5f2]",
      accentGradient: "from-[#d4a574] to-[#b8956a]",
    },
  ];

  return (
    <div ref={containerRef} className="relative h-[280vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Background */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#f6f3f1] via-[#ebe5df] to-[#f6f3f1]">
          <motion.div
            className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-white/40 blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Content Container */}
          <div className="relative flex h-full items-center justify-center px-6">
          <div className="relative h-[78vh] w-full max-w-5xl md:h-[78vh] lg:h-[82vh]">
            {products.map((product, index) => {
              const cardStart = index / 3;
              const cardEnd = (index + 1) / 3;

              const opacity = useTransform(
                progress,
                [Math.max(0, cardStart - 0.1), cardStart, cardEnd - 0.1, cardEnd],
                [0, 1, 1, 0]
              );

              const scale = useTransform(
                progress,
                [Math.max(0, cardStart - 0.08), cardStart + 0.06, cardEnd - 0.06, cardEnd],
                [0.9, 1, 1, 0.9]
              );

              const rotateY = useTransform(
                progress,
                [Math.max(0, cardStart - 0.08), cardStart + 0.06, cardEnd - 0.06, cardEnd],
                [index % 2 === 0 ? -10 : 10, 0, 0, index % 2 === 0 ? 10 : -10]
              );

              const rotateX = useTransform(
                progress,
                [Math.max(0, cardStart - 0.08), cardStart + 0.06, cardEnd - 0.06, cardEnd],
                [6, 0, 0, -6]
              );

              const z = useTransform(
                progress,
                [cardStart, cardStart + 0.05, cardEnd - 0.05, cardEnd],
                [0, 70, 70, 0]
              );

              const isDark = product.id !== 3;

              return (
                <motion.div
                  key={product.id}
                  className="absolute inset-0"
                  style={{
                    opacity,
                    scale,
                    rotateY,
                    rotateX,
                    z,
                    transformStyle: "preserve-3d",
                    transformPerspective: "1000px",
                  }}
                >
                  <motion.div
                    className={`group relative h-full w-full overflow-hidden rounded-[40px] bg-gradient-to-br ${product.bgGradient} shadow-[0_30px_80px_rgba(20,12,10,0.25)] will-change-transform`}
                    whileHover={{
                      scale: 1.01,
                      boxShadow: "0 40px 90px rgba(20, 12, 10, 0.35)",
                    }}
                    transition={{ type: "spring", stiffness: 260, damping: 24 }}
                  >
                    <div className="relative z-10 h-full p-6 sm:p-8 md:p-14">
                      <div className="grid h-full grid-cols-1 gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-center md:gap-10">
                        <div className="min-w-0">
                          <motion.div
                            className={`mb-8 inline-flex h-16 w-16 items-center justify-center rounded-3xl ${
                              isDark ? "bg-white/15 backdrop-blur-md" : "bg-[#2d1f15]/10"
                            } text-4xl shadow-lg md:h-20 md:w-20 md:text-5xl`}
                            whileHover={{ scale: 1.06 }}
                          >
                            {product.icon}
                          </motion.div>

                          <h3
                            className={`text-3xl font-bold tracking-tight sm:text-4xl md:text-6xl lg:text-7xl ${
                              isDark ? "text-white" : "text-[#161312]"
                            }`}
                          >
                            {product.title}
                          </h3>

                          <p
                            className={`mt-4 max-w-lg text-sm leading-relaxed sm:text-base md:mt-6 md:text-xl lg:text-2xl ${
                              isDark ? "text-white/85" : "text-[#5a4637]"
                            }`}
                          >
                            {product.description}
                          </p>

                          <div className="mt-8 space-y-3 md:mt-10 md:space-y-4">
                            {["Premium materials", "Lifetime durability", "Thoughtful design"].map(
                              (feature, i) => (
                                <div key={i} className="flex items-center gap-3">
                                  <motion.div
                                    className={`h-2 w-2 rounded-full ${
                                      isDark ? "bg-white/60" : "bg-[#6a4b36]/60"
                                    }`}
                                    animate={{
                                      scale: [1, 1.3, 1],
                                      opacity: [0.6, 1, 0.6],
                                    }}
                                    transition={{
                                      duration: 2,
                                      delay: i * 0.3,
                                      repeat: Infinity,
                                    }}
                                  />
                                  <span
                                    className={`text-sm md:text-base ${
                                      isDark ? "text-white/70" : "text-[#5a4637]/70"
                                    }`}
                                  >
                                    {feature}
                                  </span>
                                </div>
                              )
                            )}
                          </div>

                          <div className="mt-7 flex w-full flex-wrap items-center gap-3">
                            <motion.button
                              className={cn(
                                "w-full rounded-full px-6 py-3 text-sm font-semibold shadow-lg transition-all sm:w-auto sm:px-7 sm:py-3.5 sm:text-base",
                                isDark
                                  ? "bg-white/20 text-white backdrop-blur-md hover:bg-white/30"
                                  : "bg-[#2d1f15] text-white hover:bg-[#1f140d]"
                              )}
                              whileHover={{ scale: 1.03, y: -1 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              Explore {product.title}
                            </motion.button>

                            <div
                              className={cn(
                                "flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:px-5 sm:py-2.5 sm:text-sm",
                                isDark ? "bg-white/10 backdrop-blur-md" : "bg-[#2d1f15]/10"
                              )}
                            >
                              <div
                                className={`h-2 w-2 rounded-full bg-gradient-to-r ${product.accentGradient}`}
                              />
                              <span
                                className={`font-medium ${
                                  isDark ? "text-white/80" : "text-[#5a4637]"
                                }`}
                              >
                                In Stock
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-center pb-12 md:pb-0">
                          <div
                            className={cn(
                              "relative h-[120px] w-full max-w-[120px] overflow-hidden rounded-[18px] border shadow-[0_12px_32px_rgba(20,12,10,0.16)] sm:h-[160px] sm:max-w-[160px] md:h-[320px] md:max-w-[360px] md:rounded-[28px] md:shadow-[0_28px_70px_rgba(20,12,10,0.32)]",
                              isDark
                                ? "border-white/15 bg-white/10 backdrop-blur-md"
                                : "border-[#e7d7cc] bg-white/90"
                            )}
                          >
                            <Image
                              src={product.image}
                              alt={`${product.title} bag`}
                              width={900}
                              height={900}
                              className="h-full w-full object-contain"
                            />
                            <div
                              className={cn(
                                "absolute inset-0",
                                isDark
                                  ? "bg-gradient-to-t from-black/20 via-transparent to-transparent"
                                  : "bg-gradient-to-t from-[#f5efe9]/35 via-transparent to-transparent"
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <motion.div
                      className={`absolute -inset-[3px] -z-10 rounded-[43px] bg-gradient-to-br ${product.accentGradient} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-45`}
                    />

                    <div
                      className={`absolute left-8 top-8 h-12 w-12 rounded-tl-3xl border-l-2 border-t-2 ${
                        isDark ? "border-white/20" : "border-[#2d1f15]/20"
                      }`}
                    />
                    <div
                      className={`absolute bottom-8 right-8 h-12 w-12 rounded-br-3xl border-b-2 border-r-2 ${
                        isDark ? "border-white/20" : "border-[#2d1f15]/20"
                      }`}
                    />
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Scroll Progress Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-4 py-2 backdrop-blur-md">
            <span className="text-xs font-medium text-[#5a4637]">Scroll to explore</span>
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => {
                const isActive = useTransform(progress, [i / 3, (i + 1) / 3], [0, 1]);

                return (
                  <motion.div
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-[#6a4b36]"
                    style={{
                      opacity: useTransform(isActive, [0, 0.5, 1], [0.3, 0.6, 1]),
                      scale: useTransform(isActive, [0, 0.5, 1], [1, 1.2, 1]),
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDesktopHeroMotion, setIsDesktopHeroMotion] = useState(false);
  const heroRef = useRef(null);
  const showPinnedProductSection =
    process.env.NEXT_PUBLIC_ENABLE_PINNED_PRODUCT_SECTION === "true";

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.92]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsDesktopHeroMotion(media.matches);
    sync();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", sync);
      return () => media.removeEventListener("change", sync);
    }

    media.addListener(sync);
    return () => media.removeListener(sync);
  }, []);

  const heroText = useMemo(
    () => ({
      hidden: { opacity: 0, y: 18 },
      show: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: 0.15 + i * 0.12, duration: 0.6 },
      }),
    }),
    []
  );

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.92, rotateX: 8 },
    show: {
      opacity: 1,
      scale: 1,
      rotateX: 0,
      transition: { delay: 0.5, duration: 0.9, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  const floatingElements = useMemo(
    () => [
      { size: 180, x: "10%", y: "15%", delay: 0, duration: 4.5, blur: "blur-3xl" },
      { size: 220, x: "75%", y: "25%", delay: 1.2, duration: 5.5, blur: "blur-3xl" },
      { size: 160, x: "85%", y: "70%", delay: 2, duration: 4.8, blur: "blur-2xl" },
      { size: 140, x: "5%", y: "80%", delay: 0.8, duration: 5.2, blur: "blur-2xl" },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-[#f6f3f1] text-slate-900">
      <SiteHeader />

      <main className="mx-auto w-full px-0 pb-24 pt-0 md:snap-y md:snap-mandatory">
        {/* HERO SECTION */}
        <section
          ref={heroRef}
          className="relative min-h-[calc(100dvh-80px)] w-full overflow-visible bg-[#f6f3f1] px-6 pb-20 pt-20 md:min-h-[calc(100vh-80px)] md:overflow-hidden md:pb-0 md:pt-28"
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const x = (event.clientX - rect.left - rect.width / 2) / rect.width;
            const y = (event.clientY - rect.top - rect.height / 2) / rect.height;
            setParallax({ x: x * 12, y: y * 12 });
          }}
          onMouseLeave={() => setParallax({ x: 0, y: 0 })}
        >
          {/* Enhanced animated background orbs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {floatingElements.map((orb, i) => (
              <motion.div
                key={i}
                className={`absolute rounded-full ${orb.blur}`}
                style={{
                  width: orb.size,
                  height: orb.size,
                  left: orb.x,
                  top: orb.y,
                  background:
                    i % 2 === 0
                      ? "radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(239,231,225,0.6) 100%)"
                      : "radial-gradient(circle, rgba(243,237,232,0.9) 0%, rgba(255,255,255,0.5) 100%)",
                }}
                animate={{
                  y: [0, -15, 0],
                  x: [0, 10, 0],
                  scale: [1, 1.08, 1],
                  opacity: [0.7, 0.95, 0.7],
                }}
                transition={{
                  duration: orb.duration,
                  delay: orb.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          {/* Animated gradient mesh */}
          <div className="pointer-events-none absolute inset-0">
            <div
              className="absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-[100px]"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(106,75,54,0.15) 0%, transparent 70%)",
                transform: `translate(${mousePos.x / 50 - 50}%, ${mousePos.y / 50 - 50}%) scale(1.2)`,
                transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          </div>

          {/* Decorative particles */}
          <div className="pointer-events-none absolute inset-0">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-1.5 w-1.5 rounded-full bg-gradient-to-br from-[#6a4b36]/20 to-[#6a4b36]/5"
                style={{
                  left: `${15 + i * 7.5}%`,
                  top: `${20 + (i % 3) * 25}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.3, 1],
                }}
                transition={{
                  duration: 3 + i * 0.3,
                  delay: i * 0.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          <motion.div
            className={cn(
              "relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 md:grid-cols-[1.05fr_0.95fr] md:gap-20",
              bodyFont.className
            )}
            style={
              isDesktopHeroMotion
                ? { y, opacity, scale }
                : { y: "0%", opacity: 1, scale: 1 }
            }
          >
            <div className="max-w-xl">
              <motion.div
                className="flex items-center gap-3.5"
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.6 }}
                custom={0}
                variants={heroText}
              >
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Image
                    src="/sfanelogo.jpg"
                    alt="Sfane logo"
                    width={140}
                    height={46}
                    className="h-9 w-auto transition-all duration-300"
                  />
                </motion.div>
                <motion.span
                  className="rounded-full border border-[#e7d7cc]/60 bg-white/90 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#6a4b36] shadow-sm backdrop-blur-sm"
                  whileHover={{
                    scale: 1.05,
                    borderColor: "rgba(106, 75, 54, 0.3)",
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  Everyday Carry
                </motion.span>
              </motion.div>

              <motion.h1
                className={cn(
                  "mt-7 text-5xl font-semibold leading-[1.02] tracking-[-0.02em] text-[#161312] md:text-[4.5rem]",
                  headlineFont.className
                )}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.6 }}
                custom={1}
                variants={heroText}
              >
                {["Carry bold.", " Move light.", " Travel Sfane."].map((text, i) => (
                  <motion.span
                    key={i}
                    className="inline-block"
                    whileHover={{
                      y: -4,
                      color: "#6a4b36",
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    {text}
                  </motion.span>
                ))}
              </motion.h1>

              <motion.p
                className="mt-6 max-w-xl text-base leading-relaxed text-[#5a4637]/90 md:text-lg"
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.6 }}
                custom={2}
                variants={heroText}
              >
                Premium duffle, toiletry kits , and tiffin gear made for gym days, office runs,
                and quick getaways. Clean lines, durable builds, and a confident finish.
              </motion.p>

              <motion.div
                className="mt-9 flex flex-wrap items-center gap-4"
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.6 }}
                custom={3}
                variants={heroText}
              >
                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button
                    asChild
                    className="group relative overflow-hidden bg-[#1f140d] px-7 py-6 text-white shadow-lg shadow-[#1f140d]/20 transition-all duration-300 hover:bg-[#120b07] hover:shadow-xl hover:shadow-[#1f140d]/30"
                  >
                    <Link href="/products">
                      <span className="relative z-10">Shop now</span>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-[#6a4b36]/20 to-transparent"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                      />
                    </Link>
                  </Button>
                </motion.div>
              </motion.div>

              <motion.div
                className="mt-12 flex items-center gap-7 text-xs text-[#7b5a45]"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
              >
                <motion.span
                  className="relative uppercase tracking-[0.3em]"
                  whileHover={{ x: 3 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  Signature Duffle
                  <motion.div
                    className="absolute -bottom-1 left-0 h-[1px] w-0 bg-[#7b5a45]"
                    whileHover={{ width: "100%" }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.span>
                <span className="opacity-60">Ready for gym + travel</span>
              </motion.div>
            </div>

            <motion.div
              className="relative"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.4 }}
              variants={imageVariants}
              animate={{ x: parallax.x, y: parallax.y }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
            >
              {/* Animated glow effects */}
              <motion.div
                className="absolute -left-12 top-12 h-28 w-28 rounded-full bg-white/80 blur-2xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.6, 0.8, 0.6],
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute -right-14 bottom-8 h-32 w-32 rounded-full bg-white/80 blur-2xl"
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.7, 0.9, 0.7],
                }}
                transition={{
                  duration: 4,
                  delay: 1,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Floating accent elements */}
              <motion.div
                className="absolute -left-8 top-1/4 h-3 w-3 rounded-full bg-gradient-to-br from-[#6a4b36]/40 to-[#6a4b36]/10 shadow-lg"
                animate={{
                  y: [0, -15, 0],
                  x: [0, 8, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute -right-6 top-1/3 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-[#6a4b36]/30 to-[#6a4b36]/10 shadow-md"
                animate={{
                  y: [0, -20, 0],
                  x: [0, -10, 0],
                  scale: [1, 1.3, 1],
                }}
                transition={{
                  duration: 5,
                  delay: 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              <motion.div
                className="group relative overflow-hidden rounded-[32px] border border-white/80 bg-white/70 p-2.5 shadow-[0_40px_100px_rgba(20,12,10,0.25)] backdrop-blur-sm transition-all duration-500 hover:shadow-[0_50px_120px_rgba(20,12,10,0.3)]"
                whileHover={{
                  scale: 1.02,
                  rotateY: 3,
                  rotateX: -2,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {/* Shimmer effect on hover */}
                <motion.div
                  className="absolute inset-0 z-10 rounded-[30px] bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  initial={{ x: "-100%", opacity: 0 }}
                  whileHover={{ x: "100%", opacity: 1 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                />

                <div className="relative overflow-hidden rounded-[26px]">
                  <Image
                    src="/sfanelog1.jpg"
                    alt="Sfane duffle bag in gym setting"
                    width={980}
                    height={700}
                    className="h-auto w-full object-cover transition-all duration-700 group-hover:scale-105"
                    priority
                  />

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1f140d]/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                </div>
              </motion.div>

              {/* Floating badge */}
              <motion.div
                className="absolute -bottom-6 -right-4 rounded-2xl border border-white/70 bg-white/95 px-5 py-3.5 shadow-2xl shadow-[#1f140d]/20 backdrop-blur-md"
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: 1.2,
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1] as const,
                }}
                whileHover={{
                  scale: 1.05,
                  y: -4,
                  boxShadow: "0 25px 50px rgba(31, 20, 13, 0.3)",
                }}
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    className="h-10 w-10 rounded-full bg-gradient-to-br from-[#6a4b36] to-[#1f140d]"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
                      ★
                    </div>
                  </motion.div>
                  <div>
                    <div className="text-xs font-semibold text-[#1f140d]">Premium Build</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-12 left-1/2 hidden -translate-x-1/2 md:block"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.6 }}
          >
            <motion.div
              className="flex flex-col items-center gap-2 text-[#7b5a45]/60"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="text-[10px] uppercase tracking-[0.2em]">Scroll</span>
              <motion.div
                className="h-10 w-5 rounded-full border-2 border-[#7b5a45]/40 p-1"
                whileHover={{ borderColor: "rgba(123, 90, 69, 0.6)" }}
              >
                <motion.div
                  className="h-1.5 w-full rounded-full bg-[#7b5a45]/60"
                  animate={{ y: [0, 12, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* PINNED PRODUCT SECTION (flagged off by default) */}
        {showPinnedProductSection ? <PinnedProductSection /> : null}

        <VideoSection />

        <BestSellersSection />

        <MaterialsSection />

        <FooterSection />
      </main>
    </div>
  );
}
