"use client";

import { useActionState, useEffect, useState } from "react";
import { AlertCircle, CalendarDays, CheckCircle2, ChevronDown, Clock3, ExternalLink, FileImage, LoaderCircle, Mail, MessageCircle, Send, UserRound } from "lucide-react";
import { updateWarranty, type WarrantyActionState } from "@/app/admin/actions";

type Response = { id: string; response: string | null; old_status: string | null; new_status: string | null; created_at: string };
type Attachment = { id: string; file_path: string; file_name: string | null; mime_type: string | null; created_at: string; signed_url?: string };
export type Warranty = {
  id: string; claim_code: string; application: string; status: string; problem_description: string;
  order_date: string; report_date: string; account_email: string | null;
  account_duration_value: number | null; account_duration_unit: string | null; expires_at: string | null;
  remaining_duration_value: number | null; remaining_duration_unit: string | null;
  profiles: { full_name: string; phone: string | null } | null;
  warranty_responses: Response[];
  warranty_attachments: Attachment[];
};

const statusMeta: Record<string, { label: string; className: string; step: number }> = {
  submitted: { label: "Diterima", className: "bg-blue-50 text-blue-700 ring-blue-100", step: 1 },
  reviewing: { label: "Diperiksa", className: "bg-amber-50 text-amber-700 ring-amber-100", step: 2 },
  approved: { label: "Disetujui", className: "bg-emerald-50 text-emerald-700 ring-emerald-100", step: 3 },
  rejected: { label: "Ditolak", className: "bg-red-50 text-red-700 ring-red-100", step: 3 },
  completed: { label: "Selesai", className: "bg-purple-50 text-purple-700 ring-purple-100", step: 4 },
};

const initialState: WarrantyActionState = { success: false, message: "" };

export function WarrantyCard({ claim }: { claim: Warranty }) {
  const [state, action, pending] = useActionState(updateWarranty, initialState);
  const [selectedStatus, setSelectedStatus] = useState(claim.status);
  const [responseText, setResponseText] = useState("");
  const [expanded, setExpanded] = useState(false);
  const visibleStatus = state.success && state.status ? state.status : selectedStatus;
  const meta = statusMeta[visibleStatus];
  const responses = [...(claim.warranty_responses ?? [])].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  const freshAlreadyLoaded = state.success && responses.some((item) =>
    item.new_status === state.status &&
    (item.response ?? "") === (state.response ?? "") &&
    Math.abs(+new Date(item.created_at) - +new Date(state.savedAt ?? 0)) < 10_000,
  );

  useEffect(() => {
    if (state.success) setResponseText("");
  }, [state.success, state.savedAt]);

  return <article className="card overflow-hidden">
    <button type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)} className="flex w-full items-center gap-4 bg-white p-4 text-left transition hover:bg-pink-50/40 sm:p-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#21121a] text-pink-300"><FileImage size={18} /></span><span className="min-w-0 flex-1"><span className="block text-[10px] font-bold uppercase tracking-[.15em] text-pink-500">{claim.claim_code}</span><strong className="mt-1 block truncate text-sm">{claim.application} · {claim.profiles?.full_name ?? "Reseller"}</strong><small className="mt-1 block text-gray-400">Dilaporkan {formatDate(claim.report_date)} · {claim.warranty_attachments.length} bukti</small></span><span className={`hidden rounded-full px-3 py-1.5 text-xs font-bold ring-1 sm:block ${meta.className}`}>{meta.label}</span><ChevronDown className={`shrink-0 text-gray-400 transition ${expanded ? "rotate-180" : ""}`} size={19} />
    </button>
    {expanded && <><div className="border-y border-gray-100 bg-gradient-to-r from-[#21121a] to-[#42152d] px-5 py-3 text-white"><div className="grid grid-cols-4 gap-1" aria-label={`Tahap ${meta.step} dari 4`}>{[1, 2, 3, 4].map((step) => <span key={step} className={`h-1.5 rounded-full ${step <= meta.step ? "bg-pink-400" : "bg-white/15"}`} />)}</div></div>

    <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[1fr_380px]">
      <div>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <Info icon={<CalendarDays size={15} />} label="Tanggal order" value={formatDate(claim.order_date)} />
          <Info icon={<Clock3 size={15} />} label="Tanggal laporan" value={formatDate(claim.report_date)} />
          <Info icon={<Clock3 size={15} />} label="Durasi akun" value={claim.account_duration_value ? `${claim.account_duration_value} ${claim.account_duration_unit}` : "Tidak dicantumkan"} />
          <Info icon={<CalendarDays size={15} />} label="Tanggal expired" value={claim.expires_at ? formatDate(claim.expires_at) : "Tidak dicantumkan"} />
          <Info icon={<Mail size={15} />} label="Data akun" value={claim.account_email || "Tidak dicantumkan"} />
          <Info icon={<UserRound size={15} />} label="Nama reseller" value={claim.profiles?.full_name ?? "Reseller"} />
        </div>
        <section className="mt-5 rounded-2xl bg-[#faf7f8] p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Kendala reseller</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">{claim.problem_description}</p></section>
        <section className="mt-5"><h3 className="font-bold">Screenshot bukti kendala</h3>{claim.warranty_attachments.length ? <div className="mt-3 grid gap-3 sm:grid-cols-2">{claim.warranty_attachments.map((attachment) => <article className="overflow-hidden rounded-xl border" key={attachment.id}>{attachment.signed_url ? <a href={attachment.signed_url} target="_blank" rel="noreferrer" className="group relative block h-48 bg-gray-100"><img src={attachment.signed_url} alt={attachment.file_name ?? "Bukti kendala"} className="size-full object-cover" /><span className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-full bg-black/65 text-white"><ExternalLink size={16} /></span></a> : <div className="grid h-48 place-items-center bg-gray-50 text-gray-300"><FileImage size={38} /></div>}<p className="truncate p-3 text-xs font-semibold">{attachment.file_name ?? "Bukti kendala"}</p></article>)}</div> : <p className="mt-3 rounded-xl border border-dashed p-4 text-xs text-gray-400">Belum ada screenshot bukti.</p>}</section>

        <section className="mt-6"><div className="flex items-center justify-between"><h3 className="font-bold">Riwayat proses</h3><span className="text-xs text-gray-400">{responses.length} pembaruan</span></div>
          <div className="mt-3 space-y-3">
            {state.success && !freshAlreadyLoaded && <HistoryItem response={state.response || null} status={state.status!} date={state.savedAt!} fresh />}
            {responses.map((response) => <HistoryItem key={response.id} response={response.response} status={response.new_status ?? claim.status} date={response.created_at} />)}
            {!responses.length && !state.success && <p className="rounded-xl border border-dashed p-4 text-center text-xs text-gray-400">Belum ada riwayat tanggapan admin.</p>}
          </div>
        </section>
      </div>

      <form action={action} className="h-fit rounded-2xl border border-pink-100 bg-pink-50/50 p-5">
        <input type="hidden" name="id" value={claim.id} /><input type="hidden" name="claim_code" value={claim.claim_code} />
        <input type="hidden" name="reseller_name" value={claim.profiles?.full_name ?? "Reseller"} /><input type="hidden" name="reseller_phone" value={claim.profiles?.phone ?? ""} />
        <h3 className="display text-xl">Proses laporan</h3><p className="mt-1 text-xs leading-5 text-gray-500">Status dan tanggapan akan langsung terlihat di dashboard reseller.</p>
        {state.message && <div role="alert" className={`mt-4 flex gap-2 rounded-xl p-3 text-sm ${state.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{state.success ? <CheckCircle2 className="shrink-0" size={18} /> : <AlertCircle className="shrink-0" size={18} />}<span>{state.message}</span></div>}
        <label className="mt-5 block"><span className="label">Ubah status</span><select className="field" name="status" value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)} disabled={pending}>{Object.entries(statusMeta).map(([value, item]) => <option value={value} key={value}>{item.label}</option>)}</select></label>
        <label className="mt-4 block"><span className="label">Tanggapan untuk reseller</span><textarea className="field min-h-32 resize-y" name="response" maxLength={3000} placeholder="Jelaskan hasil pemeriksaan atau langkah berikutnya..." disabled={pending} value={responseText} onChange={(event) => setResponseText(event.target.value)} /><span className="mt-1 flex justify-between text-[11px] leading-4 text-gray-400"><span>Teks tidak akan hilang jika penyimpanan gagal.</span><span>{responseText.length}/3000</span></span></label>
        <button className="btn-primary mt-4 w-full" disabled={pending}>{pending ? <><LoaderCircle className="animate-spin" size={17} /> Menyimpan perubahan...</> : <><Send size={17} /> Simpan & catat riwayat</>}</button>
        {state.success && state.whatsappUrl && <a className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#20bd5a]" href={state.whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle size={18} /> Kirim update ke WhatsApp</a>}
        {state.success && !state.whatsappUrl && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Nomor WhatsApp reseller belum tersedia. Update tetap tersimpan di dashboard.</p>}
      </form>
    </div></>}
  </article>;
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="flex gap-3 rounded-xl border border-gray-100 p-3"><span className="mt-0.5 text-pink-500">{icon}</span><div className="min-w-0"><p className="text-[10px] font-bold uppercase text-gray-400">{label}</p><p className="mt-1 truncate text-xs font-semibold text-gray-700">{value}</p></div></div>; }
function HistoryItem({ response, status, date, fresh }: { response: string | null; status: string; date: string; fresh?: boolean }) { const meta = statusMeta[status] ?? statusMeta.submitted; return <div className={`rounded-xl border p-3 ${fresh ? "border-green-200 bg-green-50" : "border-gray-100"}`}><div className="flex items-center justify-between gap-2"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${meta.className}`}>{meta.label}</span><time className="text-[10px] text-gray-400">{formatDateTime(date)}</time></div>{response && <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-gray-600">{response}</p>}</div>; }
function formatDate(value: string) { return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(new Date(value)); }
function formatDateTime(value: string) { return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value)); }
