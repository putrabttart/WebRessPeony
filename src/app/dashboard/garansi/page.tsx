import { ShieldCheck } from "lucide-react";
import { WarrantyForm } from "@/components/forms/warranty-form";
import { FormAlert } from "@/components/ui/form-alert";
import { requireUser } from "@/lib/auth";

export default async function WarrantyPage() {
  const { profile } = await requireUser("reseller");
  return <>
    <p className="text-sm font-bold uppercase tracking-[.24em] text-pink-500">Garansi</p>
    <h1 className="display mt-2 text-4xl">Buat laporan garansi</h1>
    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">Isi data sesuai transaksi dan hasil pengecekan akun. Data yang lengkap membantu admin memproses laporan lebih cepat.</p>
    <div className="mt-5"><FormAlert type="info"><p className="font-bold">Sebelum mengirim laporan</p><p>Pastikan sisa durasi sudah diperiksa melalui <a className="font-bold underline" href="https://webrefund.peony.web.id" target="_blank" rel="noreferrer">webrefund.peony.web.id</a>. Pastikan data lengkap agar proses garansi lebih cepat!</p></FormAlert></div>
    <WarrantyForm resellerName={profile.full_name} />
    <div className="mt-5 flex gap-3 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm text-green-800"><ShieldCheck className="shrink-0" /><p>Setelah dikirim, laporan dapat dipantau melalui menu Riwayat Garansi. Tanggapan admin akan muncul pada detail laporan.</p></div>
  </>;
}
