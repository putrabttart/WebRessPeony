import Link from "next/link";
import { PackageOpen } from "lucide-react";
import { SearchField } from "@/components/ui/search-field";
import { requireUser } from "@/lib/auth";
import { formatRupiah } from "@/lib/utils";

export default async function PricelistPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireUser("reseller");
  let query = supabase.from("products").select("id,name,slug,description,reseller_price,product_categories(name,slug)").eq("is_active", true).order("sort_order");
  if (params.q) query = query.ilike("name", `%${params.q}%`);
  const [{ data: products }, { data: categories }] = await Promise.all([query, supabase.from("product_categories").select("name,slug").eq("is_active", true).order("sort_order")]);
  const shown = params.category ? products?.filter((product: any) => product.product_categories?.slug === params.category) : products;
  return <><p className="text-sm font-bold uppercase tracking-[.24em] text-pink-500">Pricelist</p><h1 className="display mt-2 text-4xl">Katalog reseller</h1><form className="mt-7 flex gap-2"><SearchField defaultValue={params.q} placeholder="Cari produk..." label="Cari produk" /><button className="btn-primary">Cari</button></form><div className="mt-4 flex gap-2 overflow-auto pb-2"><Link className="btn-secondary whitespace-nowrap" href="/dashboard/pricelist">Semua</Link>{categories?.map((category) => <Link key={category.slug} className="btn-secondary whitespace-nowrap" href={`/dashboard/pricelist?category=${category.slug}`}>{category.name}</Link>)}</div>{shown?.length ? <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{shown.map((product: any) => <Link href={`/dashboard/pricelist/${product.slug}`} key={product.id} className="card overflow-hidden"><div className="grid h-36 place-items-center bg-gradient-to-br from-pink-50 to-amber-50 text-pink-300"><PackageOpen size={42} /></div><div className="p-5"><small className="font-bold uppercase tracking-wider text-pink-500">{product.product_categories?.name ?? "Tanpa kategori"}</small><h2 className="display mt-1 text-xl">{product.name}</h2><p className="mt-4 font-bold text-pink-700">{formatRupiah(Number(product.reseller_price))}</p></div></Link>)}</div> : <p className="mt-8 rounded-2xl bg-white p-10 text-center text-gray-500">Produk belum tersedia.</p>}</>;
}
