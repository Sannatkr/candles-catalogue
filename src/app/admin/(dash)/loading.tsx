import { ListPageSkeleton } from "@/components/admin/skeleton";

/**
 * Shown the instant an admin link is pressed, before the screen's data has
 * arrived. The shape matches the list screens (Orders, Enquiries, Products);
 * screens with another shape bring their own skeleton inside a Suspense.
 */
export default function Loading() {
  return <ListPageSkeleton />;
}
