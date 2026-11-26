"use client";

import { startTransition, useActionState, useEffect, useOptimistic, useRef, useState } from "react";
import { Check, LoaderCircle, X } from "lucide-react";
import { toggleReseller, type ResellerStatusState } from "@/app/admin/actions";

const initialState: ResellerStatusState = { success: false, message: "" };

export function ResellerStatusToggle({ id, active }: { id: string; active: boolean; returnTo?: string }) {
  const [confirmed, setConfirmed] = useState(active);
  const [optimistic, setOptimistic] = useOptimistic(confirmed);
  const [state, action, pending] = useActionState(toggleReseller, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success && typeof state.active === "boolean") setConfirmed(state.active);
  }, [state]);

  function toggle() {
    startTransition(() => {
      setOptimistic(!confirmed);
      formRef.current?.requestSubmit();
    });
  }

  const visualActive = pending ? optimistic : confirmed;
  return <div className="relative inline-flex flex-col items-start"><form ref={formRef} action={action}><input type="hidden" name="id" value={id} /><input type="hidden" name="active" value={String(confirmed)} /><button type="button" role="switch" aria-checked={visualActive} aria-label={visualActive ? "Nonaktifkan reseller" : "Aktifkan reseller"} disabled={pending} onClick={toggle} className={`group relative inline-flex h-9 min-w-[116px] items-center rounded-full border p-1 shadow-sm transition-all duration-200 ${visualActive ? "border-emerald-200 bg-emerald-50" : "border-gray-200 bg-gray-50"} ${pending ? "cursor-wait" : "hover:shadow-md"}`}><span className={`absolute size-7 rounded-full shadow-sm transition-transform duration-200 ${visualActive ? "translate-x-[78px] bg-emerald-500" : "translate-x-0 bg-gray-400"}`}>{pending ? <LoaderCircle className="m-1.5 animate-spin text-white" size={16} /> : visualActive ? <Check className="m-1.5 text-white" size={16} /> : <X className="m-1.5 text-white" size={16} />}</span><span className={`px-2 text-[11px] font-bold transition ${visualActive ? "pr-9 text-emerald-700" : "pl-9 text-gray-600"}`}>{pending ? "Menyimpan" : visualActive ? "Aktif" : "Nonaktif"}</span></button></form>{state.message && !pending && <span role={state.success ? "status" : "alert"} className={`absolute top-10 z-10 whitespace-nowrap rounded-lg px-2 py-1 text-[10px] font-semibold shadow-sm ${state.success ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>{state.message}</span>}</div>;
}
