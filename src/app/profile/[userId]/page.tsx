import { ProfilePage } from "@/features/profile/profile-page"
import { type RouteParams } from "@/lib/next"

export default async function ProfileRoute({ params }: RouteParams<{ userId: string }>) {
  const { userId } = await params
  return <ProfilePage userId={userId} />
}
