"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ExternalLink, FileCheck2, Send } from "lucide-react";
import { createWarranty, type WarrantyFormState } from "@/app/dashboard/actions";
import { FormAlert } from "@/components/ui/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: WarrantyFormState = { success: false, message: "" };

export function WarrantyForm({ resellerName }: { resellerName: string }) {
  const [state, action] = useActionState(createWarranty, initialState);
  const [today, setToday] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.success) { formRef.current?.reset(); window.scrollTo({ top: 0, behavior: "smooth" }); } }, [state.success, state.claimCode]);
  useEffect(() => { setToday(getLocalDate()); }, []);

  return <form ref={formRef} action={action} className="card mt-6 overflow-hidden">
    <div className="border-b border-pink-100 bg-gradient-to-r from-pink-50 to-amber-50 p-6 sm:p-8"><div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-pink-600 shadow-sm"><FileCheck2 size={21} /></span><div><h2 className="display text-2xl">Data laporan</h2><p className="mt-1 text-sm leading-6 text-gray-600">Semua field bertanda <strong>*</strong> wajib diisi. Periksa kembali data sebelum mengirim.</p></div></div></div>
    <div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
      {state.message && <div className="sm:col-span-2"><FormAlert type={state.success ? "success" : "error"}>{state.message}{state.claimCode && <p className="mt-1 font-bold">Kode laporan: {state.claimCode}</p>}</FormAlert></div>}
      <Field label="Nama reseller *" hint="Diambil otomatis dari akun Anda."><input className="field bg-gray-50" value={resellerName} readOnly /></Field>
      <Field label="Tanggal report *" hint="Tanggal ditentukan otomatis oleh sistem saat laporan dikirim."><input className="field bg-gray-50" type="date" value={today} readOnly aria-readonly="true" /></Field>
      <Field label="Tanggal order *"><input className="field" name="order_date" type="date" max={new Date().toISOString().slice(0, 10)} required /></Field>
      <Field label="Aplikasi *"><input className="field" name="application" placeholder="Contoh: nama aplikasi terkait" maxLength={100} required /></Field>
      <Field label="Sisa durasi *" hint="Masukkan hasil pengecekan WebRefund."><input className="field" name="remaining_duration_value" type="number" min="0" step="1" placeholder="Contoh: 30" required /></Field>
      <Field label="Satuan durasi *"><select className="field" name="remaining_duration_unit" required><option value="">Pilih satuan</option><option value="hari">Hari</option><option value="bulan">Bulan</option></select></Field>
      <Field label="Data akun *" hint="Tuliskan data identifikasi akun yang diperlukan untuk pemeriksaan." wide><textarea className="field min-h-28 resize-y" name="account_email" minLength={3} maxLength={2000} placeholder="Masukkan data akun secara lengkap" required /></Field>
      <Field label="Kendala (jelaskan) *" hint="Jelaskan kronologi dan kendala minimal 10 karakter." wide><textarea className="field min-h-36 resize-y" name="problem_description" minLength={10} maxLength={3000} placeholder="Jelaskan kendala secara lengkap agar admin dapat memeriksa dengan tepat" required /></Field>
      <div className="sm:col-span-2 flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between"><a href="https://webrefund.peony.web.id" target="_blank" rel="noreferrer" className="btn-secondary"><ExternalLink size={16} /> Cek sisa durasi di WebRefund</a><SubmitButton className="btn-primary" pendingText="Mengirim laporan..."><Send size={17} /> Kirim laporan garansi</SubmitButton></div>
    </div>
  </form>;
}

function Field({ label, hint, wide, children }: { label: string; hint?: string; wide?: boolean; children: React.ReactNode }) { return <label className={wide ? "sm:col-span-2" : ""}><span className="label">{label}</span>{children}{hint && <span className="mt-1.5 block text-[11px] leading-4 text-gray-400">{hint}</span>}</label>; }

function getLocalDate() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}
