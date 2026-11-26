import Link from "next/link";
import Image from "next/image";
import peonyLogo from "../../logo_peony.jpg";

export function Brand({ dark = false, name = "PEONY", tagline = "TOGETHER · GROW · MORE" }: { dark?: boolean; name?: string; tagline?: string }) {
  return <Link href="/" className="inline-flex items-center gap-3" aria-label="Peony homepage">
    <span className="relative size-10 overflow-hidden rounded-full border border-pink-200/30 shadow-[0_0_24px_rgba(255,80,145,.35)]"><Image src={peonyLogo} alt="Logo Peony" fill sizes="40px" className="object-cover" priority /></span>
    <span><strong className={`display block text-xl tracking-[.22em] ${dark ? "text-white" : "text-[#28131e]"}`}>{name}</strong><small className="block text-[8px] tracking-[.27em] text-pink-400">{tagline}</small></span>
  </Link>;
}
