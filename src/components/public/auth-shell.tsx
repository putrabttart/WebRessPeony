import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/brand";

export function AuthShell({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <main className="min-h-screen bg-[#110b0f] p-4 sm:p-8"><div className="mx-auto max-w-3xl"><header className="mb-6 flex items-center justify-between gap-4"><Brand dark /><Link href="/" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-xs font-bold text-pink-100 transition hover:border-pink-300/50 hover:bg-white/10"><ArrowLeft size={15} /> Beranda</Link></header><div className="mb-5 flex items-center gap-2 text-xs text-[#bda8b2]"><ShieldCheck size={15} className="text-pink-300" /> Ruang aman untuk reseller Peony</div><section className="card overflow-hidden"><div className="peony-gradient px-6 py-8 text-white sm:px-10"><p className="text-xs font-bold uppercase tracking-[.3em]">{eyebrow}</p><h1 className="display mt-2 text-4xl">{title}</h1></div><div className="p-6 sm:p-10">{children}</div></section></div></main>;
}
