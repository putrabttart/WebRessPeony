import { requireUser } from "@/lib/auth";
import { FormAlert } from "@/components/ui/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveTelegram } from "../actions";

export default async function Telegram({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireUser("admin");
  const { data } = await supabase.from("telegram_settings").select("id,channel_name,description,channel_url,is_active").limit(1).maybeSingle();
  return <><p className="text-xs font-bold uppercase tracking-[.25em] text-pink-600">Konfigurasi</p><h1 className="display mt-2 text-4xl">Channel Telegram</h1>
    {params.error && <div className="mt-5"><FormAlert type="error">{params.error === "url" ? "Gunakan URL https://t.me/... yang valid." : "Pengaturan Telegram gagal disimpan."}</FormAlert></div>}
    {params.saved && <div className="mt-5"><FormAlert type="success">Pengaturan Telegram berhasil disimpan.</FormAlert></div>}
    <form action={saveTelegram} className="card mt-6 max-w-3xl space-y-5 p-6"><input type="hidden" name="id" value={data?.id ?? ""} />
      <label><span className="label">Nama channel</span><input className="field" name="channel_name" defaultValue={data?.channel_name ?? ""} required /></label>
      <label><span className="label">Deskripsi</span><textarea className="field min-h-24" name="description" defaultValue={data?.description ?? ""} /></label>
      <label><span className="label">URL Telegram</span><input className="field" name="channel_url" type="url" defaultValue={data?.channel_url ?? ""} placeholder="https://t.me/channel" required /></label>
      <label className="flex items-center gap-2 text-sm font-bold"><input name="is_active" type="checkbox" defaultChecked={data?.is_active ?? true} /> Tampilkan channel</label>
      <SubmitButton pendingText="Menyimpan Telegram...">Simpan Telegram</SubmitButton>
    </form></>;
}
