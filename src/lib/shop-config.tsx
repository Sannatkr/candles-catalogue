"use client";

import { createContext, useContext } from "react";
import { DEFAULT_BULK_TIERS } from "@/lib/pricing";
import type { BulkTier } from "@/lib/types";

/**
 * The bulk ladder, put within reach of anything on any page.
 *
 * The cart is the reason this exists. A line's price now depends on how many
 * are in it, so the bag cannot add up without knowing the ladder — and the bag
 * is read by the header badge, the cart page and the checkout alike. Threading
 * the settings through every one of them would touch a lot of code to feed one
 * multiplication; a context set once in the site layout does the same job.
 */
const BulkTiersContext = createContext<BulkTier[]>(DEFAULT_BULK_TIERS);

export function ShopConfigProvider({
  bulkTiers,
  children,
}: {
  bulkTiers: BulkTier[];
  children: React.ReactNode;
}) {
  return <BulkTiersContext.Provider value={bulkTiers}>{children}</BulkTiersContext.Provider>;
}

export const useBulkTiers = () => useContext(BulkTiersContext);
