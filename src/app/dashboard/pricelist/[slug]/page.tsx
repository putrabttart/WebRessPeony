import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, ImageIcon, Tag } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { formatRupiah } from "@/lib/utils";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const { supabase } = await requireUser("reseller");
  const { data: product } = await supabase.from("products").select("name,slug,image_path,product_categories(name),product_plans(id,name,description,reseller_price,sort_order,is_active)").eq("slug", slug).eq("is_active", true).single();
  if (!product) notFound();
  const assetBase = supabase.storage.from("public-assets").getPublicUrl("").data.publicUrl;
  const plans=(product.product_plans??[]).filter((plan:any)=>plan.is_active).sort((a:any,b:any)=>a.sort_order-b.sort_order);
  return <><Link href="/dashboard/pricelist" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition hover:text-pink-700"><ArrowLeft size={16} /> Kembali ke katalog</Link><article className="card mt-6 overflow-hidden"><div className="grid lg:grid-cols-[.85fr_1.15fr]"><div className="min-h-72 bg-gradient-to-br from-pink-50 to-amber-50 lg:min-h-[520px]">{product.image_path ? <img decoding="async" className="size-full object-cover" src={`${assetBase}${product.image_path}`} alt={product.name} /> : <div className="grid size-full min-h-72 place-items-center text-pink-300"><ImageIcon size={72} /></div>}</div><div className="p-7 sm:p-10"><span className="inline-flex w-fit items-center gap-2 rounded-full bg-pink-50 px-3 py-1.5 text-xs font-bold text-pink-700"><Tag size={14} /> {(product.product_categories as any)?.name ?? "Produk Peony"}</span><h1 className="display mt-5 text-4xl leading-tight sm:text-5xl">{product.name}</h1><h2 className="mt-8 font-bold">Pilih plan</h2><div className="mt-3 space-y-3">{plans.length?plans.map((plan:any)=><section className="rounded-2xl border border-pink-100 p-5" key={plan.id}><div className="flex items-start justify-between gap-4"><div><h3 className="display text-xl">{plan.name}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">{plan.description}</p></div><strong className="whitespace-nowrap text-lg text-pink-700">{formatRupiah(Number(plan.reseller_price))}</strong></div></section>):<p className="rounded-xl bg-gray-50 p-5 text-sm text-gray-500">Plan belum tersedia.</p>}</div><div className="mt-8 flex gap-3 rounded-2xl bg-green-50 p-4 text-sm leading-6 text-green-800"><CheckCircle2 className="mt-0.5 shrink-0" size={19} /><p>Harga merupakan harga reseller aktif dan dapat diperbarui oleh admin Peony.</p></div></div></div></article></>;
}
