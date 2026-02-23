"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

const SESSION_KEY = "sfane_website_session_id";

function readOrCreateSessionId() {
  if (typeof window === "undefined") return null;

  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;

  const generated =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  window.localStorage.setItem(SESSION_KEY, generated);
  return generated;
}

export function WebsiteClickTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin")) return;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !anonKey) return;

    const sessionId = readOrCreateSessionId();
    if (!sessionId) return;

    const track = async () => {
      const supabase = getSupabaseBrowserClient();
      const token = supabase ? (await supabase.auth.getSession()).data.session?.access_token : null;

      const headers: Record<string, string> = {
        apikey: anonKey,
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      try {
        await fetch(`${supabaseUrl}/functions/v1/track-website-event`, {
          method: "POST",
          headers,
          keepalive: true,
          body: JSON.stringify({
            session_id: sessionId,
            path: pathname,
            referrer: document.referrer || null,
          }),
        });
      } catch {
        // Ignore tracking failures to avoid impacting UX.
      }
    };

    void track();
  }, [pathname]);

  return null;
}
