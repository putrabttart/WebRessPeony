import Link from "next/link";

export function Brand({ dark = false, name = "PEONY", tagline = "TOGETHER · GROW · MORE" }: { dark?: boolean; name?: string; tagline?: string }) {
  return <Link href="/" className="inline-flex items-center gap-3" aria-label="Peony homepage">
    <span className="relative grid size-10 place-items-center rounded-full bg-gradient-to-br from-amber-200 via-pink-400 to-fuchsia-800 text-xl text-white shadow-[0_0_24px_rgba(255,80,145,.35)]">P</span>
    <span><strong className={`display block text-xl tracking-[.22em] ${dark ? "text-white" : "text-[#28131e]"}`}>{name}</strong><small className="block text-[8px] tracking-[.27em] text-pink-400">{tagline}</small></span>
  </Link>;
}
