import { SubmissionReviewPage } from "@/features/dashboard/company/submission-review-page"
import { type RouteParams } from "@/lib/next"

export default async function SubmissionReviewRoute({ params }: RouteParams<{ submissionId: string }>) {
  const { submissionId } = await params
  return <SubmissionReviewPage submissionId={submissionId} />
}
