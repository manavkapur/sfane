const CANONICAL_SITE_URL = "https://sfane.in";

/**
 * Auth emails must always return to the canonical production host. Using the
 * browser origin can accidentally produce a www, preview, or localhost URL
 * that is not on Supabase's redirect allowlist.
 */
export function passwordResetRedirectUrl() {
  return `${CANONICAL_SITE_URL}/reset-password`;
}
