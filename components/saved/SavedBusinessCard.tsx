import type { Business } from "@/lib/data/businesses";
import { BusinessCard } from "@/components/ui/BusinessCard";

export function SavedBusinessCard({ business }: { business: Business }) {
  return <BusinessCard business={business} isBookmarked={true} />;
}
