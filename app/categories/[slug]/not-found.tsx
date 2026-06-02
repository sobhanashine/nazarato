import { NotFoundView } from "@/components/ui/NotFoundView";

export default function CategoryNotFound() {
  return (
    <NotFoundView
      code=""
      title="دسته‌بندی پیدا نشد"
      message="این دسته‌بندی وجود ندارد."
      backHref="/categories"
      backLabel="بازگشت به دسته‌بندی‌ها"
    />
  );
}
