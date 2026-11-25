"use client";

import { useState } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { FilePicker } from "@/components/forms/file-picker";

export function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage("");
    const form = event.currentTarget; const data = new FormData(form);
    const testimonials = data.getAll("testimonials") as File[];
    if (testimonials.filter((f) => f.size).length < 3) { setMessage("Unggah minimal tiga bukti testimoni."); setLoading(false); return; }
    if (data.get("password") !== data.get("confirm_password")) { setMessage("Konfirmasi password tidak sama."); setLoading(false); return; }
    const priceFile = data.get("pricelist_proof") as File;
    const files = [...testimonials.filter((file) => file.size), priceFile];
    if (files.some((file) => file.size > 5 * 1024 * 1024)) { setMessage("Ukuran maksimal setiap gambar adalah 5 MB."); setLoading(false); return; }

    const response = await fetch("/api/register", { method: "POST", body: data });
    const result = await response.json().catch(() => ({ error: "Pendaftaran gagal diproses." }));
    if (!response.ok) { setMessage(result.error); setLoading(false); return; }

    const supabase = createClient();
    if (!supabase) { window.location.assign("/login?registered=1"); return; }
    const { error } = await supabase.auth.signInWithPassword({ email: String(data.get("email")), password: String(data.get("password")) });
    window.location.assign(error ? "/login?registered=1" : "/dashboard");
  }

  return <form onSubmit={submit} className="space-y-8">
    <fieldset className="grid gap-5 sm:grid-cols-2"><legend className="display mb-5 text-2xl">Data reseller</legend>
      <Field label="Nama BA"><input className="field" name="ba_name" required /></Field>
      <Field label="Awal BA (tahun)"><input className="field" name="ba_start_year" type="number" min="2000" max={new Date().getFullYear()} required /></Field>
      <Field label="Username X/IG jualan" wide><input className="field" name="sales_username" required placeholder="@username atau URL profil" /></Field>
      <Field label="Bukti testimoni (3-6 gambar, tiga bulan terakhir)" wide><FilePicker name="testimonials" multiple required label="Upload bukti testimoni" hint="Pilih 3-6 gambar JPG, PNG, atau WebP. Maksimal 5 MB per file." /></Field>
      <Field label="Screenshot pricelist (tidak underprice)" wide><FilePicker name="pricelist_proof" required label="Upload screenshot pricelist" hint="Pilih 1 gambar JPG, PNG, atau WebP. Maksimal 5 MB." /></Field>
    </fieldset>
    <fieldset className="grid gap-5 sm:grid-cols-2"><legend className="display mb-5 text-2xl">Data akun</legend>
      <Field label="Nama lengkap"><input className="field" name="full_name" required /></Field><Field label="Nomor WhatsApp"><input className="field" name="phone" type="tel" pattern="^(\+62|62|0)8[1-9][0-9]{6,11}$" required /></Field>
      <Field label="Email"><input className="field" name="email" type="email" required /></Field><Field label="Password (minimal 8 karakter)"><input className="field" name="password" type="password" minLength={8} required /></Field>
      <Field label="Konfirmasi password"><input className="field" name="confirm_password" type="password" minLength={8} required /></Field>
    </fieldset>
    {message && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p>}
    <button disabled={loading} className="btn-primary w-full" type="submit">{loading ? <LoaderCircle className="animate-spin" size={18}/> : <CheckCircle2 size={18}/>} {loading ? "Memproses pendaftaran..." : "Daftar sebagai reseller"}</button>
    <p className="text-center text-xs leading-5 text-gray-500">Dengan mendaftar, Anda menyetujui ketentuan penggunaan dan kebijakan privasi Peony.</p>
  </form>;
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) { return <div className={wide ? "sm:col-span-2" : ""}><span className="label">{label}</span>{children}</div>; }
