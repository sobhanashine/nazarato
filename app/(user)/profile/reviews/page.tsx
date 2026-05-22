import type { Metadata } from "next";
import { MyReviewsList } from "@/components/profile/MyReviewsList";
import { myReviews } from "@/lib/data/profile";

export const metadata: Metadata = {
  title: "نظرات من — نظراتو",
};

export default function MyReviewsPage() {
  return <MyReviewsList reviews={myReviews} />;
}
