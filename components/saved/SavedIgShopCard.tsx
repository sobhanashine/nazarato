import { IgShopCard } from "@/components/ui/IgShopCard";
import type { InstagramShop } from "@/lib/data/instagram-shops";

export function SavedIgShopCard({ shop }: { shop: InstagramShop }) {
  return <IgShopCard shop={shop} isBookmarked />;
}
