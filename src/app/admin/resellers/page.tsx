import { FormAlert } from "@/components/ui/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { toggleReseller } from "../actions";

export default async function Resellers({ searchParams }: { searchParams: Promise<{ q?: string; saved?: string; error?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireUser("admin");
  let query = supabase.from("profiles").select("id,full_name,email,phone,is_active,created_at,reseller_details(ba_name)").eq("role", "reseller").order("created_at", { ascending: false });
  if (params.q) query = query.or(`full_name.ilike.%${params.q}%,email.ilike.%${params.q}%,phone.ilike.%${params.q}%`);
  const { data } = await query;
  return <><h1 className="display text-4xl">Reseller</h1>
    {params.saved && <div className="mt-5"><FormAlert type="success">Status reseller berhasil diperbarui.</FormAlert></div>}{params.error && <div className="mt-5"><FormAlert type="error">Status reseller gagal diperbarui. Silakan coba kembali.</FormAlert></div>}
    <form className="mt-5 flex max-w-xl gap-2"><input className="field" name="q" defaultValue={params.q} placeholder="Cari nama, email, atau WhatsApp" /><button className="btn-secondary">Cari</button></form>
    <div className="card mt-5 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="p-4">Reseller</th><th>Nama BA</th><th>WhatsApp</th><th>Terdaftar</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{data?.map((reseller: any) => <tr className="border-t" key={reseller.id}><td className="p-4"><strong className="block">{reseller.full_name}</strong><small>{reseller.email}</small></td><td>{reseller.reseller_details?.ba_name ?? "-"}</td><td>{reseller.phone}</td><td>{formatDate(reseller.created_at)}</td><td>{reseller.is_active ? "Aktif" : "Nonaktif"}</td><td><form action={toggleReseller}><input type="hidden" name="id" value={reseller.id} /><input type="hidden" name="active" value={String(reseller.is_active)} /><SubmitButton className="font-bold text-pink-600" pendingText="Memproses...">{reseller.is_active ? "Nonaktifkan" : "Aktifkan"}</SubmitButton></form></td></tr>)}</tbody></table></div>
  </>;
}
