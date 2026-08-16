export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Until Supabase credentials are added to .env.local the whole site runs off the
 * seed data in src/lib/seed.ts. That way the catalogue is browsable from the
 * first minute, and nothing breaks half-configured.
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const PRODUCT_IMAGE_BUCKET = "product-images";
