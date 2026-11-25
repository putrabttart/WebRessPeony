import { FormAlert } from "@/components/ui/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { toggleReseller } from "../actions";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SearchField } from "@/components/ui/search-field";

export default async function Resellers({ searchParams }: { searchParams: Promise<{ q?: string; saved?: string; error?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireUser("admin");
  let query = supabase.from("profiles").select("id,full_name,email,phone,is_active,created_at,reseller_details(ba_name)").eq("role", "reseller").order("created_at", { ascending: false });
  if (params.q) query = query.or(`full_name.ilike.%${params.q}%,email.ilike.%${params.q}%,phone.ilike.%${params.q}%`);
  const { data } = await query;
  return <><h1 className="display text-4xl">Reseller</h1><p className="mt-2 text-sm text-gray-500">Klik nama reseller untuk melihat profil, data BA, dan seluruh bukti pendaftaran.</p>
    {params.saved && <div className="mt-5"><FormAlert type="success">Status reseller berhasil diperbarui.</FormAlert></div>}{params.error && <div className="mt-5"><FormAlert type="error">Status reseller gagal diperbarui. Silakan coba kembali.</FormAlert></div>}
    <form className="mt-5 flex max-w-xl gap-2"><SearchField defaultValue={params.q} placeholder="Cari nama, email, atau WhatsApp" label="Cari reseller" /><button className="btn-secondary">Cari</button></form>
    <div className="card mt-5 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="p-4">Reseller</th><th>Nama BA</th><th>WhatsApp</th><th>Terdaftar</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{data?.map((reseller: any) => <tr className="border-t transition hover:bg-pink-50/40" key={reseller.id}><td className="p-4"><Link href={`/admin/resellers/${reseller.id}`} className="group inline-flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-pink-100 font-bold text-pink-700">{reseller.full_name.charAt(0)}</span><span><strong className="block group-hover:text-pink-700">{reseller.full_name}</strong><small>{reseller.email}</small></span><ChevronRight className="text-gray-300 transition group-hover:translate-x-1 group-hover:text-pink-500" size={17} /></Link></td><td>{reseller.reseller_details?.ba_name ?? "-"}</td><td>{reseller.phone}</td><td>{formatDate(reseller.created_at)}</td><td><span className={`rounded-full px-3 py-1 text-xs font-bold ${reseller.is_active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{reseller.is_active ? "Aktif" : "Nonaktif"}</span></td><td><div className="flex items-center gap-4"><Link className="font-bold text-pink-600" href={`/admin/resellers/${reseller.id}`}>Detail</Link><form action={toggleReseller}><input type="hidden" name="id" value={reseller.id} /><input type="hidden" name="active" value={String(reseller.is_active)} /><SubmitButton className="font-bold text-gray-500" pendingText="Memproses...">{reseller.is_active ? "Nonaktifkan" : "Aktifkan"}</SubmitButton></form></div></td></tr>)}</tbody></table>{!data?.length && <p className="p-10 text-center text-sm text-gray-500">Reseller tidak ditemukan.</p>}</div>
  </>;
}
