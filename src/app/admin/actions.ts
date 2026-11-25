"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";

async function log(supabase: any, actor: string, action: string, type: string, id?: string) {
  await supabase.from("admin_activity_logs").insert({ actor_id: actor, action, entity_type: type, entity_id: id });
}

function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function validTarget(value: string | null, allowEmpty = true) {
  if (!value) return allowEmpty;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    return ["https:", "http:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export async function toggleReseller(form: FormData) {
  const id = z.string().uuid().parse(form.get("id"));
  const active = form.get("active") === "true";
  const requestedReturnTo = String(form.get("return_to") ?? "/admin/resellers");
  const returnTo = requestedReturnTo === `/admin/resellers/${id}` ? requestedReturnTo : "/admin/resellers";
  const { supabase, profile } = await requireUser("admin");
  const { error } = await supabase.from("profiles").update({ is_active: !active }).eq("id", id).eq("role", "reseller");
  if (error) redirect(`${returnTo}?error=status`);
  await log(supabase, profile.id, active ? "deactivate" : "activate", "profile", id);
  revalidatePath("/admin/resellers");
  revalidatePath(`/admin/resellers/${id}`);
  redirect(`${returnTo}?saved=status`);
}

export async function saveProduct(form: FormData) {
  const data = z.object({ name: z.string().min(2), slug: z.string().regex(/^[a-z0-9-]+$/), reseller_price: z.coerce.number().nonnegative(), description: z.string().optional() }).parse(Object.fromEntries(form));
  const { supabase, profile } = await requireUser("admin");
  const { data: product, error } = await supabase.from("products").insert(data).select("id").single();
  if (error) redirect("/admin/products?error=save");
  await log(supabase, profile.id, "create", "product", product.id);
  revalidatePath("/admin/products");
  redirect("/admin/products?saved=created");
}

export async function saveCategory(form: FormData) {
  const data = z.object({ name: z.string().min(2), slug: z.string().regex(/^[a-z0-9-]+$/) }).parse(Object.fromEntries(form));
  const { supabase, profile } = await requireUser("admin");
  const { data: category, error } = await supabase.from("product_categories").insert(data).select("id").single();
  if (error || !category) redirect("/admin/categories?error=save");
  if (category) await log(supabase, profile.id, "create", "category", category.id);
  revalidatePath("/admin/categories");
  redirect("/admin/categories?saved=created");
}

export type WarrantyActionState = {
  success: boolean;
  message: string;
  status?: string;
  response?: string;
  savedAt?: string;
  whatsappUrl?: string;
};

export async function updateWarranty(previousState: WarrantyActionState, form: FormData): Promise<WarrantyActionState> {
  const parsed = z.object({
    id: z.string().uuid(),
    status: z.enum(["submitted", "reviewing", "approved", "rejected", "completed"]),
    response: z.string().trim().max(3000).optional(),
    claim_code: z.string().min(1),
    reseller_name: z.string().min(1),
    reseller_phone: z.string().optional(),
  }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { success: false, message: "Data tidak valid. Periksa status dan panjang tanggapan." };

  const data = parsed.data;
  const { supabase, profile } = await requireUser("admin");
  const { data: claim, error: claimError } = await supabase.from("warranty_claims").select("status").eq("id", data.id).single();
  if (claimError || !claim) return { success: false, message: "Laporan tidak ditemukan atau tidak dapat diakses." };
  if (claim.status === data.status && !data.response) return { success: false, message: "Pilih status baru atau tulis tanggapan sebelum menyimpan." };

  const savedAt = new Date().toISOString();
  const { error: updateError } = await supabase.from("warranty_claims").update({ status: data.status }).eq("id", data.id);
  if (updateError) return { success: false, message: "Status gagal diperbarui. Silakan coba kembali." };

  const { error: responseError } = await supabase.from("warranty_responses").insert({
    claim_id: data.id,
    admin_id: profile.id,
    response: data.response || null,
    old_status: claim.status,
    new_status: data.status,
  });
  if (responseError) {
    await supabase.from("warranty_claims").update({ status: claim.status }).eq("id", data.id);
    return { success: false, message: "Tanggapan gagal dicatat. Status dikembalikan agar riwayat tetap konsisten." };
  }

  await log(supabase, profile.id, "update_status", "warranty_claim", data.id);
  revalidatePath("/admin/warranties");
  revalidatePath(`/dashboard/garansi/${data.id}`);
  revalidatePath("/dashboard/riwayat-garansi");

  const labels: Record<string, string> = { submitted: "Diterima", reviewing: "Sedang diperiksa", approved: "Disetujui", rejected: "Ditolak", completed: "Selesai" };
  const phone = (data.reseller_phone ?? "").replace(/\D/g, "").replace(/^0/, "62").replace(/^620/, "62");
  const text = [
    `Halo ${data.reseller_name},`,
    "",
    `Update laporan garansi *${data.claim_code}* dari Peony:`,
    `Status: *${labels[data.status]}*`,
    data.response ? `Tanggapan: ${data.response}` : null,
    "",
    "Silakan cek dashboard reseller untuk melihat riwayat lengkap.",
  ].filter(Boolean).join("\n");

  return {
    success: true,
    message: "Status dan tanggapan berhasil disimpan.",
    status: data.status,
    response: data.response,
    savedAt,
    whatsappUrl: phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : undefined,
  };
}

export async function saveMenu(form: FormData) {
  const targetUrl = optionalText(form.get("target_url"));
  if (!validTarget(targetUrl)) redirect("/admin/menus?error=url");
  const data = z.object({
    id: z.string().uuid().optional().or(z.literal("")), title: z.string().trim().min(2).max(80),
    description: z.string().trim().max(160).optional(), icon: z.enum(["user", "price", "telegram", "warranty", "link"]),
    action_type: z.enum(["internal", "external", "telegram", "custom"]), sort_order: z.coerce.number().int().min(0).max(9999),
  }).parse(Object.fromEntries(form));
  const payload = { title: data.title, description: data.description || null, icon: data.icon, action_type: data.action_type, target_url: targetUrl, sort_order: data.sort_order, is_active: form.get("is_active") === "on" };
  const { supabase, profile } = await requireUser("admin");
  const result = data.id ? await supabase.from("menus").update(payload).eq("id", data.id).select("id").single() : await supabase.from("menus").insert(payload).select("id").single();
  if (result.error) redirect("/admin/menus?error=save");
  await log(supabase, profile.id, data.id ? "update" : "create", "menu", result.data.id);
  revalidatePath("/admin/menus"); revalidatePath("/");
  redirect("/admin/menus?saved=1");
}

export async function deleteMenu(form: FormData) {
  const id = z.string().uuid().parse(form.get("id"));
  const { supabase, profile } = await requireUser("admin");
  await supabase.from("menus").delete().eq("id", id);
  await log(supabase, profile.id, "delete", "menu", id);
  revalidatePath("/admin/menus"); revalidatePath("/");
  redirect("/admin/menus?saved=deleted");
}

export async function saveBanner(form: FormData) {
  const id = String(form.get("id") ?? "");
  const targetUrl = optionalText(form.get("target_url"));
  if (!validTarget(targetUrl)) redirect("/admin/banners?error=url");
  const { supabase, profile } = await requireUser("admin");
  const image = form.get("image");
  let imagePath = optionalText(form.get("existing_image"));
  if (image instanceof File && image.size > 0) {
    if (image.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(image.type)) redirect("/admin/banners?error=image");
    const extension = image.type === "image/jpeg" ? "jpg" : image.type.split("/")[1];
    imagePath = `banners/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from("public-assets").upload(imagePath, image, { contentType: image.type });
    if (error) redirect("/admin/banners?error=upload");
  }
  if (!imagePath) redirect("/admin/banners?error=image");
  const payload = {
    title: optionalText(form.get("title")), description: optionalText(form.get("description")), image_path: imagePath,
    button_label: optionalText(form.get("button_label")), target_url: targetUrl,
    sort_order: z.coerce.number().int().min(0).max(9999).parse(form.get("sort_order")), is_active: form.get("is_active") === "on",
    starts_at: optionalText(form.get("starts_at")), ends_at: optionalText(form.get("ends_at")),
  };
  const result = id ? await supabase.from("banners").update(payload).eq("id", id).select("id").single() : await supabase.from("banners").insert(payload).select("id").single();
  if (result.error) redirect("/admin/banners?error=save");
  if (id && imagePath !== form.get("existing_image") && form.get("existing_image")) await supabase.storage.from("public-assets").remove([String(form.get("existing_image"))]);
  await log(supabase, profile.id, id ? "update" : "create", "banner", result.data.id);
  revalidatePath("/admin/banners"); revalidatePath("/");
  redirect("/admin/banners?saved=1");
}

export async function deleteBanner(form: FormData) {
  const id = z.string().uuid().parse(form.get("id"));
  const { supabase, profile } = await requireUser("admin");
  const { data } = await supabase.from("banners").select("image_path").eq("id", id).single();
  await supabase.from("banners").delete().eq("id", id);
  if (data?.image_path) await supabase.storage.from("public-assets").remove([data.image_path]);
  await log(supabase, profile.id, "delete", "banner", id);
  revalidatePath("/admin/banners"); revalidatePath("/");
  redirect("/admin/banners?saved=deleted");
}

export async function saveSiteSettings(form: FormData) {
  const settings = {
    site_name: String(form.get("site_name") || "Peony").trim(), tagline: String(form.get("tagline") || "").trim(),
    hero_title: String(form.get("hero_title") || "").trim(), hero_emphasis: String(form.get("hero_emphasis") || "").trim(),
    hero_description: String(form.get("hero_description") || "").trim(), footer_text: String(form.get("footer_text") || "").trim(),
    contact_whatsapp: String(form.get("contact_whatsapp") || "").trim(), seo_title: String(form.get("seo_title") || "").trim(),
    seo_description: String(form.get("seo_description") || "").trim(),
  };
  const { supabase, profile } = await requireUser("admin");
  const rows = Object.entries(settings).map(([key, value]) => ({ key, value }));
  const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
  if (error) redirect("/admin/settings?error=save");
  await log(supabase, profile.id, "update", "site_settings");
  revalidatePath("/admin/settings"); revalidatePath("/");
  redirect("/admin/settings?saved=1");
}

export async function saveTelegram(form: FormData) {
  const channelUrl = String(form.get("channel_url") ?? "").trim();
  if (!/^https:\/\/(t\.me|telegram\.me)\//i.test(channelUrl)) redirect("/admin/telegram?error=url");
  const { supabase, profile } = await requireUser("admin");
  const id = String(form.get("id") ?? "");
  const payload = { channel_name: String(form.get("channel_name") ?? "").trim(), description: optionalText(form.get("description")), channel_url: channelUrl, is_active: form.get("is_active") === "on", updated_at: new Date().toISOString() };
  const result = id ? await supabase.from("telegram_settings").update(payload).eq("id", id).select("id").single() : await supabase.from("telegram_settings").insert(payload).select("id").single();
  if (result.error) redirect("/admin/telegram?error=save");
  await log(supabase, profile.id, id ? "update" : "create", "telegram_settings", result.data.id);
  revalidatePath("/admin/telegram"); revalidatePath("/channel"); revalidatePath("/");
  redirect("/admin/telegram?saved=1");
}
