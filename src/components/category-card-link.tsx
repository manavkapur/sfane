"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";

type CategoryCardLinkProps = {
  href: string;
  className: string;
  children: ReactNode;
};

/**
 * Gives category cards instant acknowledgement while the server-rendered
 * product listing is being fetched.
 */
export function CategoryCardLink({ href, className, children }: CategoryCardLinkProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Link
      href={href}
      prefetch
      aria-busy={isPending}
      onMouseEnter={() => router.prefetch(href)}
      onFocus={() => router.prefetch(href)}
      onClick={(event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }

        event.preventDefault();
        startTransition(() => router.push(href));
      }}
      className={`${className} ${isPending ? "cursor-progress" : ""}`}
    >
      {children}
      {isPending ? (
        <span className="absolute inset-0 z-20 grid place-items-center bg-[#1f140d]/38 backdrop-blur-[2px]" aria-live="polite">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#1f140d] shadow-lg">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#c28f6c] border-t-transparent" />
            Loading
          </span>
        </span>
      ) : null}
    </Link>
  );
}
