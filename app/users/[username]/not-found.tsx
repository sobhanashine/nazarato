import { NotFoundView } from "@/components/ui/NotFoundView";

export default function UserNotFound() {
  return (
    <NotFoundView
      code=""
      title="کاربر پیدا نشد"
      message="چنین کاربری وجود ندارد یا حسابش حذف شده است."
      backHref="/"
      backLabel="بازگشت به خانه"
    />
  );
}
