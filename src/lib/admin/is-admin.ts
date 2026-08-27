/**
 * Is the signed-in user an admin, rather than merely signed in?
 *
 * Shared by the middleware and by requireAdmin so the two can never drift into
 * disagreeing about who is allowed in.
 */

type RpcClient = {
  rpc: (fn: string) => PromiseLike<{ data: unknown; error: { code?: string } | null }>;
};

export async function checkIsAdmin(supabase: RpcClient): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_admin");

  if (!error) return data === true;

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
  const { error } = await supabase.rpc("is_admin");
  return error?.code === "PGRST202";
}
