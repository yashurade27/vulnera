import { UserViewProfile } from "@/features/users/user-view-profile"
import { type RouteParams } from "@/lib/next"

export default async function UserViewProfileRoute({ params }: RouteParams<{ userId: string }>) {
  const { userId } = await params
  return <UserViewProfile userId={userId} />
}

