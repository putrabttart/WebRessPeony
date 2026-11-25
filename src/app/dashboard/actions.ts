"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";

export type WarrantyFormState = { success: boolean; message: string; claimCode?: string };

const warranty = z.object({
  order_date: z.string().date(),
  application: z.string().trim().min(1, "Aplikasi wajib diisi.").max(100),
  account_duration_value: z.coerce.number().int().positive("Durasi akun wajib lebih dari 0."),
  account_duration_unit: z.enum(["hari", "bulan"]),
  expires_at: z.string().date(),
  account_email: z.string().trim().min(3, "Data akun wajib diisi.").max(2000),
  problem_description: z.string().trim().min(10, "Kendala minimal 10 karakter.").max(3000),
});

export async function createWarranty(_previousState: WarrantyFormState, formData: FormData): Promise<WarrantyFormState> {
  const input = warranty.safeParse(Object.fromEntries(formData));
  if (!input.success) return { success: false, message: input.error.issues[0]?.message ?? "Lengkapi seluruh field wajib." };
  if (new Date(input.data.expires_at) < new Date(input.data.order_date)) return { success: false, message: "Tanggal expired tidak boleh lebih awal dari tanggal order." };
  const evidence = formData.get("evidence");
  if (!(evidence instanceof File) || evidence.size === 0) return { success: false, message: "Screenshot bukti kendala wajib diunggah." };
  if (evidence.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(evidence.type)) return { success: false, message: "Screenshot harus JPG, PNG, atau WebP dengan ukuran maksimal 5 MB." };
  const { supabase, profile } = await requireUser("reseller");
  const code = `PNY-${Date.now().toString(36).toUpperCase()}`;
  const reportDate = new Date();
  const expiryDate = new Date(`${input.data.expires_at}T00:00:00`);
  const reportLocal = new Date(reportDate.getFullYear(), reportDate.getMonth(), reportDate.getDate());
  const remainingDays = Math.max(0, Math.ceil((expiryDate.getTime() - reportLocal.getTime()) / 86_400_000));
  const { data: claim, error } = await supabase.from("warranty_claims").insert({ ...input.data, remaining_duration_value: remainingDays, remaining_duration_unit: "hari", profile_reference: null, reseller_id: profile.id, claim_code: code, remaining_duration_source: "internal_calculation" }).select("id").single();
  if (error || !claim) return { success: false, message: "Laporan belum tersimpan. Periksa data lalu coba kembali." };
  const extension = evidence.type === "image/jpeg" ? "jpg" : evidence.type.split("/")[1];
  const path = `${profile.id}/${code}/evidence.${extension}`;
  const upload = await supabase.storage.from("warranty-evidence").upload(path, evidence, { contentType: evidence.type, upsert: false });
  if (upload.error) { await supabase.from("warranty_claims").delete().eq("id", claim.id); return { success: false, message: "Screenshot gagal diunggah. Periksa ukuran file lalu coba kembali." }; }
  const attachment = await supabase.from("warranty_attachments").insert({ claim_id: claim.id, file_path: path, file_name: evidence.name, mime_type: evidence.type });
  if (attachment.error) { await supabase.storage.from("warranty-evidence").remove([path]); await supabase.from("warranty_claims").delete().eq("id", claim.id); return { success: false, message: "Bukti gagal dicatat. Laporan belum dikirim, silakan coba kembali." }; }
  return { success: true, message: "Laporan garansi berhasil dikirim dan sudah masuk ke antrean admin.", claimCode: code };
}

export async function updateProfile(formData: FormData) {
  const fullName = z.string().min(2).max(100).safeParse(formData.get("full_name"));
  const phone = z.string().regex(/^(\+62|62|0)8[1-9][0-9]{6,11}$/).safeParse(formData.get("phone"));
  if (!fullName.success || !phone.success) redirect("/dashboard/profil?error=invalid");
  const { supabase, profile } = await requireUser("reseller");
  const { error } = await supabase.from("profiles").update({ full_name: fullName.data, phone: phone.data }).eq("id", profile.id);
  redirect(error ? "/dashboard/profil?error=save" : "/dashboard/profil?saved=1");
}
