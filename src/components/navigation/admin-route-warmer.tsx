"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const adminRoutes = [
  "/admin/warranties",
  "/admin/resellers",
  "/admin/products",
  "/admin/categories",
  "/admin/menus",
  "/admin/banners",
  "/admin/telegram",
  "/admin/settings",
  "/admin/activity-logs",
];

export function AdminRouteWarmer() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];

    // Warm routes one by one after the current page is interactive. Staggering
    // avoids sending every Supabase query at the same time.
    adminRoutes.forEach((route, index) => {
      const timer = window.setTimeout(() => {
        if (!cancelled) router.prefetch(route);
      }, 700 + index * 650);
      timers.push(timer);
    });

    return () => {
      cancelled = true;
      timers.forEach(window.clearTimeout);
    };
  }, [router]);

  return null;
}
