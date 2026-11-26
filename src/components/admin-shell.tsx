"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, Boxes, FileCheck2, Home, Image, LayoutList, LogOut, Menu, Send, Settings, Tags, Users } from "lucide-react";
import { logout } from "@/app/(public)/actions";
import { ResponsiveSidebar, type SidebarItem } from "@/components/navigation/responsive-sidebar";
import { AdminRouteWarmer } from "@/components/navigation/admin-route-warmer";

const nav: readonly SidebarItem[] = [["/admin", "Ringkasan", Home], ["/admin/resellers", "Reseller", Users], ["/admin/products", "Produk", Boxes], ["/admin/categories", "Kategori", Tags], ["/admin/warranties", "Garansi", FileCheck2], ["/admin/menus", "Menu homepage", LayoutList], ["/admin/banners", "Banner", Image], ["/admin/telegram", "Telegram", Send], ["/admin/settings", "Pengaturan", Settings], ["/admin/activity-logs", "Aktivitas", Activity]];

export function AdminShell({ children, name }: { children: React.ReactNode; name: string }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [feedback, setFeedback] = useState("");
  useEffect(() => { if (feedback) { const timer = window.setTimeout(() => setFeedback(""), 1800); return () => window.clearTimeout(timer); } }, [feedback]);
  const sidebarFooter = <form action={logout}><button className={`flex w-full items-center gap-3 rounded-xl p-3 text-sm font-bold text-red-300 hover:bg-red-500/10 ${collapsed ? "lg:justify-center" : ""}`} title="Keluar dari admin"><LogOut size={17} /><span className={collapsed ? "lg:hidden" : ""}>Keluar dari admin</span></button></form>;
  function navigate(label: string) { setFeedback(label === "Menu diperluas" || label === "Menu diciutkan" ? label : `Membuka ${label}...`); if (label === "Menu diperluas") setCollapsed(false); if (label === "Menu diciutkan") setCollapsed(true); }
  return <div className="min-h-screen bg-[#f8f5f7]"><AdminRouteWarmer /><ResponsiveSidebar items={nav} homeHref="/admin" dark open={open} collapsed={collapsed} onClose={() => setOpen(false)} onNavigate={navigate} footer={sidebarFooter} /><div className={`transition-[padding] duration-200 ${collapsed ? "lg:pl-[88px]" : "lg:pl-64"}`}><header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b bg-white px-5 shadow-sm sm:px-8"><div className="flex items-center gap-3"><button aria-label="Buka menu" onClick={() => setOpen(true)} className="rounded-xl p-2 text-gray-600 hover:bg-pink-50 lg:hidden"><Menu size={21} /></button><Link href="/admin" onClick={() => setFeedback("Membuka Ringkasan...")} className="text-sm font-bold text-gray-700 lg:hidden">Peony Admin</Link><p className="hidden text-sm text-gray-500 lg:block">Peony Control Center</p></div><div className="flex items-center gap-3"><span aria-live="polite" className="hidden text-xs font-semibold text-pink-600 sm:block">{feedback}</span><strong className="text-sm">{name}</strong><span className="grid size-9 place-items-center rounded-full bg-pink-100 font-bold text-pink-700">{name.charAt(0)}</span></div></header><main className="mx-auto max-w-7xl p-5 sm:p-8">{children}</main></div>{feedback && <div aria-live="polite" className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-[#21121a] px-4 py-2 text-xs font-bold text-white shadow-xl sm:hidden">{feedback}</div>}</div>;
}
