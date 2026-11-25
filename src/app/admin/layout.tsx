import { AdminShell } from "@/components/admin-shell";import { requireUser } from "@/lib/auth";
export default async function AdminLayout({children}:{children:React.ReactNode}){const {profile}=await requireUser("admin");return <AdminShell name={profile.full_name}>{children}</AdminShell>}
