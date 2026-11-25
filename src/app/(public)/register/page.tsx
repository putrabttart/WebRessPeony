import Link from "next/link";
import { RegisterForm } from "@/components/forms/register-form";
import { AuthShell } from "@/components/public/auth-shell";

export default function RegisterPage() { return <AuthShell eyebrow="Mulai bersama Peony" title="Pendaftaran reseller"><RegisterForm/><p className="mt-6 text-center text-sm text-gray-500">Sudah punya akun? <Link className="font-bold text-pink-600" href="/login">Masuk di sini</Link></p></AuthShell>; }
