"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/ui/Container";
import { GLASS } from "@/components/ui/styles";
import type { AdminUserListItem, AdminUserRole } from "@/lib/data/admin";
import { setUserBanned, setUserRole } from "./actions";

const faNum = (n: number) => n.toLocaleString("fa-IR");

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
};

export function UsersAdminClient({
  initialUsers,
  query,
}: {
  initialUsers: AdminUserListItem[];
  query: string;
}) {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUserListItem[]>(initialUsers);
  const [term, setTerm] = useState(query);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function onSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = term.trim();
    router.push(q ? `/admin/users?q=${encodeURIComponent(q)}` : "/admin/users");
  }

  function toggleBan(user: AdminUserListItem) {
    const next = !user.is_banned;
    setPendingId(user.id);
    startTransition(async () => {
      const res = await setUserBanned(user.id, next);
      setPendingId(null);
      if (res.ok) {
        setUsers((list) =>
          list.map((u) => (u.id === user.id ? { ...u, is_banned: next } : u)),
        );
        toast.success(next ? "کاربر مسدود شد" : "مسدودیت برداشته شد");
      } else {
        toast.error(res.error);
      }
    });
  }

  function toggleRole(user: AdminUserListItem) {
    const next: AdminUserRole = user.role === "admin" ? "consumer" : "admin";
    setPendingId(user.id);
    startTransition(async () => {
      const res = await setUserRole(user.id, next);
      setPendingId(null);
      if (res.ok) {
        setUsers((list) =>
          list.map((u) => (u.id === user.id ? { ...u, role: next } : u)),
        );
        toast.success(next === "admin" ? "به ادمین ارتقا یافت" : "به کاربر عادی تغییر کرد");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <>
      <Header />
      <Container>
        <main className="space-y-6 py-8">
          <header className="space-y-1">
            <h1 className="text-[1.6rem] font-black text-strong">مدیریت کاربران</h1>
            <p className="text-[0.85rem] text-muted">
              {faNum(users.length)} کاربر — مسدودسازی و تغییر نقش
            </p>
          </header>

          <form onSubmit={onSearch} className="flex gap-2">
            <input
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="جستجو با نام، نام‌کاربری یا شماره…"
              className="w-full rounded-xl border border-glass-border bg-white/[0.03] px-4 py-2.5 text-[15px] text-white outline-none transition-colors placeholder:text-white/25 focus:border-mint"
            />
            <button
              type="submit"
              className="shrink-0 rounded-xl border border-glass-border bg-white/5 px-5 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-white/10"
            >
              جستجو
            </button>
          </form>

          {users.length === 0 ? (
            <div className={`${GLASS} p-10 text-center text-muted`}>
              کاربری پیدا نشد.
            </div>
          ) : (
            <ul className="space-y-2">
              {users.map((user) => {
                const busy = pendingId === user.id;
                return (
                  <li
                    key={user.id}
                    className={`${GLASS} flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-strong">
                          {user.display_name}
                        </span>
                        {user.role === "admin" && (
                          <span className="rounded-full border border-lapis/40 px-2 py-0.5 text-[0.7rem] font-bold text-lapis">
                            ادمین
                          </span>
                        )}
                        {user.is_banned && (
                          <span className="rounded-full border border-pomegr/45 px-2 py-0.5 text-[0.7rem] font-bold text-pomegr">
                            مسدود
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 text-[0.78rem] text-muted">
                        {user.username && <span>@{user.username}</span>}
                        <span dir="ltr">{user.phone}</span>
                        <span>{faNum(user.reviews_count)} نظر</span>
                        <span>عضویت: {formatDate(user.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => toggleRole(user)}
                        disabled={busy}
                        className="rounded-lg border border-glass-border bg-white/5 px-3.5 py-2 text-[13px] font-bold text-white transition-colors hover:bg-white/10 disabled:opacity-50"
                      >
                        {user.role === "admin" ? "حذف ادمین" : "ارتقا به ادمین"}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleBan(user)}
                        disabled={busy}
                        className={`rounded-lg border px-3.5 py-2 text-[13px] font-bold transition-colors disabled:opacity-50 ${
                          user.is_banned
                            ? "border-mint/40 text-mint hover:bg-mint/10"
                            : "border-pomegr/45 text-pomegr hover:bg-pomegr/10"
                        }`}
                      >
                        {user.is_banned ? "رفع مسدودی" : "مسدود کردن"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </main>
      </Container>
      <Footer />
    </>
  );
}
