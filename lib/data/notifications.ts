import { sendPushToUser, sendPushToUsers } from "@/lib/push/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export type NotificationType =
  | "admin_new_review"
  | "review_approved"
  | "review_rejected";

export type Notification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

const SELECT = "id, user_id, type, title, body, link, read_at, created_at";

function asNotification(value: unknown): Notification {
  if (!value || typeof value !== "object") {
    throw new Error("invalid notification row");
  }
  const o = value as Record<string, unknown>;
  return {
    id: String(o.id),
    user_id: String(o.user_id),
    type: o.type as NotificationType,
    title: String(o.title),
    body: typeof o.body === "string" ? o.body : null,
    link: typeof o.link === "string" ? o.link : null,
    read_at: typeof o.read_at === "string" ? o.read_at : null,
    created_at: String(o.created_at),
  };
}

export async function listUserNotifications(
  userId: string,
  limit = 50
): Promise<Notification[]> {
  const { data, error } = await supabaseAdmin()
    .from("notifications")
    .select(SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[notifications] listUserNotifications failed", {
      userId,
      error: error.message,
    });
    return [];
  }
  return (data ?? []).map(asNotification);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabaseAdmin()
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    console.error("[notifications] getUnreadCount failed", {
      userId,
      error: error.message,
    });
    return 0;
  }
  return count ?? 0;
}

export async function markAsRead(
  userId: string,
  notificationId: string
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    console.error("[notifications] markAsRead failed", {
      userId,
      notificationId,
      error: error.message,
    });
    throw new Error("failed to mark notification as read");
  }
}

export async function markAllAsRead(userId: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    console.error("[notifications] markAllAsRead failed", {
      userId,
      error: error.message,
    });
    throw new Error("failed to mark all notifications as read");
  }
}

type NewNotification = {
  user_id: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  link?: string | null;
};

async function insertMany(rows: NewNotification[]): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabaseAdmin().from("notifications").insert(rows);
  if (error) {
    console.error("[notifications] insertMany failed", {
      count: rows.length,
      error: error.message,
    });
  }
}

/** Notify every admin that a new review is awaiting moderation. */
export async function notifyAdminsOfNewReview(args: {
  businessName: string;
}): Promise<void> {
  const supabase = supabaseAdmin();
  const { data: admins, error } = await supabase
    .from("users")
    .select("id")
    .eq("role", "admin");

  if (error) {
    console.error("[notifications] notifyAdminsOfNewReview lookup failed", {
      error: error.message,
    });
    return;
  }

  const adminIds = (admins ?? []).map((a: { id: string }) => a.id);
  const title = "نظر جدید در انتظار بررسی";
  const body = `یک نظر جدید برای «${args.businessName}» ثبت شده و آماده بررسی است.`;
  const link = "/admin/moderation";

  const rows: NewNotification[] = adminIds.map((id) => ({
    user_id: id,
    type: "admin_new_review",
    title,
    body,
    link,
  }));

  await insertMany(rows);
  await sendPushToUsers(adminIds, { title, body, link, tag: "admin_new_review" });
}

/** Notify the review author that the moderation decision is in. */
export async function notifyReviewDecision(args: {
  authorId: string;
  approved: boolean;
  businessName: string;
  businessSlug: string;
  businessType: "company" | "ig_shop";
}): Promise<void> {
  const linkBase = args.businessType === "ig_shop" ? "/shop" : "/company";
  const title = args.approved ? "نظر شما تأیید شد" : "نظر شما رد شد";
  const body = args.approved
    ? `نظر شما برای «${args.businessName}» منتشر شد.`
    : `نظر شما برای «${args.businessName}» توسط تیم بررسی رد شد.`;
  const link = `${linkBase}/${args.businessSlug}`;

  const row: NewNotification = {
    user_id: args.authorId,
    type: args.approved ? "review_approved" : "review_rejected",
    title,
    body,
    link,
  };
  await insertMany([row]);
  await sendPushToUser(args.authorId, {
    title,
    body,
    link,
    tag: args.approved ? "review_approved" : "review_rejected",
  });
}
