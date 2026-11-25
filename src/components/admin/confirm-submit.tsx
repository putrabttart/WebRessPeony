"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

export function ConfirmSubmit({ children, message }: { children: React.ReactNode; message: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="inline-flex items-center gap-2 text-sm font-bold text-red-600 disabled:opacity-50" onClick={(event) => { if (!window.confirm(message)) event.preventDefault(); }}>{pending && <LoaderCircle className="animate-spin" size={14} />}{pending ? "Memproses..." : children}</button>;
}
