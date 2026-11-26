import { FileCheck2 } from "lucide-react";
import { WarrantyCard, type Warranty } from "@/components/admin/warranty-card";
import { SearchField } from "@/components/ui/search-field";
import { requireUser } from "@/lib/auth";

const filters = [
  ["", "Semua"], ["reviewing", "Diperiksa"], ["processing", "On Proses"], ["completed", "Selesai"], ["rejected", "Ditolak"],
] as const;

export default async function Warranties({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireUser("admin");
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = 20;
  let query = supabase.from("warranty_claims").select("id,claim_code,application,status,problem_description,order_date,report_date,account_email,account_duration_value,account_duration_unit,expires_at,remaining_duration_value,remaining_duration_unit,profiles(full_name,phone),warranty_responses(id,response,handled_by_name,old_status,new_status,created_at),warranty_attachments(id,file_path,file_name,mime_type,created_at)", { count: "exact" }).order("status_sort_order", { ascending: true }).order("created_at", { ascending: false });
  if (params.status && filters.some(([value]) => value === params.status)) query = query.eq("status", params.status);
  if (params.q) query = query.or(`claim_code.ilike.%${params.q}%,application.ilike.%${params.q}%,account_email.ilike.%${params.q}%`);
  const { data, error, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);
  const claims = (data ?? []) as unknown as Warranty[];
  const counts = { waiting: claims.filter((x) => ["submitted", "reviewing"].includes(x.status)).length, process: claims.filter((x) => x.status === "processing").length, done: claims.filter((x) => ["completed", "approved"].includes(x.status)).length };

  return <>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.25em] text-pink-600">Operasional</p><h1 className="display mt-2 text-4xl">Laporan garansi</h1><p className="mt-2 text-sm text-gray-500">Periksa laporan, catat tanggapan, lalu informasikan reseller melalui WhatsApp.</p></div><div className="flex gap-2 text-center"><Summary value={counts.waiting} label="Menunggu" /><Summary value={counts.process} label="Diproses" /><Summary value={counts.done} label="Selesai" /></div></div>
    <div className="card mt-7 p-4"><form className="flex flex-col gap-3 sm:flex-row"><SearchField defaultValue={params.q} placeholder="Cari kode, aplikasi, atau data akun..." label="Cari laporan garansi" /><label className="sm:w-48"><span className="sr-only">Filter status</span><select className="field" name="status" defaultValue={params.status ?? ""}>{filters.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><button className="btn-primary">Terapkan filter</button></form></div>
    {error && <div className="mt-6 flex gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-800"><FileCheck2 className="shrink-0" /><p>Data laporan gagal dimuat. Muat ulang halaman atau periksa koneksi Supabase.</p></div>}
    <div className="mt-6 grid gap-3">{claims.length ? claims.map((claim) => <WarrantyCard claim={claim} key={claim.id} />) : !error && <div className="card p-12 text-center"><FileCheck2 className="mx-auto text-pink-300" size={38} /><h2 className="display mt-4 text-2xl">Tidak ada laporan</h2><p className="mt-2 text-sm text-gray-500">Belum ada laporan yang cocok dengan filter ini.</p></div>}</div>
    {(count ?? 0) > pageSize && <Pagination page={page} total={count ?? 0} pageSize={pageSize} q={params.q} status={params.status} />}
  </>;
}

function Summary({ value, label }: { value: number; label: string }) { return <div className="rounded-xl border border-pink-100 bg-white px-4 py-2"><strong className="display block text-xl text-pink-700">{value}</strong><span className="text-[10px] text-gray-500">{label}</span></div>; }
function Pagination({ page, total, pageSize, q, status }: { page: number; total: number; pageSize: number; q?: string; status?: string }) { const pages = Math.ceil(total / pageSize); const href = (target: number) => `/admin/warranties?${new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}), page: String(target) })}`; return <nav className="mt-6 flex items-center justify-between rounded-2xl border bg-white p-4 text-sm"><span className="text-gray-500">Halaman {page} dari {pages} · {total} laporan</span><div className="flex gap-2">{page > 1 && <Link className="btn-secondary" href={href(page - 1)}>Sebelumnya</Link>}{page < pages && <Link className="btn-secondary" href={href(page + 1)}>Berikutnya</Link>}</div></nav>; }
import Link from "next/link";
