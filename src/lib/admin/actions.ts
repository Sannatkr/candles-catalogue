"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/admin/action-state";
import { isBookingStatus } from "@/lib/admin/booking-status";
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
    keywords: str(fd, "keywords")
      .split(",")
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean),
    fragrance: str(fd, "fragrance"),
    wax_type: str(fd, "wax_type"),
    wick_type: str(fd, "wick_type"),
    burn_time_hours: num(fd, "burn_time_hours"),
    height_cm: num(fd, "height_cm"),
    diameter_cm: num(fd, "diameter_cm"),
    weight_grams: num(fd, "weight_grams"),
    base_price: tiers[0]?.price ?? num(fd, "base_price"),
    price_tiers: tiers,
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
    instagramHandle: str(fd, "instagramHandle").replace(/^@/, ""),
    email: str(fd, "email"),
    addressLines: str(fd, "addressLines")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
    fragrances: str(fd, "fragrances")
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

/* ------------------------------------------------------------- bookings -- */

export async function setBookingStatus(fd: FormData) {
  const supabase = await requireAdmin();
  const status = str(fd, "status");
  if (!isBookingStatus(status)) return;

  // Stamp the moment money landed, so revenue can be reported by payment date
  // rather than by when the order was first placed.
  const patch: Record<string, unknown> = { status };
  if (status === "paid" || status === "fulfilled") patch.paid_at = new Date().toISOString();
  if (status === "new" || status === "contacted" || status === "cancelled") patch.paid_at = null;

  await supabase.from("bookings").update(patch).eq("id", str(fd, "id"));
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/revenue");
  revalidatePath("/admin");
}

export async function deleteBooking(fd: FormData) {
  const supabase = await requireAdmin();
  await supabase.from("bookings").delete().eq("id", str(fd, "id"));
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/revenue");
  revalidatePath("/admin");
}

export async function createBooking(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await requireAdmin();

  const productSlug = str(fd, "product_slug");
  if (!productSlug) return { ok: false, message: "Pick which candle this is for." };

  const quantity = Math.floor(num(fd, "quantity"));
  if (quantity < 1) return { ok: false, message: "Quantity must be at least 1." };

  const unitPrice = num(fd, "unit_price");
  if (unitPrice <= 0) return { ok: false, message: "Enter the rate you sold it at." };

  const { data: product } = await supabase
    .from("products")
    .select("name, images")
    .eq("slug", productSlug)
    .maybeSingle();

  const status = str(fd, "status");
  if (!isBookingStatus(status)) return { ok: false, message: "Pick a status." };

  const paidAt =
    status === "paid" || status === "fulfilled"
      ? (str(fd, "paid_on") ? new Date(str(fd, "paid_on")).toISOString() : new Date().toISOString())
      : null;

  const { error } = await supabase.from("bookings").insert({
    product_slug: productSlug,
    product_name: product?.name ?? productSlug,
    product_image: (product?.images as string[] | null)?.[0] ?? null,
    quantity,
    unit_price: unitPrice,
    total_price: Math.round(unitPrice * quantity),
    fragrance: str(fd, "fragrance") || null,
    pincode: str(fd, "pincode") || null,
    state: str(fd, "state") || null,
    buyer_name: str(fd, "buyer_name") || null,
    buyer_contact: str(fd, "buyer_contact") || null,
    note: str(fd, "note") || null,
    status,
    source: "manual",
    paid_at: paidAt,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/bookings");
  revalidatePath("/admin/revenue");
  revalidatePath("/admin");
  redirect("/admin/bookings?added=1");
}
