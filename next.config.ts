import type { NextConfig } from "next";

const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  // This project sits inside a folder that has its own stray package-lock.json.
  // Pinning the root keeps Turbopack looking only at our files.
  turbopack: { root: import.meta.dirname },
  images: {
    // The starter artwork in /public/placeholders is SVG. Served sandboxed with
    // scripts disabled, which is what the CSP below enforces.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
};

export default nextConfig;
