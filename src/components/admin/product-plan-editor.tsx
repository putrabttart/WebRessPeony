"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { saveProductPlans } from "@/app/admin/actions";
import { SubmitButton } from "@/components/ui/submit-button";

type Plan = { id: string | null; key: string; name: string; description: string; reseller_price: string; sort_order: number; is_active: boolean };
type StoredPlan = { id: string; name: string; description: string | null; reseller_price: number | string; sort_order: number; is_active: boolean };

export function ProductPlanEditor({ productId, initialPlans }: { productId: string; initialPlans: StoredPlan[] }) {
  const [plans, setPlans] = useState<Plan[]>(initialPlans.sort((a, b) => a.sort_order - b.sort_order).map((plan) => ({ ...plan, key: plan.id, description: plan.description ?? "", reseller_price: String(plan.reseller_price) })));
  function addPlan() { setPlans((current) => [...current, { id: null, key: crypto.randomUUID(), name: "", description: "", reseller_price: "", sort_order: current.length, is_active: true }]); }
  function update(key: string, field: keyof Plan, value: string | number | boolean) { setPlans((current) => current.map((plan) => plan.key === key ? { ...plan, [field]: value } : plan)); }
  function remove(key: string) { setPlans((current) => current.filter((plan) => plan.key !== key)); }
  const payload = plans.map(({ id, name, description, reseller_price, sort_order, is_active }) => ({ id, name, description, reseller_price: Number(reseller_price), sort_order, is_active }));

  return <form action={saveProductPlans} className="mt-4"><input type="hidden" name="product_id" value={productId} /><input type="hidden" name="plans" value={JSON.stringify(payload)} />
    <div className="grid gap-3">{plans.map((plan, index) => <div className="rounded-2xl border bg-white p-4" key={plan.key}><div className="grid gap-3 md:grid-cols-6"><label className="md:col-span-2"><span className="label">Nama plan *</span><input className="field" value={plan.name} onChange={(event) => update(plan.key, "name", event.target.value)} placeholder="Contoh: 1 Bulan" required /></label><label><span className="label">Harga *</span><input className="field" type="number" min="0" value={plan.reseller_price} onChange={(event) => update(plan.key, "reseller_price", event.target.value)} required /></label><label><span className="label">Urutan</span><input className="field" type="number" min="0" value={plan.sort_order} onChange={(event) => update(plan.key, "sort_order", Number(event.target.value))} required /></label><label className="flex items-center gap-2 pt-7 text-sm font-bold"><input type="checkbox" checked={plan.is_active} onChange={(event) => update(plan.key, "is_active", event.target.checked)} /> Aktif</label><button type="button" onClick={() => remove(plan.key)} className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-50 px-3 text-sm font-bold text-red-600"><Trash2 size={16} /> Hapus</button><label className="md:col-span-6"><span className="label">Deskripsi plan *</span><textarea className="field min-h-20" value={plan.description} onChange={(event) => update(plan.key, "description", event.target.value)} placeholder="Jelaskan benefit dan ketentuan plan" required /></label></div><p className="mt-2 text-[10px] text-gray-400">Plan {index + 1}</p></div>)}</div>
    {!plans.length && <p className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-400">Belum ada plan. Klik tombol di bawah untuk menambahkan.</p>}
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-between"><button type="button" onClick={addPlan} className="btn-secondary"><Plus size={17} /> Tambah plan</button><SubmitButton pendingText="Menyimpan semua plan...">Simpan semua plan</SubmitButton></div>
  </form>;
}
