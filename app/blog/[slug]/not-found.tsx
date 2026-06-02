import { NotFoundView } from "@/components/ui/NotFoundView";

export default function BlogPostNotFound() {
  return (
    <NotFoundView
      code=""
      title="مطلب پیدا نشد"
      message="این مطلب وجود ندارد یا حذف شده است."
      backHref="/blog"
      backLabel="بازگشت به وبلاگ"
    />
  );
}
