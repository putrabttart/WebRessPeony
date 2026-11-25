import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_TESTIMONIALS = 6;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const schema = z.object({
  ba_name: z.string().trim().min(2).max(100),
  ba_start_year: z.coerce.number().int().min(2000).max(new Date().getFullYear()),
  sales_username: z.string().trim().min(2).max(500),
  full_name: z.string().trim().min(2).max(100),
  email: z.email().max(254),
  phone: z.string().regex(/^(\+62|62|0)8[1-9][0-9]{6,11}$/),
  password: z.string().min(8).max(128),
});

function isValidImage(bytes: Uint8Array, type: string) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.slice(0, 8).every((byte, index) => byte === [137, 80, 78, 71, 13, 10, 26, 10][index]);
  if (type === "image/webp") return new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  return false;
}

async function readImage(file: File) {
  if (!allowedTypes.has(file.type) || file.size === 0 || file.size > MAX_FILE_SIZE) {
    throw new Error("INVALID_FILE");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isValidImage(bytes, file.type)) throw new Error("INVALID_FILE");
  return bytes;
}

function extensionFor(type: string) {
  return type === "image/jpeg" ? "jpg" : type === "image/png" ? "png" : "webp";
}

export async function POST(request: NextRequest) {
  const admin = createAdminClient();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!admin || !url || !anonKey) {
    return NextResponse.json({ error: "Layanan pendaftaran belum dikonfigurasi." }, { status: 503 });
  }

  let createdUser = false;
  let userId: string | undefined;
  const uploadedPaths: string[] = [];

  try {
    const formData = await request.formData();
    const input = schema.safeParse(Object.fromEntries(formData));
    const testimonials = formData.getAll("testimonials").filter((value): value is File => value instanceof File && value.size > 0);
    const pricelist = formData.get("pricelist_proof");

    if (!input.success || testimonials.length < 3 || testimonials.length > MAX_TESTIMONIALS || !(pricelist instanceof File)) {
      return NextResponse.json({ error: "Periksa kembali data dan bukti pendaftaran." }, { status: 400 });
    }

    const testimonialBytes = await Promise.all(testimonials.map(readImage));
    const pricelistBytes = await readImage(pricelist);

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

    const folder = `${userId}/${crypto.randomUUID()}`;
    for (let index = 0; index < testimonials.length; index++) {
      const path = `${folder}/testimonial-${index}.${extensionFor(testimonials[index].type)}`;
      const { error } = await admin.storage.from("reseller-evidence").upload(path, testimonialBytes[index], { contentType: testimonials[index].type });
      if (error) throw new Error("UPLOAD_FAILED");
      uploadedPaths.push(path);
    }

    const pricelistPath = `${folder}/pricelist.${extensionFor(pricelist.type)}`;
    const { error: pricelistError } = await admin.storage.from("reseller-evidence").upload(pricelistPath, pricelistBytes, { contentType: pricelist.type });
    if (pricelistError) throw new Error("UPLOAD_FAILED");
    uploadedPaths.push(pricelistPath);

    const { error: profileError } = await admin.from("profiles").update({ full_name: input.data.full_name, phone: input.data.phone }).eq("id", userId);
    if (profileError) throw new Error("PROFILE_FAILED");

    const { data: detail, error: detailError } = await admin.from("reseller_details").insert({ user_id: userId, ba_name: input.data.ba_name, ba_start_year: input.data.ba_start_year, sales_username: input.data.sales_username }).select("id").single();
    if (detailError || !detail) throw new Error("PROFILE_FAILED");

    const { error: testimonialsError } = await admin.from("reseller_testimonials").insert(uploadedPaths.slice(0, -1).map((file_path) => ({ reseller_id: detail.id, file_path })));
    const { error: pricelistRecordError } = await admin.from("reseller_pricelists").insert({ reseller_id: detail.id, file_path: pricelistPath });
    if (testimonialsError || pricelistRecordError) throw new Error("PROFILE_FAILED");

    return NextResponse.json({ success: true });
  } catch (error) {
    if (uploadedPaths.length) await admin.storage.from("reseller-evidence").remove(uploadedPaths);
    if (userId) await admin.from("reseller_details").delete().eq("user_id", userId);
    if (createdUser && userId) await admin.auth.admin.deleteUser(userId);

    const message = error instanceof Error && error.message === "INVALID_FILE"
      ? "Gunakan gambar JPG, PNG, atau WebP dengan ukuran maksimal 5 MB per file."
      : "Pendaftaran belum dapat diselesaikan. Silakan coba kembali.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
