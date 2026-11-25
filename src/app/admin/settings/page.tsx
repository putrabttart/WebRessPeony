import { requireUser } from "@/lib/auth";
import { FormAlert } from "@/components/ui/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveSiteSettings } from "../actions";

export default async function Settings({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireUser("admin");
  const { data } = await supabase.from("site_settings").select("key,value");
  const settings = Object.fromEntries((data ?? []).map((row) => [row.key, typeof row.value === "string" ? row.value : String(row.value ?? "")]));
  return <>
    <p className="text-xs font-bold uppercase tracking-[.25em] text-pink-600">Konfigurasi</p><h1 className="display mt-2 text-4xl">Pengaturan website</h1>
    {params.error && <div className="mt-5"><FormAlert type="error">Pengaturan gagal disimpan. Periksa data lalu coba kembali.</FormAlert></div>}
    {params.saved && <div className="mt-5"><FormAlert type="success">Pengaturan website berhasil disimpan dan diterapkan ke homepage.</FormAlert></div>}
    <form action={saveSiteSettings} className="card mt-6 grid gap-5 p-6 sm:grid-cols-2">
      <Field label="Nama website" name="site_name" value={settings.site_name ?? "Peony"} />
      <Field label="Tagline" name="tagline" value={settings.tagline ?? "TOGETHER · GROW · MORE"} />
      <Field label="Judul hero" name="hero_title" value={settings.hero_title ?? "Grow beautifully,"} />
      <Field label="Penekanan hero" name="hero_emphasis" value={settings.hero_emphasis ?? "together."} />
      <Field label="Deskripsi hero" name="hero_description" value={settings.hero_description ?? "Semua yang reseller butuhkan dalam satu ruang yang tertata, aman, dan penuh perhatian."} wide />
      <Field label="Teks footer" name="footer_text" value={settings.footer_text ?? "PEONY CARE FOR YOU"} />
      <Field label="Kontak WhatsApp" name="contact_whatsapp" value={settings.contact_whatsapp ?? ""} />
      <Field label="SEO title" name="seo_title" value={settings.seo_title ?? "Peony"} />
      <Field label="SEO description" name="seo_description" value={settings.seo_description ?? "Peony Reseller Management System"} wide />
      <div className="sm:col-span-2 flex justify-end"><SubmitButton pendingText="Menyimpan pengaturan...">Simpan pengaturan</SubmitButton></div>
    </form>
  </>;
}
function Field({ label, name, value, wide }: { label: string; name: string; value: string; wide?: boolean }) { return <label className={wide ? "sm:col-span-2" : ""}><span className="label">{label}</span><input className="field" name={name} defaultValue={value} /></label>; }
