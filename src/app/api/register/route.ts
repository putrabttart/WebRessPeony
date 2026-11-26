import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const schema = z.object({
  ba_name: z.string().trim().min(2).max(100),
  ba_start_year: z.coerce.number().int().min(2000).max(new Date().getFullYear()),
  sales_username: z.string().trim().min(2).max(500),
  full_name: z.string().trim().min(2).max(100),
  email: z.email().max(254),
  phone: z.string().regex(/^(\+62|62|0)8[1-9][0-9]{6,11}$/),
  password: z.string().min(8).max(128), pricelist_link: z.url().refine((url) => ["http:", "https:"].includes(new URL(url).protocol)),
});

export async function POST(request: NextRequest) {
  const admin = createAdminClient();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!admin || !url || !anonKey) {
    return NextResponse.json({ error: "Layanan pendaftaran belum dikonfigurasi." }, { status: 503 });
  }

  let createdUser = false;
  let userId: string | undefined;

  try {
    const formData = await request.formData();
    const input = schema.safeParse(Object.fromEntries(formData));
    const testimonials = formData.getAll("testimonial_links").map(String).filter(Boolean);

    if (!input.success || testimonials.length !== 1 || testimonials.some((url) => !isSafeHttpUrl(url))) {
      return NextResponse.json({ error: "Periksa kembali data dan bukti pendaftaran." }, { status: 400 });
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: input.data.email,
      password: input.data.password,
      email_confirm: true,
      user_metadata: { full_name: input.data.full_name },
    });

    if (createError || !created.user) {
      // Recover a registration that previously created Auth but failed during upload.
      const recovery = createSupabaseClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
      const { data: signedIn } = await recovery.auth.signInWithPassword({ email: input.data.email, password: input.data.password });
      if (!signedIn.user) {
        return NextResponse.json({ error: "Email sudah digunakan atau pendaftaran tidak dapat diproses." }, { status: 409 });
      }
      userId = signedIn.user.id;
      const { data: existing } = await admin.from("reseller_details").select("id").eq("user_id", userId).maybeSingle();
      if (existing) return NextResponse.json({ error: "Akun ini sudah terdaftar. Silakan masuk." }, { status: 409 });
    } else {
      userId = created.user.id;
      createdUser = true;
    }

    const { error: profileError } = await admin.from("profiles").update({ full_name: input.data.full_name, phone: input.data.phone }).eq("id", userId);
    if (profileError) throw new Error("PROFILE_FAILED");

    const { data: detail, error: detailError } = await admin.from("reseller_details").insert({ user_id: userId, ba_name: input.data.ba_name, ba_start_year: input.data.ba_start_year, sales_username: input.data.sales_username }).select("id").single();
    if (detailError || !detail) throw new Error("PROFILE_FAILED");

    const { error: testimonialsError } = await admin.from("reseller_testimonials").insert(testimonials.map((external_url) => ({ reseller_id: detail.id, external_url })));
    const { error: pricelistRecordError } = await admin.from("reseller_pricelists").insert({ reseller_id: detail.id, external_url: input.data.pricelist_link });
    if (testimonialsError || pricelistRecordError) throw new Error("PROFILE_FAILED");

    return NextResponse.json({ success: true });
  } catch (error) {
    if (userId) await admin.from("reseller_details").delete().eq("user_id", userId);
    if (createdUser && userId) await admin.auth.admin.deleteUser(userId);

    const message = "Pendaftaran belum dapat diselesaikan. Silakan periksa link dan coba kembali.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function isSafeHttpUrl(value: string) { try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; } }
