import { NotFoundView } from "@/components/ui/NotFoundView";

export default function BlogCategoryNotFound() {
  return (
    <NotFoundView
      code=""
      title="دسته‌بندی پیدا نشد"
      message="این دسته‌بندی وبلاگ وجود ندارد."
      backHref="/blog"
      backLabel="بازگشت به وبلاگ"
    />
  );
}
