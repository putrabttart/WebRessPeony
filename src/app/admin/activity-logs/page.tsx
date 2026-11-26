import { Activity, Boxes, FileCheck2, Filter, Image, LayoutList, Settings, ShieldCheck, UserRound } from "lucide-react";
import { SearchField } from "@/components/ui/search-field";
import { requireUser } from "@/lib/auth";

const handlers = ["Rain", "Cr eld", "Kica", "Ale", "Cheetahily"];
const entityLabels: Record<string, string> = { warranty_claim: "Garansi", product: "Produk", product_plans: "Plan produk", product_plan: "Plan produk", profile: "Reseller", menu: "Menu", banner: "Banner", site_settings: "Pengaturan", telegram_settings: "Telegram", category: "Kategori" };
const actionLabels: Record<string, string> = { create: "menambahkan", update: "memperbarui", delete: "menghapus", sync: "menyinkronkan", activate: "mengaktifkan", deactivate: "menonaktifkan", update_status: "mengubah status" };
const statusLabels: Record<string, string> = { submitted: "Diperiksa", reviewing: "Diperiksa", processing: "On Proses", completed: "Selesai", approved: "Selesai", rejected: "Ditolak" };

export default async function Logs({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; handler?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireUser("admin");
  let query = supabase.from("admin_activity_logs").select("id,action,entity_type,entity_id,metadata,created_at,profiles(full_name)").order("created_at", { ascending: false }).limit(200);
  if (params.type) query = query.eq("entity_type", params.type);
  if (params.handler) query = query.contains("metadata", { handled_by_name: params.handler });
  const { data, error } = await query;
  const logs = (data ?? []).filter((log: any) => !params.q || JSON.stringify(log).toLowerCase().includes(params.q.toLowerCase()));
  const warrantyCount = logs.filter((log: any) => log.entity_type === "warranty_claim").length;
  const activeHandlers = new Set(logs.map((log: any) => log.metadata?.handled_by_name).filter(Boolean)).size;

  return <>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.25em] text-pink-600">Audit trail</p><h1 className="display mt-2 text-4xl">Aktivitas admin</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">Riwayat perubahan penting. Proses garansi ditandai berdasarkan nama admin operasional yang dipilih.</p></div><div className="flex gap-2"><Summary value={logs.length} label="Aktivitas" /><Summary value={warrantyCount} label="Garansi" /><Summary value={activeHandlers} label="Admin aktif" /></div></div>
    <form className="card mt-7 grid gap-3 p-4 md:grid-cols-[1fr_190px_190px_auto]"><SearchField defaultValue={params.q} placeholder="Cari aktivitas, kode, atau reseller..." label="Cari activity log" /><label><span className="sr-only">Jenis aktivitas</span><select className="field" name="type" defaultValue={params.type ?? ""}><option value="">Semua jenis</option><option value="warranty_claim">Garansi</option><option value="product">Produk</option><option value="product_plans">Plan produk</option><option value="profile">Reseller</option><option value="menu">Menu homepage</option><option value="banner">Banner</option><option value="site_settings">Pengaturan</option></select></label><label><span className="sr-only">Admin garansi</span><select className="field" name="handler" defaultValue={params.handler ?? ""}><option value="">Semua admin garansi</option>{handlers.map((handler) => <option value={handler} key={handler}>{handler}</option>)}</select></label><button className="btn-primary"><Filter size={16} /> Filter</button></form>
    {error && <p className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">Activity log gagal dimuat. Silakan muat ulang halaman.</p>}
    <section className="card mt-6 overflow-hidden"><div className="border-b bg-gray-50 px-5 py-4"><h2 className="font-bold">Aktivitas terbaru</h2><p className="mt-1 text-xs text-gray-500">Maksimal 200 aktivitas terbaru.</p></div>{logs.length ? <div className="divide-y">{logs.map((log: any) => <LogItem log={log} key={log.id} />)}</div> : <div className="p-12 text-center"><Activity className="mx-auto text-pink-300" size={40} /><h2 className="display mt-4 text-2xl">Tidak ada aktivitas</h2><p className="mt-2 text-sm text-gray-500">Belum ada aktivitas yang sesuai dengan filter.</p></div>}</section>
  </>;
}

function LogItem({ log }: { log: any }) {
  const metadata = log.metadata ?? {};
  const isWarranty = log.entity_type === "warranty_claim";
  const displayName = isWarranty && metadata.handled_by_name ? metadata.handled_by_name : log.profiles?.full_name ?? "Admin";
  const Icon = iconFor(log.entity_type);
  return <article className="flex gap-4 p-5 transition hover:bg-pink-50/30"><span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${isWarranty ? "bg-pink-100 text-pink-700" : "bg-gray-100 text-gray-600"}`}><Icon size={19} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="text-sm">{displayName}</strong>{isWarranty && metadata.handled_by_name && <span className="rounded-full bg-pink-50 px-2 py-1 text-[10px] font-bold uppercase text-pink-700">Admin garansi</span>}<span className="text-sm text-gray-600">{actionLabels[log.action] ?? log.action} {entityLabels[log.entity_type] ?? log.entity_type}</span></div>{isWarranty ? <div className="mt-2 flex flex-wrap items-center gap-2 text-xs"><span className="font-bold text-gray-700">{metadata.claim_code ?? "Laporan garansi"}</span>{metadata.reseller_name && <span className="text-gray-500">· {metadata.reseller_name}</span>}{metadata.new_status && <><span className="text-gray-300">→</span><span className={statusClass(metadata.new_status)}>{statusLabels[metadata.new_status] ?? metadata.new_status}</span></>}</div> : <p className="mt-2 text-xs text-gray-400">Dilakukan melalui akun {log.profiles?.full_name ?? "admin"}</p>}<time className="mt-2 block text-[11px] text-gray-400">{formatDateTime(log.created_at)}</time></div></article>;
}

function Summary({ value, label }: { value: number; label: string }) { return <div className="rounded-xl border border-pink-100 bg-white px-4 py-2 text-center"><strong className="display block text-xl text-pink-700">{value}</strong><span className="text-[10px] text-gray-500">{label}</span></div>; }
function iconFor(type: string) { return type === "warranty_claim" ? FileCheck2 : type === "product" || type === "product_plans" || type === "product_plan" ? Boxes : type === "profile" ? UserRound : type === "menu" ? LayoutList : type === "banner" ? Image : type === "site_settings" ? Settings : ShieldCheck; }
function statusClass(status: string) { const base = "rounded-full px-2 py-1 text-[10px] font-bold "; return base + (status === "completed" || status === "approved" ? "bg-green-50 text-green-700" : status === "rejected" ? "bg-red-50 text-red-700" : status === "processing" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"); }
function formatDateTime(value: string) { return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value)); }
