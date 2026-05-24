"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  removePushSubscription,
  savePushSubscription,
} from "@/app/(user)/settings/notifications/push-actions";
import { GLASS } from "@/components/ui/styles";

interface PushToggleProps {
  vapidPublicKey: string | null;
}

function urlBase64ToArrayBuffer(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const buf = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buf;
}

type Status =
  | "loading"
  | "unsupported"
  | "denied"
  | "subscribed"
  | "available";

export function PushToggle({ vapidPublicKey }: PushToggleProps) {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIos(/iPad|iPhone|iPod/.test(ua));
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        // Safari iOS legacy flag
        (window.navigator as Navigator & { standalone?: boolean }).standalone ===
          true
    );

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }

    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setStatus(sub ? "subscribed" : "available");
    });
  }, []);

  async function subscribe() {
    if (!vapidPublicKey) {
      toast.error("کلید سرور اعلان تنظیم نشده است.", { position: "bottom-center" });
      return;
    }
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setStatus(perm === "denied" ? "denied" : "available");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToArrayBuffer(vapidPublicKey),
      });
      const json = sub.toJSON() as {
        endpoint: string;
        keys?: { p256dh?: string; auth?: string };
      };
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("invalid subscription shape");
      }
      const res = await savePushSubscription(
        {
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        },
        navigator.userAgent
      );
      if (res.ok) {
        toast.success("اعلان‌های فوری فعال شد.", { position: "bottom-center" });
        setStatus("subscribed");
      } else {
        await sub.unsubscribe().catch(() => {});
        toast.error(res.error || "خطا در فعال‌سازی اعلان‌ها.", {
          position: "bottom-center",
        });
        setStatus("available");
      }
    } catch (err) {
      console.error("[push] subscribe failed", err);
      toast.error("امکان فعال‌سازی اعلان وجود ندارد.", {
        position: "bottom-center",
      });
      setStatus("available");
    } finally {
      setBusy(false);
    }
  }

  async function unsubscribe() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      toast.success("اعلان‌های فوری غیرفعال شد.", { position: "bottom-center" });
      setStatus("available");
    } catch (err) {
      console.error("[push] unsubscribe failed", err);
      toast.error("خطا در غیرفعال‌سازی اعلان.", { position: "bottom-center" });
    } finally {
      setBusy(false);
    }
  }

  const on = status === "subscribed";
  const iosNeedsInstall = isIos && !isStandalone;

  return (
    <div className={`${GLASS} flex flex-col gap-4 p-5 sm:p-6`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-[0.95rem] font-bold text-strong">
            اعلان‌های فوری روی این دستگاه
          </h3>
          <p className="text-[0.8rem] leading-[1.6] text-muted">
            با فعال‌سازی این گزینه، اعلان‌های نظراتو روی همین مرورگر یا اپ نصب‌شده‌تان نشان داده می‌شود.
          </p>
        </div>
        <div className="relative mt-1 shrink-0">
          <button
            type="button"
            onClick={on ? unsubscribe : subscribe}
            disabled={
              busy ||
              status === "loading" ||
              status === "unsupported" ||
              status === "denied" ||
              iosNeedsInstall
            }
            aria-pressed={on}
            className="block disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span
              className={`block h-6 w-11 rounded-full transition-colors duration-200 ${
                on ? "bg-mint" : "bg-white/10"
              }`}
            />
            <span
              className={`absolute top-1 right-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                on ? "-translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {status === "unsupported" && (
        <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-[0.78rem] text-amber-200">
          مرورگر فعلی شما از اعلان‌های فوری پشتیبانی نمی‌کند.
        </p>
      )}
      {status === "denied" && (
        <p className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-[0.78rem] text-rose-200">
          دسترسی اعلان رد شده است. برای فعال‌سازی، از تنظیمات مرورگر اجازه ارسال اعلان به این سایت را روشن کنید.
        </p>
      )}
      {iosNeedsInstall && (
        <p className="rounded-lg border border-mint/25 bg-mint/5 p-3 text-[0.78rem] leading-[1.7] text-strong">
          روی آیفون/آیپد، اعلان‌های فوری فقط زمانی کار می‌کنند که نظراتو را از طریق «افزودن به صفحه اصلی» در Safari نصب کنید و سپس اپ نصب‌شده را باز کنید.
        </p>
      )}
    </div>
  );
}
