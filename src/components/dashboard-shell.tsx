import Link from "next/link";
import { BadgeDollarSign, FileClock, FilePlus2, Home, LogOut, Settings, UserRound } from "lucide-react";
import { Brand } from "@/components/brand";
import { logout } from "@/app/(public)/actions";

const links = [
  ["/dashboard", "Dashboard", Home], ["/dashboard/pricelist", "Pricelist", BadgeDollarSign], ["/dashboard/garansi", "Lapor Garansi", FilePlus2], ["/dashboard/riwayat-garansi", "Riwayat", FileClock], ["/dashboard/profil", "Profil Saya", UserRound], ["/dashboard/pengaturan", "Pengaturan", Settings],
] as const;

export function DashboardShell({ name, children }: { name: string; children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#fff9fb]"><aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-pink-100 bg-white p-6 lg:block"><Brand/><nav className="mt-10 space-y-1">{links.map(([href,label,Icon]) => <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-gray-600 transition hover:bg-pink-50 hover:text-pink-700"><Icon size={18}/>{label}</Link>)}</nav><form action={logout} className="absolute bottom-6"><button className="flex items-center gap-2 text-sm font-bold text-gray-500"><LogOut size={17}/>Keluar</button></form></aside><div className="lg:pl-64"><header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-pink-100 bg-white/85 px-5 backdrop-blur sm:px-8"><div className="lg:hidden"><Brand/></div><p className="hidden text-sm text-gray-500 lg:block">Ruang reseller Peony</p><div className="flex items-center gap-3"><span className="hidden text-sm font-bold sm:block">{name}</span><span className="grid size-9 place-items-center rounded-full bg-pink-100 font-bold text-pink-700">{name.charAt(0)}</span></div></header><main className="mx-auto max-w-6xl p-5 pb-28 sm:p-8">{children}</main></div><nav className="fixed inset-x-3 bottom-3 z-30 flex justify-around rounded-2xl border border-pink-100 bg-white/95 p-2 shadow-xl backdrop-blur lg:hidden">{links.slice(0,5).map(([href,label,Icon]) => <Link key={href} href={href} className="grid place-items-center gap-1 px-2 py-1 text-[9px] font-bold text-gray-500"><Icon size={18}/>{label.split(" ")[0]}</Link>)}</nav></div>;
}
