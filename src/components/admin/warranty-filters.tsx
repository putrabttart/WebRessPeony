"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchField } from "@/components/ui/search-field";

const filters = [
  ["", "Semua status"],
  ["reviewing", "Diperiksa"],
  ["processing", "On Proses"],
  ["completed", "Selesai"],
  ["rejected", "Ditolak"],
] as const;

export function WarrantyFilters({ query, status }: { query?: string; status?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [text, setText] = useState(query ?? "");
  const [pending, startTransition] = useTransition();

  function changeStatus(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const cleanQuery = text.trim();
    if (cleanQuery) params.set("q", cleanQuery); else params.delete("q");
    if (value) params.set("status", value); else params.delete("status");
    params.delete("page");
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const cleanQuery = text.trim();
    if (cleanQuery) params.set("q", cleanQuery); else params.delete("q");
    params.delete("page");
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }

  return <form onSubmit={submitSearch} className="flex flex-col gap-3 sm:flex-row sm:items-center">
    <SearchField value={text} onChange={(event) => setText(event.target.value)} placeholder="Cari kode, aplikasi, atau data akun..." label="Cari laporan garansi" />
    <label className="sm:w-48"><span className="sr-only">Filter status</span><select className="field" name="status" value={status ?? ""} onChange={(event) => changeStatus(event.target.value)}>{filters.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
    <button className="btn-primary min-w-24" disabled={pending}>{pending ? "Mencari..." : "Cari"}</button>
  </form>;
}
