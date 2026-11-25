import { FormAlert } from "@/components/ui/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth";
import { saveCategory } from "../actions";

export default async function Categories({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireUser("admin");
  const { data } = await supabase.from("product_categories").select("id,name,slug,is_active").order("sort_order");
  return <><h1 className="display text-4xl">Kategori</h1><p className="mt-2 text-sm text-gray-500">Slug digunakan pada URL dan harus unik.</p>
    {params.saved && <div className="mt-5 max-w-2xl"><FormAlert type="success">Kategori berhasil ditambahkan.</FormAlert></div>}{params.error && <div className="mt-5 max-w-2xl"><FormAlert type="error">Kategori gagal disimpan. Periksa nama dan slug.</FormAlert></div>}
    <form action={saveCategory} className="card mt-6 grid max-w-2xl gap-3 p-5 sm:grid-cols-[1fr_1fr_auto]"><label><span className="label">Nama kategori *</span><input className="field" name="name" placeholder="Nama kategori" required /></label><label><span className="label">Slug *</span><input className="field" name="slug" pattern="[a-z0-9-]+" placeholder="nama-kategori" required /></label><div className="pt-6"><SubmitButton pendingText="Menambahkan...">Tambah</SubmitButton></div></form>
    <div className="card mt-5 max-w-2xl divide-y">{data?.map((category) => <div className="flex justify-between p-5" key={category.id}><strong>{category.name}</strong><small>/{category.slug}</small></div>)}</div>
  </>;
}
