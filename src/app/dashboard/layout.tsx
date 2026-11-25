import { DashboardShell } from "@/components/dashboard-shell";
import { requireUser } from "@/lib/auth";

export default async function Layout({ children }: { children: React.ReactNode }) { const { profile } = await requireUser("reseller"); return <DashboardShell name={profile.full_name}>{children}</DashboardShell>; }
