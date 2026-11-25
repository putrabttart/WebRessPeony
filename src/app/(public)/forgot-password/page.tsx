import { AuthShell } from "@/components/public/auth-shell";
import { FormAlert } from "@/components/ui/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { requestPasswordReset } from "../actions";

export default async function ForgotPage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) { const p = await searchParams; return <AuthShell eyebrow="Pemulihan akun" title="Lupa password">{p.sent ? <FormAlert type="success">Jika email terdaftar, tautan pemulihan telah dikirim. Periksa inbox dan folder spam.</FormAlert> : <form action={requestPasswordReset} className="space-y-5"><FormAlert type="info">Masukkan email akun reseller. Demi keamanan, sistem menampilkan hasil yang sama untuk email terdaftar maupun tidak.</FormAlert><label><span className="label">Email akun *</span><input className="field" name="email" type="email" autoComplete="email" placeholder="nama@email.com" required/></label><SubmitButton className="btn-primary w-full" pendingText="Mengirim tautan...">Kirim tautan pemulihan</SubmitButton></form>}</AuthShell>; }
