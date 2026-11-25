import { FileCheck2, Search } from "lucide-react";
import { WarrantyCard, type Warranty } from "@/components/admin/warranty-card";
import { requireUser } from "@/lib/auth";

const filters = [
  ["", "Semua"], ["submitted", "Diterima"], ["reviewing", "Diperiksa"], ["approved", "Disetujui"], ["rejected", "Ditolak"], ["completed", "Selesai"],
] as const;

export default async function Warranties({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireUser("admin");
  let query = supabase.from("warranty_claims").select("id,claim_code,application,status,problem_description,order_date,report_date,account_email,remaining_duration_value,remaining_duration_unit,profiles(full_name,phone),warranty_responses(id,response,old_status,new_status,created_at)").order("created_at", { ascending: false });
  if (params.status && filters.some(([value]) => value === params.status)) query = query.eq("status", params.status);
  if (params.q) query = query.or(`claim_code.ilike.%${params.q}%,application.ilike.%${params.q}%,account_email.ilike.%${params.q}%`);
  const { data, error } = await query;
  const claims = (data ?? []) as unknown as Warranty[];
  const counts = { waiting: claims.filter((x) => x.status === "submitted").length, process: claims.filter((x) => x.status === "reviewing").length, done: claims.filter((x) => x.status === "completed").length };

  return <>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.25em] text-pink-600">Operasional</p><h1 className="display mt-2 text-4xl">Laporan garansi</h1><p className="mt-2 text-sm text-gray-500">Periksa laporan, catat tanggapan, lalu informasikan reseller melalui WhatsApp.</p></div><div className="flex gap-2 text-center"><Summary value={counts.waiting} label="Menunggu" /><Summary value={counts.process} label="Diproses" /><Summary value={counts.done} label="Selesai" /></div></div>
    <div className="card mt-7 p-4"><form className="flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><Search className="absolute left-4 top-3.5 text-gray-400" size={18} /><input className="field pl-11" name="q" defaultValue={params.q} placeholder="Cari kode, aplikasi, atau data akun..." /></label><select className="field sm:w-48" name="status" defaultValue={params.status ?? ""}>{filters.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><button className="btn-primary">Terapkan filter</button></form></div>
    {error && <div className="mt-6 flex gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-800"><FileCheck2 className="shrink-0" /><p>Data laporan gagal dimuat. Muat ulang halaman atau periksa koneksi Supabase.</p></div>}
    <div className="mt-6 grid gap-6">{claims.length ? claims.map((claim) => <WarrantyCard claim={claim} key={claim.id} />) : !error && <div className="card p-12 text-center"><FileCheck2 className="mx-auto text-pink-300" size={38} /><h2 className="display mt-4 text-2xl">Tidak ada laporan</h2><p className="mt-2 text-sm text-gray-500">Belum ada laporan yang cocok dengan filter ini.</p></div>}</div>
  </>;
}

function Summary({ value, label }: { value: number; label: string }) { return <div className="rounded-xl border border-pink-100 bg-white px-4 py-2"><strong className="display block text-xl text-pink-700">{value}</strong><span className="text-[10px] text-gray-500">{label}</span></div>; }
