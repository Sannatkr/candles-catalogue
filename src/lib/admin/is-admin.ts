/**
 * Is the signed-in user an admin, rather than merely signed in?
 *
 * Shared by the middleware and by requireAdmin so the two can never drift into
 * disagreeing about who is allowed in.
 *
 * Every call to Supabase costs a round trip of roughly 300 ms from Vercel, and
 * the admin used to pay for two of them — "who are you?" and "are you an
 * admin?" — on every page, every prefetch and every button press. The first
 * is now answered locally (the JWT is verified against Supabase's public key,
 * see `verifiedUserId`), and the second is remembered for a few minutes per
 * user on this server instance, so a warm function answers it for free.
 */

type RpcClient = {
  rpc: (fn: string) => PromiseLike<{ data: unknown; error: { code?: string } | null }>;
};

type ClaimsClient = {
  auth: {
    getClaims: () => Promise<{ data: { claims?: { sub?: string } } | null; error: unknown }>;
  };
};

/** How long a yes-or-no about one user is trusted before being asked again. */
const ADMIN_TTL_MS = 5 * 60_000;
const adminByUser = new Map<string, { ok: boolean; until: number }>();

/**
 * Once the is_admin function has answered even once, migration 014 has
 * plainly been run — that never changes back, so it is remembered for the
 * life of the instance.
 */
let lockdownDone = false;

/**
 * The user id from the session cookie, verified against Supabase's signing
 * key without a network request. Null when there is no valid session.
 */
export async function verifiedUserId(supabase: ClaimsClient): Promise<string | null> {
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub;
}

export async function checkIsAdmin(supabase: RpcClient, userId?: string | null): Promise<boolean> {
  if (userId) {
    const hit = adminByUser.get(userId);
    if (hit && hit.until > Date.now()) return hit.ok;
  }

  const { data, error } = await supabase.rpc("is_admin");

  if (!error) {
    lockdownDone = true;
    const ok = data === true;
    if (userId) adminByUser.set(userId, { ok, until: Date.now() + ADMIN_TTL_MS });
    return ok;
  }

  /**
   * PGRST202 is PostgREST saying the function is not in its schema cache —
   * 014-admin-lockdown.sql has not been run yet.
   *
   * This is the one case that deliberately fails open. Before that migration
   * there is no admins table to be in, and every account that can log in was
   * created by hand in the Supabase dashboard, so every login IS an admin.
   * Failing closed here would lock the owner out of their own admin with no way
   * back in. Once the migration runs the function exists, this branch stops
   * being reachable, and everything below fails closed.
   *
   * Nothing else gets that treatment: an error we cannot explain is a no.
   */
  if (error.code === "PGRST202") return true;

  return false;
}

/**
 * True while the lockdown migration is still outstanding. Drives the warning in
 * the admin, so the fail-open above is never silent.
 */
export async function isLockdownPending(supabase: RpcClient): Promise<boolean> {
  if (lockdownDone) return false;
  const { error } = await supabase.rpc("is_admin");
  if (!error) lockdownDone = true;
  return error?.code === "PGRST202";
}
