import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { FormAlert } from "@/components/ui/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth";
import { deleteBanner, saveBanner } from "../actions";

const errors: Record<string, string> = { url: "URL tujuan banner tidak valid.", image: "Pilih JPG, PNG, atau WebP maksimal 5 MB.", upload: "Gambar gagal diunggah. Periksa policy bucket public-assets.", save: "Banner gagal disimpan." };

export default async function Banners({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireUser("admin");
  const { data } = await supabase.from("banners").select("id,title,description,image_path,button_label,target_url,sort_order,is_active,starts_at,ends_at").order("sort_order");
  const { data: bucket } = supabase.storage.from("public-assets").getPublicUrl("");
  return <>
    <p className="text-xs font-bold uppercase tracking-[.25em] text-pink-600">Homepage</p><h1 className="display mt-2 text-4xl">Banner</h1>
    <p className="mt-2 text-sm text-gray-500">Gambar tampil responsif di atas daftar menu sesuai periode aktif.</p>
    {params.error && <div className="mt-5"><FormAlert type="error">{errors[params.error] ?? errors.save}</FormAlert></div>}
    {params.saved && <div className="mt-5"><FormAlert type="success">{params.saved === "deleted" ? "Banner dan gambar berhasil dihapus." : "Banner berhasil disimpan dan perubahan sudah diterapkan."}</FormAlert></div>}
    <BannerForm />
    <div className="mt-6 grid gap-5">{data?.map((banner) => <BannerForm key={banner.id} banner={banner} publicBase={bucket.publicUrl} />)}</div>
  </>;
}

type Banner = { id: string; title: string | null; description: string | null; image_path: string; button_label: string | null; target_url: string | null; sort_order: number; is_active: boolean; starts_at: string | null; ends_at: string | null };
function localDate(value: string | null) { return value ? new Date(value).toISOString().slice(0, 16) : ""; }

function BannerForm({ banner, publicBase }: { banner?: Banner; publicBase?: string }) {
  return <div className="card mt-6 p-5"><form action={saveBanner} className="grid gap-4 md:grid-cols-6">
    <input type="hidden" name="id" value={banner?.id ?? ""} /><input type="hidden" name="existing_image" value={banner?.image_path ?? ""} />
    {banner && publicBase && <div className="md:col-span-2"><span className="label">Preview saat ini</span><img className="h-28 w-full rounded-xl object-cover" src={`${publicBase}${banner.image_path}`} alt="Preview banner" /></div>}
    <label className="md:col-span-2"><span className="label">Judul</span><input className="field" name="title" defaultValue={banner?.title ?? ""} /></label>
    <label className="md:col-span-2"><span className="label">Deskripsi</span><input className="field" name="description" defaultValue={banner?.description ?? ""} /></label>
    <label className="md:col-span-2"><span className="label">Gambar {banner && "baru (opsional)"}</span><input className="field" name="image" type="file" accept="image/jpeg,image/png,image/webp" required={!banner} /></label>
    <label><span className="label">Teks tombol</span><input className="field" name="button_label" defaultValue={banner?.button_label ?? ""} /></label>
    <label className="md:col-span-2"><span className="label">URL tombol</span><input className="field" name="target_url" defaultValue={banner?.target_url ?? ""} placeholder="/register atau https://..." /></label>
    <label><span className="label">Urutan</span><input className="field" name="sort_order" type="number" min="0" defaultValue={banner?.sort_order ?? 0} /></label>
    <label><span className="label">Mulai tampil</span><input className="field" name="starts_at" type="datetime-local" defaultValue={localDate(banner?.starts_at ?? null)} /></label>
    <label><span className="label">Berakhir</span><input className="field" name="ends_at" type="datetime-local" defaultValue={localDate(banner?.ends_at ?? null)} /></label>
    <label className="flex items-center gap-2 pt-7 text-sm font-bold"><input name="is_active" type="checkbox" defaultChecked={banner?.is_active ?? true} /> Aktif</label>
    <div className="md:col-span-5 flex justify-end"><SubmitButton pendingText="Mengunggah dan menyimpan...">{banner ? "Simpan banner" : "Tambah banner"}</SubmitButton></div>
  </form>{banner && <div className="mt-3 flex justify-end"><form action={deleteBanner}><input type="hidden" name="id" value={banner.id} /><ConfirmSubmit message="Hapus banner dan gambarnya secara permanen?">Hapus banner</ConfirmSubmit></form></div>}</div>;
}
