"use client";

import { FileImage, FileText, Upload, X } from "lucide-react";
import { useId, useRef, useState } from "react";

const MAX_SIZE = 5 * 1024 * 1024;

export function FilePicker({ name, multiple = false, label, hint, required = false }: { name: string; multiple?: boolean; label: string; hint: string; required?: boolean }) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");

  function change(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    const valid = selected.filter((file) => file.size <= MAX_SIZE);
    setError(selected.length !== valid.length ? "Ada file yang melebihi batas 5 MB dan tidak dipilih." : "");
    setFiles(valid);
  }

  function remove(index: number) {
    const remaining = files.filter((_, fileIndex) => fileIndex !== index);
    setFiles(remaining);
    if (inputRef.current) {
      const transfer = new DataTransfer();
      remaining.forEach((file) => transfer.items.add(file));
      inputRef.current.files = transfer.files;
    }
  }

  return <div className="space-y-2">
    <label htmlFor={id} className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-pink-300 bg-gradient-to-r from-pink-50 to-amber-50 p-4 transition hover:border-pink-500 hover:shadow-[0_8px_24px_rgba(207,38,118,.10)]">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-pink-600 shadow-sm transition group-hover:scale-105"><Upload size={19} /></span>
      <span className="min-w-0 flex-1"><strong className="block text-sm text-[#4b2637]">{label}</strong><small className="mt-1 block text-xs leading-5 text-gray-500">{hint}</small></span>
      <span className="rounded-full bg-[#21121a] px-3 py-2 text-[11px] font-bold text-white">Pilih file</span>
      <input ref={inputRef} id={id} className="sr-only" name={name} type="file" accept="image/jpeg,image/png,image/webp" multiple={multiple} required={required && files.length === 0} onChange={change} />
    </label>
    {error && <p role="alert" className="text-xs font-semibold text-red-600">{error}</p>}
    {files.length > 0 && <div className="space-y-2" aria-live="polite">{files.map((file, index) => <div className="flex items-center gap-3 rounded-xl border border-green-100 bg-green-50 px-3 py-2.5" key={`${file.name}-${file.lastModified}`}><span className="grid size-8 place-items-center rounded-lg bg-white text-green-600"><FileImage size={16} /></span><span className="min-w-0 flex-1 truncate text-xs font-semibold text-green-900">{file.name}<small className="ml-2 font-normal text-green-700">{formatSize(file.size)}</small></span><button type="button" aria-label={`Hapus ${file.name}`} onClick={() => remove(index)} className="rounded-full p-1 text-green-700 hover:bg-green-100"><X size={15} /></button></div>)}</div>}
    {files.length === 0 && <p className="flex items-center gap-1 text-[11px] text-gray-400"><FileText size={13} /> Belum ada file dipilih</p>}
  </div>;
}

function formatSize(bytes: number) { return `${(bytes / 1024 / 1024).toFixed(1)} MB`; }
