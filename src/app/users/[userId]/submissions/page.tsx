import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { UserSubmissionsPage } from '@/features/users/user-submissions-page'

interface UserSubmissionsRouteProps {
  params: Promise<{ userId: string }>
}

export default async function UserSubmissionsRoute({ params }: UserSubmissionsRouteProps) {
  const { userId } = await params
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
      <UserSubmissionsPage userId={userId} />
    </Suspense>
  )
}
