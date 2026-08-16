"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/admin/action-state";
import { slugify } from "@/lib/slug";
import { getServerSupabase } from "@/lib/supabase/server";

const str = (fd: FormData, key: string) => (fd.get(key) ?? "").toString().trim();
const num = (fd: FormData, key: string) => {
  const value = Number(str(fd, key));
  return Number.isFinite(value) ? value : 0;
};
const bool = (fd: FormData, key: string) => str(fd, key) === "on" || str(fd, key) === "true";
const json = <T,>(fd: FormData, key: string, fallback: T): T => {
  try {
    const raw = str(fd, key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

async function requireAdmin() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  return supabase;
}

function refreshPublicPages() {
  revalidatePath("/", "layout");
}

/* ------------------------------------------------------------- products -- */

export async function saveProduct(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await requireAdmin();

  const name = str(fd, "name");
  if (!name) return { ok: false, message: "Give the candle a name." };

  const collectionSlug = str(fd, "collection_slug");
  if (!collectionSlug) return { ok: false, message: "Pick a collection." };

  const images = json<string[]>(fd, "images", []);
  if (images.length === 0) return { ok: false, message: "Add at least one photo." };

  const tiers = json<{ minQty: number; price: number }[]>(fd, "price_tiers", [])
    .filter((t) => t.minQty > 0 && t.price > 0)
    .sort((a, b) => a.minQty - b.minQty);

  const row = {
    slug: str(fd, "slug") || slugify(name),
    name,
    collection_slug: collectionSlug,
    tagline: str(fd, "tagline"),
    description: str(fd, "description"),
    images,
    size_chart_image: str(fd, "size_chart_image") || null,
    fragrance: str(fd, "fragrance"),
    wax_type: str(fd, "wax_type"),
    wick_type: str(fd, "wick_type"),
    burn_time_hours: num(fd, "burn_time_hours"),
    height_cm: num(fd, "height_cm"),
    diameter_cm: num(fd, "diameter_cm"),
    weight_grams: num(fd, "weight_grams"),
    base_price: tiers[0]?.price ?? num(fd, "base_price"),
    price_tiers: tiers,
    moq: num(fd, "moq"),
    packaging: str(fd, "packaging"),
    in_stock: bool(fd, "in_stock"),
    featured: bool(fd, "featured"),
    sort_order: num(fd, "sort_order"),
  };

  const id = str(fd, "id");
  const { error } = id
    ? await supabase.from("products").update(row).eq("id", id)
    : await supabase.from("products").insert(row);

  if (error) {
    const friendly = error.code === "23505" ? "A product with that web address already exists." : error.message;
    return { ok: false, message: friendly };
  }

  refreshPublicPages();
  redirect("/admin/products?saved=1");
}

export async function deleteProduct(fd: FormData) {
  const supabase = await requireAdmin();
  await supabase.from("products").delete().eq("id", str(fd, "id"));
  refreshPublicPages();
  redirect("/admin/products?deleted=1");
}

/* ---------------------------------------------------------- collections -- */

export async function saveCollection(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await requireAdmin();

  const name = str(fd, "name");
  if (!name) return { ok: false, message: "Give the collection a name." };

  const row = {
    slug: str(fd, "slug") || slugify(name),
    name,
    tagline: str(fd, "tagline"),
    description: str(fd, "description"),
    cover_image: str(fd, "cover_image") || null,
    sort_order: num(fd, "sort_order"),
  };

  const id = str(fd, "id");
  const { error } = id
    ? await supabase.from("collections").update(row).eq("id", id)
    : await supabase.from("collections").insert(row);

  if (error) {
    const friendly = error.code === "23505" ? "A collection with that web address already exists." : error.message;
    return { ok: false, message: friendly };
  }

  refreshPublicPages();
  redirect("/admin/collections?saved=1");
}

export async function deleteCollection(fd: FormData) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("collections").delete().eq("id", str(fd, "id"));
  refreshPublicPages();
  redirect(error ? "/admin/collections?inuse=1" : "/admin/collections?deleted=1");
}

/* ------------------------------------------------------------- settings -- */

export async function saveSettings(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await requireAdmin();

  const data = {
    businessName: str(fd, "businessName"),
    tagline: str(fd, "tagline"),
    aboutBlurb: str(fd, "aboutBlurb"),
    whatsappNumber: str(fd, "whatsappNumber"),
    email: str(fd, "email"),
    phone: str(fd, "phone"),
    addressLines: str(fd, "addressLines")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
    currency: "INR",
    termsIntro: str(fd, "termsIntro"),
    termsSections: json<{ heading: string; body: string[] }[]>(fd, "termsSections", []).filter(
      (s) => s.heading.trim(),
    ),
  };

  const { error } = await supabase.from("site_settings").upsert({ id: 1, data, updated_at: new Date().toISOString() });
  if (error) return { ok: false, message: error.message };

  refreshPublicPages();
  return { ok: true, message: "Saved. The live site is already updated." };
}

/* ----------------------------------------------------------------- auth -- */

export async function signOut() {
  const supabase = await getServerSupabase();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
