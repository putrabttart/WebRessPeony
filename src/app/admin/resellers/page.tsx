import { FormAlert } from "@/components/ui/form-alert";
import { ResellerStatusToggle } from "@/components/admin/reseller-status-toggle";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SearchField } from "@/components/ui/search-field";

export default async function Resellers({ searchParams }: { searchParams: Promise<{ q?: string; saved?: string; error?: string; page?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireUser("admin");
  const page = Math.max(1, Number(params.page) || 1); const pageSize = 30;
  let query = supabase.from("profiles").select("id,full_name,email,phone,is_active,created_at,reseller_details(ba_name)", { count: "exact" }).eq("role", "reseller").order("created_at", { ascending: false });
  if (params.q) query = query.or(`full_name.ilike.%${params.q}%,email.ilike.%${params.q}%,phone.ilike.%${params.q}%`);
  const { data, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);
  return <><h1 className="display text-4xl">Reseller</h1><p className="mt-2 text-sm text-gray-500">Klik nama reseller untuk melihat profil, data BA, dan seluruh bukti pendaftaran.</p>
    {params.saved && <div className="mt-5"><FormAlert type="success">Status reseller berhasil diperbarui.</FormAlert></div>}{params.error && <div className="mt-5"><FormAlert type="error">Status reseller gagal diperbarui. Silakan coba kembali.</FormAlert></div>}
    <form className="mt-5 flex max-w-xl gap-2"><SearchField defaultValue={params.q} placeholder="Cari nama, email, atau WhatsApp" label="Cari reseller" /><button className="btn-secondary">Cari</button></form>
    <div className="card mt-5 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="p-4">Reseller</th><th>Nama BA</th><th>WhatsApp</th><th>Terdaftar</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{data?.map((reseller: any) => <tr className="border-t transition hover:bg-pink-50/40" key={reseller.id}><td className="p-4"><Link href={`/admin/resellers/${reseller.id}`} className="group inline-flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-pink-100 font-bold text-pink-700">{reseller.full_name.charAt(0)}</span><span><strong className="block group-hover:text-pink-700">{reseller.full_name}</strong><small>{reseller.email}</small></span><ChevronRight className="text-gray-300 transition group-hover:translate-x-1 group-hover:text-pink-500" size={17} /></Link></td><td>{reseller.reseller_details?.ba_name ?? "-"}</td><td>{reseller.phone}</td><td>{formatDate(reseller.created_at)}</td><td><ResellerStatusToggle id={reseller.id} active={reseller.is_active} /></td><td><Link className="font-bold text-pink-600" href={`/admin/resellers/${reseller.id}`}>Lihat detail</Link></td></tr>)}</tbody></table>{!data?.length && <p className="p-10 text-center text-sm text-gray-500">Reseller tidak ditemukan.</p>}</div>{(count ?? 0) > pageSize && <nav className="mt-5 flex items-center justify-between rounded-2xl border bg-white p-4 text-sm"><span className="text-gray-500">Halaman {page} dari {Math.ceil((count ?? 0) / pageSize)}</span><div className="flex gap-2">{page > 1 && <Link className="btn-secondary" href={`/admin/resellers?${new URLSearchParams({ ...(params.q ? { q: params.q } : {}), page: String(page - 1) })}`}>Sebelumnya</Link>}{page * pageSize < (count ?? 0) && <Link className="btn-secondary" href={`/admin/resellers?${new URLSearchParams({ ...(params.q ? { q: params.q } : {}), page: String(page + 1) })}`}>Berikutnya</Link>}</div></nav>}
  </>;
}
