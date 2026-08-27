"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";

/**
 * Product analytics, so there is an answer to "what did people actually do".
 *
 * Off unless NEXT_PUBLIC_POSTHOG_KEY is set — no key, no network calls, no
 * cookies. That keeps local development quiet and means the site works fine for
 * anyone who never signs up for PostHog.
 */

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

export const analyticsEnabled = Boolean(KEY);

let started = false;

function start() {
  if (started || !KEY || typeof window === "undefined") return;
  started = true;
  posthog.init(KEY, {
    api_host: HOST,
    // Pageviews are sent by hand below: the App Router changes the URL without
    // a page load, which PostHog's own listener misses.
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: true,
    session_recording: { maskAllInputs: true },
    persistence: "localStorage+cookie",
  });
}

/** Fire and forget. Safe to call before init, or with analytics switched off. */
export function track(event: string, properties?: Record<string, unknown>) {
  if (!KEY || typeof window === "undefined") return;
  start();
  posthog.capture(event, properties);
}

export function AnalyticsProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!KEY) return;
    start();
    const query = searchParams?.toString();
    posthog.capture("$pageview", { $current_url: pathname + (query ? `?${query}` : "") });
  }, [pathname, searchParams]);

  return null;
}
