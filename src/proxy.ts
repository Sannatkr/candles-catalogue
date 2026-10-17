import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { checkIsAdmin, verifiedUserId } from "@/lib/admin/is-admin";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";

export async function proxy(request: NextRequest) {
  // Nothing to protect until Supabase is connected — the admin area renders its
  // own setup instructions in that state.
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // The session token is checked against Supabase's public signing key right
  // here, with no round trip to the auth server. The old getUser() call cost
  // ~300 ms on every admin request, including every prefetch.
  const userId = await verifiedUserId(supabase);

  const { pathname } = request.nextUrl;

  if (!userId && pathname !== "/admin/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (userId) {
    // Having a login is not the same as being an admin. Once customers can sign
    // up, most people holding a session have no business here at all.
    const isAdmin = await checkIsAdmin(supabase, userId);

    if (!isAdmin) {
      // Back to the shop, including from /admin/login — bouncing them to the
      // login page they are already signed into would just loop.
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (pathname === "/admin/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
