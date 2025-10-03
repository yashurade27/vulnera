"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import Link from "next/link"
import {
  Building2,
  UploadCloud,
  Loader2,
  Wand2,
  ShieldCheck,
  Wallet as WalletIcon,
  Rocket,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useSolana } from "@/components/solana/use-solana"
import { WalletDropdown } from "@/components/wallet-dropdown"
import { createCompanySchema } from "@/lib/types"
import Image from "next/image"

const onboardingSchema = createCompanySchema
  .extend({
    logoUrl: z.string().url().optional().or(z.literal("")),
    registrationTx: z.string().trim().optional().or(z.literal("")),
    smartContractAddress: z.string().trim().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.registrationTx && data.registrationTx.trim().length > 0 && data.registrationTx.trim().length < 64) {
      ctx.addIssue({
        path: ["registrationTx"],
        code: z.ZodIssueCode.custom,
        message: "Signature looks too short",
      })
    }
  })

type OnboardingFormValues = z.infer<typeof onboardingSchema>

export function CompanyOnboardingPage() {
  const router = useRouter()
  const { account } = useSolana()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: "",
      description: "",
      website: "",
      walletAddress: "",
      industry: "",
      companySize: "",
      location: "",
      logoUrl: "",
      registrationTx: "",
      smartContractAddress: "",
    },
  })

  useEffect(() => {
    if (account?.address) {
      form.setValue("walletAddress", account.address.toString(), { shouldValidate: true })
    }
  }, [account?.address, form])

  const logoUrlValue = form.watch("logoUrl")

  useEffect(() => {
    if (logoUrlValue) {
      setLogoPreview(logoUrlValue)
    }
  }, [logoUrlValue])

  const uploadInProgress = logoUploading

  const handleLogoUpload = async (file: File) => {
    try {
      setLogoUploading(true)
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const payload = await response.json()
      form.setValue("logoUrl", payload.url ?? "", { shouldValidate: true })
      setLogoPreview(payload.url ?? null)
      toast.success("Logo uploaded")
    } catch (error) {
      console.error(error)
      toast.error("Unable to upload logo")
    } finally {
      setLogoUploading(false)
    }
  }

  const onSubmit = async (values: OnboardingFormValues) => {
    try {
      setIsSubmitting(true)
      const payload = {
        name: values.name,
        description: values.description,
        website: values.website,
        walletAddress: values.walletAddress,
        industry: values.industry,
        companySize: values.companySize,
        location: values.location,
        logoUrl: values.logoUrl && values.logoUrl.trim().length > 0 ? values.logoUrl.trim() : undefined,
      }

      const response = await fetch("/api/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null)
        throw new Error(errorPayload?.error ?? "Failed to create company")
      }

      const created = await response.json()
      toast.success("Company profile created")

      const companyId: string | undefined = created?.company?.id
      const registrationSignature = values.registrationTx?.trim()
      const smartContractAddress = values.smartContractAddress?.trim()

      if (companyId && registrationSignature) {
        const registerResponse = await fetch("/api/blockchain/register-company", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            companyId,
            txSignature: registrationSignature,
            smartContractAddress: smartContractAddress && smartContractAddress.length > 0 ? smartContractAddress : undefined,
          }),
        })

        if (!registerResponse.ok) {
          const registerError = await registerResponse.json().catch(() => null)
          toast.error(registerError?.error ?? "Blockchain registration failed")
        } else {
          toast.success("Company registered on-chain")
        }
      }

      router.push("/dashboard/company")
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Unexpected error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/40 backdrop-blur-sm">
        <div className="container-custom py-12 space-y-6">
          <Badge variant="outline" className="bg-yellow-500/10 border-yellow-400/40 text-yellow-200 inline-flex items-center gap-2">
            <Rocket className="w-3 h-3" /> Company Onboarding
          </Badge>
          <div className="max-w-2xl space-y-4">
            <h1 className="text-4xl lg:text-5xl font-semibold flex items-center gap-3">
              <Building2 className="w-10 h-10 text-yellow-400" /> Set up your company profile
            </h1>
            <p className="text-muted-foreground text-lg">
              Complete the steps below to launch your bounty program. We will guide you through company details, wallet
              connection, and on-chain registration.
            </p>
          </div>
        </div>
      </div>

      <div className="container-custom py-10">
        <div className="grid lg:grid-cols-[2fr_1fr] gap-8">
          <Card className="card-glass">
            <CardHeader>
              <CardTitle>Company details</CardTitle>
              <CardDescription>Tell hunters who you are and how to reach you.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company name</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Security" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea rows={4} placeholder="Share your security mission, stack, or expectations" {...field} />
                        </FormControl>
                        <FormDescription>Hunters see this on your public profile.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input type="url" placeholder="https://" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industry</FormLabel>
                          <FormControl>
                            <Input placeholder="Web3 Infrastructure" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="companySize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company size</FormLabel>
                          <FormControl>
                            <Input placeholder="11-50" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="Remote" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company logo</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-yellow-500/40 rounded-lg cursor-pointer hover:bg-yellow-500/10 transition">
                              <UploadCloud className="w-4 h-4" />
                              <span>Upload image</span>
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/svg+xml"
                                className="hidden"
                                onChange={(event) => {
                                  const file = event.target.files?.[0]
                                  if (file) {
                                    void handleLogoUpload(file)
                                  }
                                }}
                              />
                            </label>
                            {uploadInProgress ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                            {logoPreview ? (
                              <div className="flex items-center gap-3">
                                {/* simple preview */}
                                <Image
                                width={65}
                                height={65}
                                src={logoPreview} alt="Logo preview" className="h-12 w-12 rounded-lg border border-border object-cover" />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => {
                                    setLogoPreview(null)
                                    field.onChange("")
                                  }}
                                >
                                  Remove
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        </FormControl>
                        <FormDescription>PNG, JPG, or SVG up to 4MB.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Card className="border-dashed">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <WalletIcon className="w-4 h-4" /> Wallet connection
                      </CardTitle>
                      <CardDescription>Connect the wallet that will fund and approve bounties.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <WalletDropdown />
                      <FormField
                        control={form.control}
                        name="walletAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Wallet address</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter or connect a Solana wallet" {...field} />
                            </FormControl>
                            <FormDescription>
                              We autofill this when you connect. You can also paste it manually.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card className="border-dashed">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" /> On-chain registration (optional now)
                      </CardTitle>
                      <CardDescription>
                        Provide the transaction signature and smart contract address once your company is registered on-chain.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="registrationTx"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Registration transaction signature</FormLabel>
                            <FormControl>
                              <Input placeholder="Paste the Solana transaction signature" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="smartContractAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Smart contract address</FormLabel>
                            <FormControl>
                              <Input placeholder="Optional program account for your company" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <div className="flex items-center justify-between">
                    <Link href="/dashboard/company" className="text-sm text-muted-foreground hover:text-foreground">
                      Skip for now
                    </Link>
                    <Button type="submit" disabled={isSubmitting || uploadInProgress}>
                      {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                      Complete onboarding
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="card-glass">
              <CardHeader>
                <CardTitle>What happens next?</CardTitle>
                <CardDescription>Quick overview of the onboarding flow.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <Badge variant="secondary">1</Badge>
                  <div>
                    <p className="font-medium text-foreground">Create your profile</p>
                    <p>Fill in your company details and branding assets.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Badge variant="secondary">2</Badge>
                  <div>
                    <p className="font-medium text-foreground">Connect wallet</p>
                    <p>Authorize the wallet that will fund and approve bounty rewards.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Badge variant="secondary">3</Badge>
                  <div>
                    <p className="font-medium text-foreground">Register on-chain</p>
                    <p>Submit your registration transaction to verify your program.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-glass">
              <CardHeader>
                <CardTitle>Need support?</CardTitle>
                <CardDescription>Our team can help you finalize onboarding.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Button asChild variant="outline" className="w-full">
                  <Link href="mailto:support@vulnera.xyz">Email support</Link>
                </Button>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <ShieldCheck className="w-4 h-4" />
                  Verified companies unlock priority review and higher visibility.
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Wand2 className="w-4 h-4" />
                  You can update details anytime from your company dashboard.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
