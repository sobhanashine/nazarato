import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { GLASS } from "@/components/ui/styles";
import { getUserByUsername } from "@/lib/data/users";
import { getUserReviews } from "@/lib/data/reviews";
import { ReviewCard } from "@/components/ui/ReviewCard";
import { ReportUserButton } from "@/components/profile/ReportUserButton";
import { getSession } from "@/lib/auth/session";

type Params = { username: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);
  const user = await getUserByUsername(decodedUsername);
  if (!user) return { title: "کاربر – نظراتو" };
  return {
    title: `پروفایل ${user.display_name} – نظراتو`,
    description: user.username ? `@${user.username} در نظراتو` : user.display_name,
  };
}

export const dynamic = "force-dynamic";

const faNum = (n: number) => n.toLocaleString("fa-IR");
const FALLBACK_COLOR = "#5BBB7B";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);

  const [user, viewer] = await Promise.all([
    getUserByUsername(decodedUsername),
    getSession(),
  ]);
  // Treat a profile hidden by its owner the same as a non-existent one — never
  // leak existence to outsiders. The owner themselves can still see it via
  // `/profile`.
  if (!user || (user.public_profile === false && viewer?.id !== user.id)) {
    notFound();
  }

  const reviews = await getUserReviews(user.id, viewer?.id);

  const initial = user.display_name.trim().charAt(0) || "؟";
  const joined = new Date(user.created_at);
  const memberSince = `${joined.toLocaleDateString("fa-IR", {
    month: "long",
  })} ${joined.toLocaleDateString("fa-IR", { year: "numeric" })}`;

  const stats = [
    { key: "reviews", label: "نظرات", value: user.reviews_count ?? reviews.length },
    { key: "helpful", label: "مفید بود", value: user.helpful_votes_received ?? 0 },
    { key: "reputation", label: "امتیاز اعتبار", value: user.reputation_score ?? 0 },
  ] as const;

  return (
    <>
      <Header />
      <Container>
        <Breadcrumb
          items={[
            { label: "خانه", href: "/" },
            { label: "کاربران" },
            { label: user.display_name },
          ]}
        />
        <main className="mx-auto max-w-[640px] pb-12 pt-4">
          <div className="flex flex-col gap-6">
            {/* Identity Card */}
            <section className={`${GLASS} p-5 sm:p-6`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className="grid h-[68px] w-[68px] shrink-0 place-items-center rounded-full text-2xl font-black text-white shadow-[0_6px_18px_-4px_rgba(0,0,0,0.5)] sm:h-20 sm:w-20"
                    style={{ background: user.avatar_color ?? FALLBACK_COLOR }}
                    aria-hidden
                  >
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="truncate text-[1.15rem] font-black text-strong sm:text-[1.3rem]">
                        {user.display_name}
                      </h1>
                      {user.role === "admin" && (
                        <span className="inline-flex items-center rounded-full bg-rose-500/15 px-2 py-0.5 text-[0.7rem] font-bold text-rose-400 border border-rose-500/30">
                          مدیر سیستم
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[0.8rem] text-muted">عضو از {memberSince}</p>
                    {user.username && (
                      <p className="mt-0.5 text-[0.8rem] text-mint" dir="ltr">
                        @{user.username}
                      </p>
                    )}
                  </div>
                </div>
                <div className="shrink-0">
                  <ReportUserButton />
                </div>
              </div>
            </section>

            {/* Stats */}
            <section
              className="grid grid-cols-3 gap-3"
              aria-label="آمار فعالیت کاربر"
            >
              {stats.map((s) => (
                <div
                  key={s.key}
                  className={`${GLASS} flex flex-col items-center gap-1 p-4 text-center`}
                >
                  <span className="text-[1.4rem] font-black tabular-nums text-strong sm:text-[1.7rem]">
                    {faNum(s.value)}
                  </span>
                  <span className="text-[0.75rem] text-muted sm:text-[0.8rem]">
                    {s.label}
                  </span>
                </div>
              ))}
            </section>

            {/* Published Reviews Feed */}
            <section className="flex flex-col gap-4">
              <h2 className="text-[1.05rem] font-extrabold text-strong border-b border-glass-border pb-2">
                نظرات منتشر شده ({faNum(reviews.length)})
              </h2>
              {reviews.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {reviews.map((r) => (
                    <ReviewCard key={r.id} review={r} />
                  ))}
                </div>
              ) : (
                <div className={`${GLASS} p-8 text-center`}>
                  <p className="text-sm text-muted">این کاربر هنوز هیچ نظری منتشر نکرده است.</p>
                </div>
              )}
            </section>
          </div>
        </main>
      </Container>
      <Footer />
    </>
  );
}
