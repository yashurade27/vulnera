import { Suspense } from "react"
import { SubmissionsListPage } from "@/features/submissions/submissions-list-page"

function SubmissionsPageContent() {
  return <SubmissionsListPage />
}

export default function SubmissionsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading submissions...</p>
      </div>
    </div>}>
      <SubmissionsPageContent />
    </Suspense>
  )
}
