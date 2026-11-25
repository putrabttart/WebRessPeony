import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, ImageIcon, Tag } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { formatRupiah } from "@/lib/utils";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const { supabase } = await requireUser("reseller");
  const { data: product } = await supabase.from("products").select("name,slug,description,image_path,reseller_price,product_categories(name)").eq("slug", slug).eq("is_active", true).single();
  if (!product) notFound();
  const assetBase = supabase.storage.from("public-assets").getPublicUrl("").data.publicUrl;
  return <><Link href="/dashboard/pricelist" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition hover:text-pink-700"><ArrowLeft size={16} /> Kembali ke katalog</Link><article className="card mt-6 overflow-hidden"><div className="grid lg:grid-cols-[1.05fr_.95fr]"><div className="min-h-72 bg-gradient-to-br from-pink-50 to-amber-50 lg:min-h-[520px]">{product.image_path ? <img className="size-full object-cover" src={`${assetBase}${product.image_path}`} alt={product.name} /> : <div className="grid size-full min-h-72 place-items-center text-pink-300"><ImageIcon size={72} /></div>}</div><div className="flex flex-col p-7 sm:p-10"><span className="inline-flex w-fit items-center gap-2 rounded-full bg-pink-50 px-3 py-1.5 text-xs font-bold text-pink-700"><Tag size={14} /> {(product.product_categories as any)?.name ?? "Produk Peony"}</span><h1 className="display mt-5 text-4xl leading-tight sm:text-5xl">{product.name}</h1><div className="mt-6 rounded-2xl border border-pink-100 bg-gradient-to-r from-pink-50 to-amber-50 p-5"><small className="text-[10px] font-bold uppercase tracking-[.18em] text-gray-500">Harga khusus reseller</small><p className="mt-2 text-3xl font-bold text-pink-700">{formatRupiah(Number(product.reseller_price))}</p></div><div className="mt-7"><h2 className="font-bold">Informasi produk</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-600">{product.description || "Deskripsi produk belum tersedia. Hubungi admin Peony untuk informasi lebih lanjut."}</p></div><div className="mt-auto pt-8"><div className="flex gap-3 rounded-2xl bg-green-50 p-4 text-sm leading-6 text-green-800"><CheckCircle2 className="mt-0.5 shrink-0" size={19} /><p>Harga pada halaman ini merupakan harga reseller aktif dan dapat diperbarui oleh admin Peony.</p></div></div></div></div></article></>;
}
