import Link from "next/link";
import { ArrowUpRight, BadgeDollarSign, CircleUserRound, FileCheck2, Send } from "lucide-react";
import { safeTarget } from "@/lib/utils";

const icons = { user: CircleUserRound, price: BadgeDollarSign, telegram: Send, warranty: FileCheck2 };

export type HomeMenu = { id: string; title: string; description: string | null; icon: string | null; target_url: string | null; action_type: string };

export function HomeMenuList({ menus }: { menus: HomeMenu[] }) {
  return <div className="mx-auto grid w-full max-w-2xl gap-3">
    {menus.map((menu, index) => {
      const Icon = icons[menu.icon as keyof typeof icons] ?? ArrowUpRight;
      const href = safeTarget(menu.target_url);
      return <Link key={menu.id} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="group relative overflow-hidden rounded-[22px] p-px transition hover:-translate-y-1" style={{ background: `linear-gradient(110deg, rgba(255,211,137,${.65 - index * .06}), #ff4f91, #7e1b62)` }}>
        <span className="flex min-h-[78px] items-center gap-4 rounded-[21px] bg-[#130d11]/95 px-5 py-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-pink-400/25 to-amber-300/10 text-pink-300"><Icon size={21} /></span>
          <span className="min-w-0 flex-1 text-center"><strong className="display block text-lg font-normal tracking-wide text-white">{menu.title}</strong>{menu.description && <small className="mt-1 block truncate text-[11px] text-[#a9959e]">{menu.description}</small>}</span>
          <ArrowUpRight className="text-pink-300 transition group-hover:rotate-45" size={19} />
        </span>
      </Link>;
    })}
  </div>;
}
