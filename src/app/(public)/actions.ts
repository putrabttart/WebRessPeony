"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8) });

export async function login(formData: FormData) {
  const input = loginSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) redirect("/login?error=invalid");
  const supabase = await createClient();
  if (!supabase) redirect("/login?error=config");
  const { error } = await supabase.auth.signInWithPassword(input.data);
  if (error) redirect("/login?error=credentials");
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role,is_active").eq("id", user!.id).single();
  if (!profile?.is_active) { await supabase.auth.signOut(); redirect("/login?error=inactive"); }
  redirect(profile.role === "admin" ? "/admin" : "/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase?.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(formData: FormData) {
  const email = z.string().email().safeParse(formData.get("email"));
  const supabase = await createClient();
  if (email.success && supabase) await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password` });
  redirect("/forgot-password?sent=1");
}
