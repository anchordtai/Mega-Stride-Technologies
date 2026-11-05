// Pure configuration validation, also exercised by isolation tests.
export const megaStrideProjectRef = "okknsxrhbiiunjlaitcy";
export function databaseConfig(
  env: Record<string, string | undefined> = process.env,
) {
  const ref = env.MEGA_STRIDE_SUPABASE_PROJECT_REF;
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_PUBLISHABLE_KEY;
  if (!ref || !url || !key)
    throw new Error("Mega Stride database is not configured.");
  if (ref !== megaStrideProjectRef)
    throw new Error("Only the verified Mega Stride project is permitted.");
  if (!/^[a-z]{20}$/.test(ref) || url !== `https://${ref}.supabase.co`)
    throw new Error(
      "Dedicated database configuration does not match its pinned project reference.",
    );
  // Known unrelated projects may never be used, even accidentally.
  if (
    [
      "yaicqepqhpskcoqcvoqf",
      "vlksqjwupktmvypfmfur",
      "kjefreqibschtfdwyyfu",
    ].includes(ref)
  )
    throw new Error("An unrelated application database is forbidden.");
  if (!key.startsWith("sb_publishable_"))
    throw new Error(
      "Use only the new dedicated project publishable key for user sessions.",
    );
  return { url, key, ref };
}
export function databaseReady() {
  try {
    databaseConfig();
    return true;
  } catch {
    return false;
  }
}

// Reading public content and accepting private enquiries have separate activation requirements.
export function intakeReady(
  env: Record<string, string | undefined> = process.env,
) {
  try {
    databaseConfig(env);
  } catch {
    return false;
  }
  if (!env.SUPABASE_SERVICE_ROLE_KEY) return false;
  if (
    env.NODE_ENV === "production" &&
    (!env.TURNSTILE_SECRET_KEY ||
      !env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
      !env.RATE_LIMIT_SALT)
  )
    return false;
  return true;
}
