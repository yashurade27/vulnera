import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { AdminShell } from "@/features/admin/ui/admin-shell"

export const metadata = {
  title: "Admin Dashboard | Vulnera",
}

type AdminLayoutProps = {
  children: ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    const callbackUrl = encodeURIComponent("/admin")
    redirect(`/auth/login?callbackUrl=${callbackUrl}`)
  }

  if (session.user.role !== "ADMIN") {
    redirect("/")
  }

  return <AdminShell>{children}</AdminShell>
}
