"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type SidebarItem = readonly [href: string, label: string, icon: LucideIcon];

export function ResponsiveSidebar({ items, homeHref, dark = false, open, collapsed, onClose, onNavigate, footer }: { items: readonly SidebarItem[]; homeHref: string; dark?: boolean; open: boolean; collapsed: boolean; onClose: () => void; onNavigate: (label: string) => void; footer?: React.ReactNode }) {
  const pathname = usePathname();
  const active = (href: string) => href === "/admin" || href === "/dashboard" ? pathname === href : pathname.startsWith(href);
  return <>
    <button aria-label="Tutup menu" onClick={onClose} className={`fixed inset-0 z-30 bg-black/45 transition lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} />
    <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col p-5 shadow-2xl transition-all duration-200 lg:translate-x-0 lg:shadow-none ${open ? "translate-x-0" : "-translate-x-full"} ${collapsed ? "lg:w-[88px]" : "lg:w-64"} ${dark ? "bg-[#170f14] text-white" : "border-r border-pink-100 bg-white text-[#28131e]"}`}>
      <div className={`flex items-center ${collapsed ? "lg:justify-center" : "justify-between"}`}><Link href={homeHref} onClick={() => { onNavigate("Dashboard"); onClose(); }} className={collapsed ? "lg:hidden" : ""}><Logo dark={dark} /></Link><Link href={homeHref} onClick={() => onNavigate("Dashboard")} className="hidden lg:block">{collapsed && <LogoMark />}</Link><button aria-label="Tutup menu" onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-white/10 lg:hidden"><X size={19} /></button></div>
      <nav className="mt-8 flex-1 space-y-1 overflow-y-auto">{items.map(([href, label, Icon]) => <Link prefetch href={href} key={href} onClick={() => { onNavigate(label); onClose(); }} className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${active(href) ? (dark ? "bg-pink-500/20 text-white" : "bg-pink-50 text-pink-700") : (dark ? "text-gray-300 hover:bg-white/10 hover:text-white" : "text-gray-600 hover:bg-pink-50 hover:text-pink-700")} ${collapsed ? "lg:justify-center" : ""}`} title={collapsed ? label : undefined}><Icon size={18} className="shrink-0" /><span className={collapsed ? "lg:hidden" : ""}>{label}</span>{active(href) && !collapsed && <span className="ml-auto size-1.5 rounded-full bg-pink-400" />}</Link>)}</nav>
      <div className="mt-2 space-y-1 border-t border-current/10 pt-3">
        <button aria-label={collapsed ? "Perluas menu" : "Ciutkan menu"} onClick={() => onNavigate(collapsed ? "Menu diperluas" : "Menu diciutkan")} className={`hidden w-full items-center gap-2 rounded-xl p-3 text-xs font-bold lg:flex ${collapsed ? "justify-center" : ""} ${dark ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-pink-50"}`}><span className="grid size-5 place-items-center">{collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}</span><span className={collapsed ? "hidden" : ""}>Ciutkan menu</span></button>
        {footer}
      </div>
    </aside>
  </>;
}

function Logo({ dark }: { dark: boolean }) { return <span className="inline-flex items-center gap-3"><LogoMark /><span><strong className={`display block text-xl tracking-[.22em] ${dark ? "text-white" : "text-[#28131e]"}`}>PEONY</strong><small className="block text-[8px] tracking-[.27em] text-pink-400">TOGETHER · GROW · MORE</small></span></span>; }
function LogoMark() { return <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-amber-200 via-pink-400 to-fuchsia-800 text-xl text-white shadow-[0_0_24px_rgba(255,80,145,.35)]">P</span>; }
