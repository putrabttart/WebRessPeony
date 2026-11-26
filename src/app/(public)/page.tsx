import Link from "next/link";
import Image from "next/image";
import { Instagram, LogIn, MessageCircle } from "lucide-react";
import { Brand } from "@/components/brand";
import { HomeMenuList, type HomeMenu } from "@/components/public/home-menu";
import { createPublicClient } from "@/lib/supabase/public";
import { safeTarget } from "@/lib/utils";
import peonyLogo from "../../../logo_peony.jpg";

const fallbackMenus: HomeMenu[] = [
  { id: "register", title: "Daftar / Join Ress", description: "Bergabung dan tumbuh bersama Peony", icon: "user", action_type: "internal", target_url: "/register" },
  { id: "price", title: "Pricelist Reseller", description: "Akses khusus reseller Peony", icon: "price", action_type: "internal", target_url: "/dashboard/pricelist" },
  { id: "channel", title: "Chanel Peony", description: "Informasi terbaru di Telegram", icon: "telegram", action_type: "telegram", target_url: "/channel" },
  { id: "warranty", title: "Lapor Garansi", description: "Ajukan dan pantau laporan garansi", icon: "warranty", action_type: "internal", target_url: "/dashboard/garansi" },
];

type Banner = { id: string; title: string | null; description: string | null; image_path: string; button_label: string | null; target_url: string | null };

export const revalidate = 300;

export default async function HomePage() {
  const supabase = createPublicClient();
  const [menuResult, bannerResult, settingResult] = supabase ? await Promise.all([
    supabase.from("menus").select("id,title,description,icon,target_url,action_type").eq("is_active", true).order("sort_order"),
    supabase.from("banners").select("id,title,description,image_path,button_label,target_url").eq("is_active", true).or(`starts_at.is.null,starts_at.lte.${new Date().toISOString()}`).or(`ends_at.is.null,ends_at.gte.${new Date().toISOString()}`).order("sort_order"),
    supabase.from("site_settings").select("key,value"),
  ]) : [{ data: null, error: null }, { data: null, error: null }, { data: null, error: null }];
  const defaultTargets = new Set(fallbackMenus.map((menu) => menu.target_url));
  const customMenus = (menuResult.data ?? []).filter((menu) => !defaultTargets.has(menu.target_url));
  const menus = [...fallbackMenus, ...customMenus];
  const banners = (bannerResult.data ?? []) as Banner[];
  const settings = Object.fromEntries((settingResult.data ?? []).map((row) => [row.key, typeof row.value === "string" ? row.value : String(row.value ?? "")]));
  const assetBase = supabase?.storage.from("public-assets").getPublicUrl("").data.publicUrl ?? "";
  const siteName = settings.site_name || "PEONY";
  const tagline = settings.tagline || "TOGETHER · GROW · MORE";

  return <main className="relative min-h-screen overflow-hidden bg-[#0b0709] px-5 pb-10 text-white">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(170,28,105,.22),transparent_35%),radial-gradient(circle_at_90%_70%,rgba(245,181,96,.12),transparent_30%)]" />
    <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full border-[42px] border-pink-600/10 blur-sm" />
    <section className="relative mx-auto flex min-h-screen max-w-4xl flex-col items-center py-8">
      <header className="flex w-full items-center justify-between gap-3"><Brand dark name={siteName.toUpperCase()} tagline={tagline} /><div className="flex items-center gap-2"><span className="hidden rounded-full border border-pink-300/20 px-3 py-1.5 text-[10px] tracking-[.2em] text-pink-200 sm:inline-flex">EST. WITH CARE</span><Link href="/login" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-bold text-[#28131e] shadow-[0_8px_28px_rgba(255,79,145,.16)] transition hover:-translate-y-0.5 hover:bg-pink-50"><LogIn size={15} /> Login</Link></div></header>
      <div className="relative mb-7 mt-10 text-center sm:mt-14">
        <div className="bloom relative mx-auto mb-6 size-32 overflow-hidden rounded-full border-2 border-pink-300/30 shadow-[0_0_70px_rgba(244,60,136,.32)]"><Image src={peonyLogo} alt={`Logo ${siteName}`} fill sizes="128px" className="object-cover" priority /></div>
        <p className="mb-3 text-[10px] uppercase tracking-[.52em] text-[#d9a4b9]">{siteName} reseller space</p>
        <h1 className="display text-4xl leading-tight sm:text-6xl">{settings.hero_title || "Grow beautifully,"}<br/><em className="text-gradient font-normal">{settings.hero_emphasis || "together."}</em></h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#ab9aa2]">{settings.hero_description || "Semua yang reseller butuhkan dalam satu ruang yang tertata, aman, dan penuh perhatian."}</p>
      </div>
      {banners.length > 0 && <div className="mb-6 grid w-full max-w-2xl gap-4">{banners.map((banner) => <article key={banner.id} className="relative min-h-48 overflow-hidden rounded-[24px] border border-pink-300/30 bg-[#21121a]">
        <img loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover opacity-55" src={`${assetBase}${banner.image_path}`} alt={banner.title || "Banner Peony"} />
        <div className="relative flex min-h-48 flex-col justify-end bg-gradient-to-t from-black/85 via-black/25 to-transparent p-6"><h2 className="display text-2xl">{banner.title}</h2>{banner.description && <p className="mt-1 max-w-md text-sm text-gray-200">{banner.description}</p>}{banner.button_label && banner.target_url && <Link className="mt-4 w-fit rounded-full bg-white px-4 py-2 text-xs font-bold text-black" href={safeTarget(banner.target_url)}>{banner.button_label}</Link>}</div>
      </article>)}</div>}
      <HomeMenuList menus={menus} />
      <footer className="mt-auto pt-12 text-center"><p className="display text-sm tracking-[.28em] text-pink-200">{settings.footer_text || "PEONY CARE FOR YOU"}</p><div className="mt-4 flex justify-center gap-4 text-[#806f77]"><Instagram size={16}/><MessageCircle size={16}/></div><p className="mt-4 text-[9px] tracking-[.18em] text-[#594c52]">{tagline}</p></footer>
    </section>
  </main>;
}
