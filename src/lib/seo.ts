const DEFAULT_PROD_URL = "https://sfane.in";

export function getSiteUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  const fallback = process.env.NODE_ENV === "production"
    ? DEFAULT_PROD_URL
    : "http://localhost:3000";
  const raw = (envUrl || fallback).trim();

  try {
    const parsed = new URL(raw);
    return parsed.origin;
  } catch {
    return fallback;
  }
}

export function absoluteUrl(path = "/") {
  const base = getSiteUrl();
  return new URL(path, base).toString();
}
