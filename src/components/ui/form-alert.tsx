import { AlertCircle, CheckCircle2, Info } from "lucide-react";

export function FormAlert({ type, children }: { type: "success" | "error" | "info"; children: React.ReactNode }) {
  const styles = { success: "border-green-200 bg-green-50 text-green-800", error: "border-red-200 bg-red-50 text-red-800", info: "border-blue-200 bg-blue-50 text-blue-800" };
  const Icon = type === "success" ? CheckCircle2 : type === "error" ? AlertCircle : Info;
  return <div role={type === "error" ? "alert" : "status"} className={`flex gap-3 rounded-2xl border p-4 text-sm leading-6 ${styles[type]}`}><Icon className="mt-0.5 shrink-0" size={19} /><div>{children}</div></div>;
}
