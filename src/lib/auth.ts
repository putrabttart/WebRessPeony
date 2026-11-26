import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const requireUser = cache(async function requireUser(expectedRole?: "admin" | "reseller") {
  const supabase = await createClient();
  if (!supabase) redirect("/login?error=config");

  const { data, error: claimsError } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (claimsError || !userId) redirect(expectedRole === "admin" ? "/admin/login" : "/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, is_active")
    .eq("id", userId)
    .single();

  if (!profile?.is_active) redirect("/login?error=inactive");
  if (expectedRole && profile.role !== expectedRole) {
    redirect(profile.role === "admin" ? "/admin" : "/dashboard");
  }
  return { supabase, profile };
});
