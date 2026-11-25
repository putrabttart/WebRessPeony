"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";

export type WarrantyFormState = { success: boolean; message: string; claimCode?: string };

const warranty = z.object({
  order_date: z.string().date(),
  application: z.string().trim().min(1, "Aplikasi wajib diisi.").max(100),
  remaining_duration_value: z.coerce.number().nonnegative(),
  remaining_duration_unit: z.enum(["hari", "bulan"]),
  account_email: z.string().trim().min(3, "Data akun wajib diisi.").max(2000),
  problem_description: z.string().trim().min(10, "Kendala minimal 10 karakter.").max(3000),
});

export async function createWarranty(_previousState: WarrantyFormState, formData: FormData): Promise<WarrantyFormState> {
  const input = warranty.safeParse(Object.fromEntries(formData));
  if (!input.success) return { success: false, message: input.error.issues[0]?.message ?? "Lengkapi seluruh field wajib." };
  const { supabase, profile } = await requireUser("reseller");
  const code = `PNY-${Date.now().toString(36).toUpperCase()}`;
  const { error } = await supabase.from("warranty_claims").insert({ ...input.data, profile_reference: null, reseller_id: profile.id, claim_code: code, remaining_duration_source: "manual" });
  if (error) return { success: false, message: "Laporan belum tersimpan. Periksa data lalu coba kembali." };
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
