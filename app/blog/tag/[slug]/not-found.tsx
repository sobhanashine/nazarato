import { NotFoundView } from "@/components/ui/NotFoundView";

export default function BlogTagNotFound() {
  return (
    <NotFoundView
      code=""
      title="برچسب پیدا نشد"
      message="این برچسب وجود ندارد."
      backHref="/blog"
      backLabel="بازگشت به وبلاگ"
    />
  );
}
