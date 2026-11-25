import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { FormAlert } from "@/components/ui/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth";
import { deleteMenu, saveMenu } from "../actions";

const errors: Record<string, string> = { url: "URL tujuan tidak valid. Gunakan route /... atau URL http/https.", save: "Menu gagal disimpan." };

export default async function Menus({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireUser("admin");
  const { data } = await supabase.from("menus").select("id,title,description,icon,action_type,target_url,is_active,sort_order").order("sort_order");
  return <>
    <p className="text-xs font-bold uppercase tracking-[.25em] text-pink-600">Homepage</p>
    <h1 className="display mt-2 text-4xl">Menu homepage</h1>
    <p className="mt-2 text-sm text-gray-500">Urutan terkecil ditampilkan lebih dahulu. Perubahan aktif langsung muncul di homepage.</p>
    {params.error && <div className="mt-5"><FormAlert type="error">{errors[params.error] ?? errors.save}</FormAlert></div>}
    {params.saved && <div className="mt-5"><FormAlert type="success">{params.saved === "deleted" ? "Menu berhasil dihapus." : "Perubahan menu berhasil disimpan dan diterapkan ke homepage."}</FormAlert></div>}
    <MenuForm />
    <div className="mt-6 grid gap-4">{data?.length ? data.map((menu) => <MenuForm key={menu.id} menu={menu} />) : <p className="card p-10 text-center text-gray-500">Belum ada menu.</p>}</div>
  </>;
}

type Menu = { id: string; title: string; description: string | null; icon: string | null; action_type: string; target_url: string | null; is_active: boolean; sort_order: number };

function MenuForm({ menu }: { menu?: Menu }) {
  return <div className="card mt-6 p-5"><form action={saveMenu} className="grid gap-4 md:grid-cols-6">
    <input type="hidden" name="id" value={menu?.id ?? ""} />
    <label className="md:col-span-2"><span className="label">Judul</span><input className="field" name="title" defaultValue={menu?.title} placeholder="Nama menu" required /></label>
    <label className="md:col-span-2"><span className="label">Deskripsi</span><input className="field" name="description" defaultValue={menu?.description ?? ""} placeholder="Deskripsi singkat" /></label>
    <label><span className="label">Ikon</span><select className="field" name="icon" defaultValue={menu?.icon ?? "link"}><option value="user">Pengguna</option><option value="price">Harga</option><option value="telegram">Telegram</option><option value="warranty">Garansi</option><option value="link">Tautan</option></select></label>
    <label><span className="label">Urutan</span><input className="field" name="sort_order" type="number" min="0" defaultValue={menu?.sort_order ?? 0} required /></label>
    <label><span className="label">Jenis tindakan</span><select className="field" name="action_type" defaultValue={menu?.action_type ?? "internal"}><option value="internal">Internal</option><option value="external">Eksternal</option><option value="telegram">Telegram</option><option value="custom">Custom</option></select></label>
    <label className="md:col-span-3"><span className="label">URL / route tujuan</span><input className="field" name="target_url" defaultValue={menu?.target_url ?? ""} placeholder="/register atau https://..." /></label>
    <label className="flex items-center gap-2 pt-7 text-sm font-bold"><input name="is_active" type="checkbox" defaultChecked={menu?.is_active ?? true} /> Aktif</label>
    <div className="flex items-center justify-end gap-5 pt-6"><SubmitButton pendingText="Menyimpan menu...">{menu ? "Simpan" : "Tambah menu"}</SubmitButton></div>
  </form>{menu && <div className="mt-3 flex justify-end"><DeleteMenu id={menu.id} /></div>}</div>;
}

function DeleteMenu({ id }: { id: string }) {
  return <form action={deleteMenu}><input type="hidden" name="id" value={id} /><ConfirmSubmit message="Hapus menu ini secara permanen?">Hapus menu</ConfirmSubmit></form>;
}
