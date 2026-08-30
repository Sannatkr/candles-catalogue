"use client";

import { createContext, useContext } from "react";
import { DEFAULT_GIFT } from "@/lib/gift";
import type { GiftConfig } from "@/lib/types";

/**
 * The gift settings, put within reach of any card on any page.
 *
 * ProductCard is a server component rendered dozens at a time, and the only
 * part of it that needs the offer is the little claim tag. Threading the config
 * down through every listing page and grid would touch a lot of code to feed
 * one badge; a context set once in the site layout does the same job without
 * disturbing the cards.
 */
const GiftContext = createContext<GiftConfig>(DEFAULT_GIFT);

export function GiftConfigProvider({
  config,
  children,
}: {
  config: GiftConfig;
  children: React.ReactNode;
}) {
  return <GiftContext.Provider value={config}>{children}</GiftContext.Provider>;
}

export const useGiftConfig = () => useContext(GiftContext);
