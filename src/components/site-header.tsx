"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { cormorantGaramond } from "@/lib/fonts";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  "Bestsellers",
  "New Arrivals",
  "Offers",
  "Duffle",
  "Sling",
  "Tiffin",
];

const navFont = cormorantGaramond;

export function SiteHeader() {
  const { scrollY, scrollYProgress } = useScroll();
  const [showStatic, setShowStatic] = useState(true);
  const [showCompact, setShowCompact] = useState(false);

  useEffect(() => {
    const progress = scrollYProgress.get();
    setShowStatic(progress <= 0.02);
    setShowCompact(progress >= 0.25);
  }, [scrollYProgress]);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setShowStatic(latest <= 0.02);
    setShowCompact(latest >= 0.25);
  });

  return (
    <motion.header className="sticky top-0 z-50 w-full">
      <motion.div
        className="border-b border-slate-200/60 bg-[#f5f5f7]"
        animate={{
          height: showStatic ? 48 : 0,
          opacity: showStatic ? 1 : 0,
        }}
        transition={{ duration: 0.18 }}
        style={{
          overflow: "hidden",
          pointerEvents: showStatic ? "auto" : "none",
        }}
      >
        <div className="mx-auto flex h-12 w-full max-w-6xl items-center px-5">
          <div className="flex flex-1 items-center">
            <span className="text-lg font-semibold italic tracking-tight text-[#e57e2c]">
              Sfane
            </span>
          </div>

          <nav
            className={cn(
              "hidden flex-1 items-center justify-center gap-5 text-[13px] tracking-[0.04em] text-slate-700 md:flex",
              navFont.className
            )}
          >
            {navItems.map((item) => (
              <button
                key={item}
                className="whitespace-nowrap transition-colors hover:text-slate-900"
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="flex flex-1 items-center justify-end gap-3">
            <button className="text-slate-700 transition-colors hover:text-slate-900">
              <SearchIcon className="h-4 w-4" />
            </button>
            <button className="relative text-slate-700 transition-colors hover:text-slate-900">
              <BagIcon className="h-4 w-4" />
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[10px] text-white">
                1
              </span>
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div
        className={cn(
          "border-b border-transparent bg-white/30 backdrop-blur-3xl backdrop-saturate-150",
          showCompact && "border-slate-200/70"
        )}
        animate={{
          backgroundColor: showCompact ? "rgba(255,255,255,0.35)" : "rgba(245,245,247,0)",
          boxShadow: showCompact
            ? "0 10px 30px rgba(15, 23, 42, 0.08)"
            : "0 0 0 rgba(0,0,0,0)",
          height: showCompact ? 44 : 0,
          opacity: showCompact ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
        style={{
          backdropFilter: showCompact ? "blur(30px)" : "blur(0px)",
          overflow: "hidden",
          pointerEvents: showCompact ? "auto" : "none",
        }}
      >
        <div className="mx-auto flex h-11 w-full max-w-6xl items-center justify-between gap-6 px-5">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold italic tracking-tight text-[#e57e2c]">
              Sfane
            </span>
          </div>

          <div
            className={cn(
              "hidden items-center gap-6 text-xs tracking-[0.06em] text-slate-600 md:flex",
              navFont.className
            )}
          >
            {["Bestsellers", "New Arrivals", "Duffle", "Sling", "Tiffin"].map(
              (item) => (
                <button
                  key={item}
                  className="whitespace-nowrap transition-colors hover:text-slate-900"
                >
                  {item}
                </button>
              )
            )}
          </div>

          <Button size="sm">Buy</Button>
        </div>
      </motion.div>
    </motion.header>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function BagIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6.5 8.5h11l-.8 11.2a2 2 0 0 1-2 1.8H9.3a2 2 0 0 1-2-1.8L6.5 8.5Z" />
      <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
    </svg>
  );
}
