"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface CompanyProfile {
  id: string
  name: string
  description?: string | null
  website?: string | null
  walletAddress?: string | null
  logoUrl?: string | null
  industry?: string | null
  companySize?: string | null
  location?: string | null
}

export function CompanySettingsPage() {
  const router = useRouter()
  const [company, setCompany] = useState<CompanyProfile | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    website: "",
    walletAddress: "",
    logoUrl: "",
    industry: "",
    companySize: "",
    location: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const res = await fetch("/api/companies/my-company", { credentials: "include" })
        if (!res.ok) {
          throw new Error("Failed to load company profile")
        }
        const data = await res.json()
        const companyData = data?.company
        if (companyData) {
          setCompany(companyData)
          setFormData({
            name: companyData.name || "",
            description: companyData.description || "",
            website: companyData.website || "",
            walletAddress: companyData.walletAddress || "",
            logoUrl: companyData.logoUrl || "",
            industry: companyData.industry || "",
            companySize: companyData.companySize || "",
            location: companyData.location || "",
          })
        }
      } catch (err) {
        console.error("Load company error:", err)
        toast.error("Failed to load company profile")
      } finally {
        setLoading(false)
      }
    }
    void loadCompany()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company?.id) return

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {}
      if (formData.name !== company.name) payload.name = formData.name
      if (formData.description !== company.description) payload.description = formData.description
      if (formData.website !== company.website) payload.website = formData.website
      if (formData.walletAddress !== company.walletAddress) payload.walletAddress = formData.walletAddress
      if (formData.logoUrl !== company.logoUrl) payload.logoUrl = formData.logoUrl
      if (formData.industry !== company.industry) payload.industry = formData.industry
      if (formData.companySize !== company.companySize) payload.companySize = formData.companySize
      if (formData.location !== company.location) payload.location = formData.location

      if (Object.keys(payload).length === 0) {
        toast.info("No changes to save")
        return
      }

      const res = await fetch(`/api/companies/${company.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error?.error || "Failed to update company")
      }

      toast.success("Company profile updated successfully")
      // Refresh the company data
      setCompany((prev) => prev ? { ...prev, ...payload } : null)
    } catch (err) {
      console.error("Update company error:", err)
      toast.error(err instanceof Error ? err.message : "Failed to update company")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading company settings...</p>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Company profile not found</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/40 backdrop-blur-sm">
        <div className="container-custom py-8 space-y-2">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-bold">Company Settings</h1>
              <p className="text-muted-foreground">
                Update your company profile and wallet information
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <Card className="card-glass max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Edit Company Profile</CardTitle>
            <CardDescription>
              Update your company's information. Changes will be reflected across the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="mt-2"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="mt-2 min-h-24"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="walletAddress">Wallet Address</Label>
                  <Input
                    id="walletAddress"
                    value={formData.walletAddress}
                    onChange={(e) => setFormData((prev) => ({ ...prev, walletAddress: e.target.value }))}
                    className="mt-2"
                    placeholder="Solana wallet address"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Required for creating bounties and funding escrows
                  </p>
                </div>
                <div>
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    type="url"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData((prev) => ({ ...prev, logoUrl: e.target.value }))}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => setFormData((prev) => ({ ...prev, industry: e.target.value }))}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="companySize">Company Size</Label>
                  <Input
                    id="companySize"
                    value={formData.companySize}
                    onChange={(e) => setFormData((prev) => ({ ...prev, companySize: e.target.value }))}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}