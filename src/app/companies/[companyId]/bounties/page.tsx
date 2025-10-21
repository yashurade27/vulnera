import { CompanyBountiesPublicPage } from "@/features/companies/company-bounties-public-page"
import { type RouteParams } from "@/lib/next"

export default function Page({ params }: RouteParams<{ companyId: string }>) {
  return <CompanyBountiesPublicPage params={params} />
}
