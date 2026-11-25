import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeTarget } from "@/lib/utils";

export default async function ChannelPage() { const supabase = await createClient(); const { data } = supabase ? await supabase.from("telegram_settings").select("channel_url,is_active").eq("is_active",true).maybeSingle() : { data: null }; if (data?.channel_url) redirect(safeTarget(data.channel_url, "/")); redirect("/?channel=unavailable"); }
