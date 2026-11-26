import { Search } from "lucide-react";
import type { ChangeEvent } from "react";

export function SearchField({ name = "q", defaultValue, value, onChange, placeholder, label = "Pencarian" }: { name?: string; defaultValue?: string; value?: string; onChange?: (event: ChangeEvent<HTMLInputElement>) => void; placeholder: string; label?: string }) {
  return <label className="block min-w-0 flex-1"><span className="sr-only">{label}</span><span className="relative block"><Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-gray-400" size={18} /><input className="field !pl-12" type="search" name={name} defaultValue={value === undefined ? defaultValue : undefined} value={value} onChange={onChange} placeholder={placeholder} /></span></label>;
}
