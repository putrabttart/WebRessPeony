import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, ExternalLink, FileImage, Instagram, Mail, MessageCircle, ShieldCheck, UserRound } from "lucide-react";
import { FormAlert } from "@/components/ui/form-alert";
import { ResellerStatusToggle } from "@/components/admin/reseller-status-toggle";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

type Evidence = { id: string; file_path: string | null; external_url: string | null; description: string | null; evidence_date: string | null; created_at: string };
type Pricelist = { id: string; file_path: string | null; external_url: string | null; created_at: string };

export default async function ResellerDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase } = await requireUser("admin");
  const { data: reseller } = await supabase.from("profiles").select("id,full_name,email,phone,is_active,created_at,reseller_details(id,ba_name,ba_start_year,sales_username,created_at,reseller_testimonials(id,file_path,external_url,description,evidence_date,created_at),reseller_pricelists(id,file_path,external_url,created_at))").eq("id", id).eq("role", "reseller").single();
  if (!reseller) notFound();

  const detail = Array.isArray(reseller.reseller_details) ? reseller.reseller_details[0] : reseller.reseller_details;
  const testimonials = ((detail as any)?.reseller_testimonials ?? []) as Evidence[];
  const pricelists = ((detail as any)?.reseller_pricelists ?? []) as Pricelist[];
  const paths = [...testimonials.map((item) => item.file_path).filter((path): path is string => Boolean(path)), ...pricelists.map((item) => item.file_path).filter((path): path is string => Boolean(path))];
  const signedUrls = new Map<string, string>();
  let evidenceError = false;
  if (paths.length) {
    const { data, error } = await supabase.storage.from("reseller-evidence").createSignedUrls(paths, 60 * 15);
    evidenceError = Boolean(error);
    data?.forEach((item, index) => { if (item.signedUrl) signedUrls.set(paths[index], item.signedUrl); });
  }

  return <>
    <Link href="/admin/resellers" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-pink-700"><ArrowLeft size={16} /> Kembali ke daftar reseller</Link>
    <div className="mt-6 flex flex-wrap items-start justify-between gap-5"><div className="flex items-center gap-4"><span className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-pink-100 to-amber-100 text-2xl font-bold text-pink-700">{reseller.full_name.charAt(0)}</span><div><p className="text-xs font-bold uppercase tracking-[.2em] text-pink-500">Detail reseller</p><h1 className="display mt-1 text-4xl">{reseller.full_name}</h1><p className="mt-1 text-sm text-gray-500">Terdaftar {formatDate(reseller.created_at)}</p></div></div><span className={`rounded-full px-4 py-2 text-xs font-bold ${reseller.is_active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{reseller.is_active ? "Akun aktif" : "Akun nonaktif"}</span></div>
    {query.saved && <div className="mt-6"><FormAlert type="success">Status reseller berhasil diperbarui.</FormAlert></div>}{(query.error || evidenceError) && <div className="mt-6"><FormAlert type="error">{query.error === "status" ? "Status reseller gagal diperbarui." : "Bukti tidak dapat dimuat seluruhnya. Muat ulang halaman atau periksa akses Storage."}</FormAlert></div>}

    <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <section className="card p-6"><h2 className="display text-2xl">Informasi reseller</h2><dl className="mt-5 grid gap-4 sm:grid-cols-2"><Info icon={<UserRound />} label="Nama lengkap" value={reseller.full_name} /><Info icon={<Mail />} label="Email" value={reseller.email ?? "-"} /><Info icon={<MessageCircle />} label="WhatsApp" value={reseller.phone ?? "-"} /><Info icon={<ShieldCheck />} label="Status akun" value={reseller.is_active ? "Aktif" : "Nonaktif"} /></dl></section>
        <section className="card p-6"><h2 className="display text-2xl">Data BA</h2>{detail ? <dl className="mt-5 grid gap-4 sm:grid-cols-2"><Info icon={<UserRound />} label="Nama BA" value={(detail as any).ba_name} /><Info icon={<CalendarDays />} label="Awal BA" value={String((detail as any).ba_start_year)} /><Info icon={<Instagram />} label="Username jualan" value={(detail as any).sales_username} /><Info icon={<CalendarDays />} label="Data dilengkapi" value={formatDate((detail as any).created_at)} /></dl> : <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Data BA belum lengkap.</p>}</section>
        <EvidenceSection title="Bukti testimoni" description="Bukti testimoni yang diunggah saat pendaftaran." items={testimonials.map((item, index) => ({ id: item.id, label: `Testimoni ${index + 1}`, date: item.evidence_date || item.created_at, url: item.file_path ? signedUrls.get(item.file_path) : item.external_url }))} />
        <EvidenceSection title="Link pricelist" description="Bukti bahwa reseller tidak melakukan underprice." items={pricelists.map((item, index) => ({ id: item.id, label: `Pricelist ${index + 1}`, date: item.created_at, url: item.external_url || (item.file_path ? signedUrls.get(item.file_path) : undefined) }))} />
      </div>
      <aside className="space-y-5"><section className="card p-5"><h2 className="font-bold">Status akun</h2><p className="mt-2 text-xs leading-5 text-gray-500">Nonaktifkan toggle untuk menghentikan akses reseller ke dashboard.</p><div className="mt-4 rounded-xl bg-gray-50 p-4"><ResellerStatusToggle id={reseller.id} active={reseller.is_active} returnTo={`/admin/resellers/${reseller.id}`} /></div></section><FormAlert type="info">Tautan bukti bersifat privat dan hanya aktif selama 15 menit. Muat ulang halaman untuk membuat tautan baru.</FormAlert></aside>
    </div>
  </>;
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="flex gap-3 rounded-xl border border-gray-100 p-4"><span className="mt-0.5 text-pink-500">{icon}</span><div className="min-w-0"><dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</dt><dd className="mt-1 break-words text-sm font-semibold text-gray-700">{value}</dd></div></div>; }
function EvidenceSection({ title, description, items }: { title: string; description: string; items: { id: string; label: string; date: string; url?: string | null }[] }) { return <section className="card p-6"><div><h2 className="display text-2xl">{title}</h2><p className="mt-1 text-sm text-gray-500">{description}</p></div>{items.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2">{items.map((item) => <article className="overflow-hidden rounded-2xl border border-gray-100" key={item.id}>{item.url ? <a href={item.url} target="_blank" rel="noreferrer" className="group block"><div className="relative h-52 bg-gray-100"><img className="size-full object-cover transition group-hover:scale-[1.02]" src={item.url} alt={item.label} /><span className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-full bg-black/65 text-white"><ExternalLink size={16} /></span></div></a> : <div className="grid h-52 place-items-center bg-gray-50 text-gray-300"><FileImage size={38} /></div>}<div className="p-4"><strong className="block text-sm">{item.label}</strong><small className="mt-1 block text-gray-400">Dikirim {formatDate(item.date)}</small>{!item.url && <small className="mt-2 block font-semibold text-red-600">File tidak dapat diakses</small>}</div></article>)}</div> : <p className="mt-5 rounded-xl border border-dashed p-8 text-center text-sm text-gray-400">Belum ada bukti tersimpan.</p>}</section>; }
