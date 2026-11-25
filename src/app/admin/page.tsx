import { Boxes, FileCheck2, Users, UserCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";

export default async function AdminPage() {
  const { supabase } = await requireUser("admin");
  const [resellers, activeResellers, products, warranties, recent] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "reseller"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "reseller").eq("is_active", true),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("warranty_claims").select("id", { count: "exact", head: true }),
    supabase.from("warranty_claims").select("claim_code,application,status,created_at").order("created_at", { ascending: false }).limit(6),
  ]);

  return <>
    <p className="text-xs font-bold uppercase tracking-[.25em] text-pink-600">Control center</p>
    <h1 className="display mt-2 text-4xl">Ringkasan Peony</h1>
    <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat icon={<Users />} label="Total reseller" value={resellers.count ?? 0} />
      <Stat icon={<UserCheck />} label="Reseller aktif" value={activeResellers.count ?? 0} />
      <Stat icon={<Boxes />} label="Produk aktif" value={products.count ?? 0} />
      <Stat icon={<FileCheck2 />} label="Total garansi" value={warranties.count ?? 0} />
    </div>
    <section className="card mt-7 p-6">
      <h2 className="display text-2xl">Laporan terbaru</h2>
      {recent.data?.length ? <div className="mt-4 divide-y">{recent.data.map((claim) =>
        <div className="flex justify-between py-4 text-sm" key={claim.claim_code}>
          <span><strong>{claim.claim_code}</strong><small className="ml-2 text-gray-500">{claim.application}</small></span>
          <span className="font-bold text-pink-600">{claim.status}</span>
        </div>,
      )}</div> : <p className="mt-5 text-sm text-gray-500">Belum ada laporan.</p>}
    </section>
  </>;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <div className="card flex gap-4 p-5"><span className="text-pink-600">{icon}</span><div><strong className="display text-3xl">{value}</strong><p className="text-xs text-gray-500">{label}</p></div></div>;
}
