import { SubmissionDetailsPage } from "@/features/submissions/submission-details-page"
import { type RouteParams } from "@/lib/next"

export default function Page({ params }: RouteParams<{ submissionId: string }>) {
  return <SubmissionDetailsPage params={params} />
}
