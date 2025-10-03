import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { UserSubmissionsPage } from "@/features/users/user-submissions-page"

interface UserSubmissionsRouteProps {
  params: { userId: string }
}

export default function UserSubmissionsRoute({ params }: UserSubmissionsRouteProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="container-custom flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
          </div>
        </div>
      }
    >
      <UserSubmissionsPage userId={params.userId} />
    </Suspense>
  )
}
