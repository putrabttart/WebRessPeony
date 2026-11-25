import { FormAlert } from "@/components/ui/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth";
import { formatRupiah } from "@/lib/utils";
import { saveProduct } from "../actions";

export default async function Products({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireUser("admin");
  const { data } = await supabase.from("products").select("id,name,slug,reseller_price,is_active").order("sort_order");
  return <>
    <h1 className="display text-4xl">Produk & pricelist</h1><p className="mt-2 text-sm text-gray-500">Isi nama, slug URL, dan harga reseller. Semua field wajib diisi.</p>
    {params.saved && <div className="mt-5"><FormAlert type="success">Produk berhasil ditambahkan ke pricelist.</FormAlert></div>}
    {params.error && <div className="mt-5"><FormAlert type="error">Produk gagal disimpan. Pastikan slug belum digunakan dan hanya berisi huruf kecil, angka, atau tanda hubung.</FormAlert></div>}
    <form action={saveProduct} className="card mt-6 grid gap-3 p-5 sm:grid-cols-4"><label><span className="label">Nama produk *</span><input className="field" name="name" placeholder="Nama produk" required /></label><label><span className="label">Slug URL *</span><input className="field" name="slug" pattern="[a-z0-9-]+" placeholder="nama-produk" required /></label><label><span className="label">Harga reseller *</span><input className="field" name="reseller_price" type="number" min="0" placeholder="0" required /></label><input type="hidden" name="description" value="" /><div className="pt-6"><SubmitButton className="btn-primary w-full" pendingText="Menambahkan...">Tambah produk</SubmitButton></div></form>
    <div className="card mt-5 divide-y">{data?.length ? data.map((product) => <div key={product.id} className="flex items-center p-5"><span className="flex-1"><strong className="block">{product.name}</strong><small className="text-gray-500">/{product.slug}</small></span><span className="font-bold text-pink-700">{formatRupiah(Number(product.reseller_price))}</span></div>) : <p className="p-8 text-center text-gray-500">Belum ada produk.</p>}</div>
  </>;
}
