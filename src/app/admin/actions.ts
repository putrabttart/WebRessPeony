"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

async function log(supabase: any, actor: string, action: string, type: string, id?: string, metadata?: Record<string, string | number | boolean | null>) {
  await supabase.from("admin_activity_logs").insert({ actor_id: actor, action, entity_type: type, entity_id: id, metadata: metadata ?? null });
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

export type ResellerStatusState = { success: boolean; message: string; active?: boolean };

export async function toggleReseller(_previousState: ResellerStatusState, form: FormData): Promise<ResellerStatusState> {
  const id = z.string().uuid().safeParse(form.get("id"));
  const active = form.get("active") === "true";
  if (!id.success) return { success: false, message: "Data reseller tidak valid." };
  const { supabase, profile } = await requireUser("admin");
  const { error } = await supabase.from("profiles").update({ is_active: !active }).eq("id", id.data).eq("role", "reseller");
  if (error) return { success: false, message: "Status gagal diperbarui. Coba kembali.", active };
  await log(supabase, profile.id, active ? "deactivate" : "activate", "profile", id.data);
  revalidatePath("/admin/resellers");
  revalidatePath(`/admin/resellers/${id.data}`);
  return { success: true, message: !active ? "Reseller diaktifkan" : "Reseller dinonaktifkan", active: !active };
}

export async function saveProduct(form: FormData) {
  const data = z.object({ id: z.string().uuid().optional().or(z.literal("")), name: z.string().trim().min(2).max(120), slug: z.string().regex(/^[a-z0-9-]+$/), reseller_price: z.coerce.number().nonnegative(), description: z.string().trim().max(3000).optional(), category_id: z.string().uuid().optional().or(z.literal("")), sort_order: z.coerce.number().int().min(0).max(9999), image_url: z.string().trim().optional() }).safeParse(Object.fromEntries(form));
  if (!data.success) redirect("/admin/products?error=invalid");
  const imagePath = data.data.image_url || null;
  if (imagePath && !validTarget(imagePath, false)) redirect("/admin/products?error=image-url");
  const supabase = await createClient();
  if (!supabase) redirect("/admin/products?error=save");
  const { data: productId, error } = await supabase.rpc("save_product_with_log", {
    p_id: data.data.id || null,
    p_name: data.data.name,
    p_slug: data.data.slug,
    p_category_id: data.data.category_id || null,
    p_image_path: imagePath,
    p_sort_order: data.data.sort_order,
    p_is_active: form.get("is_active") === "on",
  });
  if (error || !productId) redirect(error?.code === "PGRST202" || error?.message.includes("save_product_with_log") ? "/admin/products?error=product-rpc" : "/admin/products?error=save");
  redirect(`/admin/products?saved=${data.data.id ? "updated" : "created"}`);
}

export async function deleteProduct(form: FormData) {
  const id = z.string().uuid().parse(form.get("id"));
  const { supabase, profile } = await requireUser("admin");
  const { data } = await supabase.from("products").select("image_path").eq("id", id).single();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) redirect("/admin/products?error=delete");
  if (data?.image_path && !/^https?:\/\//i.test(data.image_path)) await supabase.storage.from("public-assets").remove([data.image_path]);
  await log(supabase, profile.id, "delete", "product", id);
  revalidatePath("/admin/products"); revalidatePath("/dashboard/pricelist");
  redirect("/admin/products?saved=deleted");
}

export async function saveProductPlans(form: FormData) {
  const productId = z.string().uuid().safeParse(form.get("product_id"));
  let rawPlans: unknown;
  try { rawPlans = JSON.parse(String(form.get("plans") ?? "[]")); } catch { redirect("/admin/products?error=plan-invalid"); }
  const plans = z.array(z.object({ id: z.string().uuid().nullable(), name: z.string().trim().min(2).max(100), description: z.string().trim().min(2).max(3000), reseller_price: z.coerce.number().nonnegative(), sort_order: z.coerce.number().int().min(0).max(9999), is_active: z.boolean() })).max(50).safeParse(rawPlans);
  if (!productId.success || !plans.success) redirect("/admin/products?error=plan-invalid");
  const supabase = await createClient();
  if (!supabase) redirect("/admin/products?error=plan-save");
  const { error } = await supabase.rpc("sync_product_plans", { p_product_id: productId.data, p_plans: plans.data });
  if (error) redirect(error.code === "PGRST202" || error.message.includes("sync_product_plans") ? "/admin/products?error=plan-schema" : "/admin/products?error=plan-save");
  redirect("/admin/products?saved=plans-saved");
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
  handledBy?: string;
};

export async function updateWarranty(previousState: WarrantyActionState, form: FormData): Promise<WarrantyActionState> {
  const parsed = z.object({
    id: z.string().uuid(),
    status: z.enum(["reviewing", "processing", "completed", "rejected"]),
    handled_by_name: z.enum(["Rain", "Cr eld", "Kica", "Ale", "Cheetahily"]),
    response: z.string().trim().max(3000).optional(),
    claim_code: z.string().min(1),
    reseller_name: z.string().min(1),
    reseller_phone: z.string().optional(),
  }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { success: false, message: "Data tidak valid. Periksa status dan panjang tanggapan." };

  const data = parsed.data;
  const supabase = await createClient();
  if (!supabase) return { success: false, message: "Layanan database belum dikonfigurasi." };
  const { data: result, error } = await supabase.rpc("process_warranty_claim", {
    p_claim_id: data.id,
    p_status: data.status,
    p_response: data.response || "",
    p_handled_by_name: data.handled_by_name,
    p_claim_code: data.claim_code,
    p_reseller_name: data.reseller_name,
  });
  if (error) {
    const message = error.message.includes("No warranty changes")
      ? "Pilih status baru atau tulis tanggapan sebelum menyimpan."
      : error.message.includes("function public.process_warranty_claim")
        ? "Optimasi database belum dipasang. Jalankan migration 202611250006."
        : "Status dan tanggapan gagal disimpan. Silakan coba kembali.";
    return { success: false, message };
  }
  const savedAt = String((result as { saved_at?: string } | null)?.saved_at ?? new Date().toISOString());

  const labels: Record<string, string> = { reviewing: "Diperiksa", processing: "On Proses", rejected: "Ditolak", completed: "Selesai" };
  const phone = (data.reseller_phone ?? "").replace(/\D/g, "").replace(/^0/, "62").replace(/^620/, "62");
  const genericText = [`Admin: ${data.handled_by_name}`, `Halo ${data.reseller_name},`, `Update garansi ${data.claim_code}`, `Status: ${labels[data.status]}`, data.response || null].filter(Boolean).join("\n\n");
  const processingText = [`Admin: ${data.handled_by_name}`, "", "𖦹 ݁₊  💒 ) ☁️ ——— 𝐠𝐚𝐫𝐚𝐧𝐬𝐢 𝐨𝐧 𝐩𝐫𝐨𝐜𝐞𝐬𝐬  ⊹", "", `✴︎ ⁺ haloo kak  ꔫ  garansi kamu lagi di proses oleh admin ${data.handled_by_name}`, "", "✎ 𓈒 ⏱️ est ⫶ 1x24 jam max 3x24 jam"].join("\n");
  const completedText = [`Admin: ${data.handled_by_name}`, "", "✴︎ ⁺ haloo kak ꔫ berikut data akun baru kamu yang sudah di replace yaa ✿ ݁˖ coba login dulu 𝜗ৎ ♡ . .", "", data.response || "", "", "ʚ ˚ 🌸 ⊹ ꒰⠀❤️︎ .. 𝐧𝐨𝐭𝐞𝐬⠀꒱ kabari jika ada kendala login yaa kak 𓈈 ♡ 𝑷𝒆𝒐𝒏𝒚𝒓𝒔 ✿✿ ˚⸝⸝ 𓏲 👛 ꕤ"].join("\n");
  const text = data.status === "processing" ? processingText : data.status === "completed" ? completedText : genericText;

  return {
    success: true,
    message: "Status dan tanggapan berhasil disimpan.",
    status: data.status,
    response: data.response,
    savedAt,
    handledBy: data.handled_by_name,
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
