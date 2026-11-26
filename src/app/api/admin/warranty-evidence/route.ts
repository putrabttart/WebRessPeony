import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const claimId = z.string().uuid().safeParse(request.nextUrl.searchParams.get("claimId"));
  if (!claimId.success) return NextResponse.json({ error: "Laporan tidak valid." }, { status: 400 });
  const { supabase } = await requireUser("admin");
  const { data: attachments, error } = await supabase.from("warranty_attachments").select("id,file_path").eq("claim_id", claimId.data);
  if (error) return NextResponse.json({ error: "Bukti tidak dapat dimuat." }, { status: 400 });
  const paths = (attachments ?? []).map((attachment) => attachment.file_path);
  if (!paths.length) return NextResponse.json({ urls: {} });
  const { data, error: signError } = await supabase.storage.from("warranty-evidence").createSignedUrls(paths, 60 * 15);
  if (signError) return NextResponse.json({ error: "Bukti tidak dapat dibuka." }, { status: 400 });
  const urls = Object.fromEntries((attachments ?? []).map((attachment, index) => [attachment.id, data?.[index]?.signedUrl ?? null]));
  return NextResponse.json({ urls });
}
