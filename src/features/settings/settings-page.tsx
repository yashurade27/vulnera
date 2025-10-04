"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import Link from "next/link"
import { z } from "zod"
import {
  UserCircle,
  Wallet,
  Loader2,
  UploadCloud,
  Settings2,
  Github,
  Twitter,
  Linkedin,
  Globe,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { updateUserProfileSchema } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

const walletSchema = z.object({
  walletAddress: z.string().min(1, "Wallet address is required"),
  signature: z.string().min(1, "Signature required"),
})

type ProfileFormValues = z.infer<typeof updateUserProfileSchema>
type WalletFormValues = z.infer<typeof walletSchema>

export function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [messageToSign, setMessageToSign] = useState<string>("")
  const [activeTab, setActiveTab] = useState("profile")
  const [avatarUploading, setAvatarUploading] = useState(false)
  const userId = session?.user?.id

  const generateMessageToSign = (walletAddress: string) => {
    const timestamp = Date.now()
    const message = `Verify wallet ownership for Vulnera platform\nWallet: ${walletAddress}\nTimestamp: ${timestamp}\nUser ID: ${userId ?? "unknown"}`
    setMessageToSign(message)
    return message
  }
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      fullName: undefined,
      bio: undefined,
      avatarUrl: undefined,
      country: undefined,
      githubUrl: undefined,
      twitterUrl: undefined,
      linkedinUrl: undefined,
      portfolioUrl: undefined,
    },
  })
  const walletForm = useForm<WalletFormValues>({
    resolver: zodResolver(walletSchema),
    defaultValues: {
      walletAddress: "",
      signature: "",
    },
  })

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));
        const payload = {
          user: {
            fullName: "John Doe",
            bio: "A passionate bug bounty hunter.",
            avatarUrl: "https://example.com/avatar.png",
            country: "United States",
            githubUrl: "https://github.com/johndoe",
            twitterUrl: "https://twitter.com/johndoe",
            linkedinUrl: "https://linkedin.com/in/johndoe",
            portfolioUrl: "https://johndoe.dev",
            walletAddress: "So11111111111111111111111111111111111111112",
          },
        };
        profileForm.reset({
          fullName: payload?.user?.fullName ?? undefined,
          bio: payload?.user?.bio ?? undefined,
          avatarUrl: payload?.user?.avatarUrl ?? undefined,
          country: payload?.user?.country ?? undefined,
          githubUrl: payload?.user?.githubUrl ?? undefined,
          twitterUrl: payload?.user?.twitterUrl ?? undefined,
          linkedinUrl: payload?.user?.linkedinUrl ?? undefined,
          portfolioUrl: payload?.user?.portfolioUrl ?? undefined,
        });
        walletForm.reset({
          walletAddress: payload?.user?.walletAddress ?? "",
          signature: "",
        });
        // Generate message if wallet address exists
        if (payload?.user?.walletAddress) {
          generateMessageToSign(payload.user.walletAddress);
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Unexpected error loading profile");
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, [userId, profileForm, walletForm])

  const handleAvatarUpload = async (file: File) => {
    try {
      setAvatarUploading(true)
      const formData = new FormData()
      formData.append("file", file)
      // const response = await fetch("/api/upload/image", {
      //   method: "POST",
      //   body: formData,
      // });

      // if (!response.ok) {
      //   throw new Error("Upload failed");
      // }

      // const payload = await response.json();
      const payload = { url: `https://example.com/uploads/${file.name}` };
      profileForm.setValue("avatarUrl", payload.url ?? undefined, { shouldValidate: true })
      toast.success("Avatar updated")
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Unable to upload avatar")
    } finally {
      setAvatarUploading(false)
    }
  }

  const submitProfile = async (values: ProfileFormValues) => {
    if (!userId) {
      toast.error("You need to be signed in")
      return
    }
    try {
      const payload = {
        ...values,
        avatarUrl: values.avatarUrl?.trim() ? values.avatarUrl.trim() : undefined,
        fullName: values.fullName?.trim() ? values.fullName.trim() : undefined,
        bio: values.bio?.trim() ? values.bio.trim() : undefined,
        country: values.country?.trim() ? values.country.trim() : undefined,
        githubUrl: values.githubUrl?.trim() ? values.githubUrl.trim() : undefined,
        twitterUrl: values.twitterUrl?.trim() ? values.twitterUrl.trim() : undefined,
        linkedinUrl: values.linkedinUrl?.trim() ? values.linkedinUrl.trim() : undefined,
        portfolioUrl: values.portfolioUrl?.trim() ? values.portfolioUrl.trim() : undefined,
      }

      // const response = await fetch(`/api/users/${userId}`, {
      //   method: "PATCH",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   credentials: "include",
      //   body: JSON.stringify(payload),
      // });
      // if (!response.ok) {
      //   const errorPayload = await response.json().catch(() => null);
      //   throw new Error(errorPayload?.error ?? "Failed to update profile");
      // }
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Profile saved")
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Unable to update profile")
    }
  }

  const submitWallet = async (values: WalletFormValues) => {
    if (!userId) {
      toast.error("You need to be signed in")
      return
    }

    if (!messageToSign) {
      toast.error("Please enter a wallet address first to generate the message to sign")
      return
    }

    try {
      // const response = await fetch(`/api/users/${userId}/wallet`, {
      //   method: "PATCH",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   credentials: "include",
      //   body: JSON.stringify({
      //     ...values,
      //     message: messageToSign,
      //   }),
      // });
      // if (!response.ok) {
      //   const errorPayload = await response.json().catch(() => null);
      //   throw new Error(errorPayload?.error ?? "Failed to update wallet");
      // }
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Wallet updated")
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Unable to update wallet")
    }
  }

  if (status === "loading") {
    return null
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="container-custom max-w-xl">
          <Card className="card-glass">
            <CardContent className="p-10 space-y-4 text-center">
              <UserCircle className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Sign in to manage your settings.</p>
              <Button asChild>
                <Link href="/auth/login">Go to login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/40 backdrop-blur-sm">
        <div className="container-custom py-12 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-semibold flex items-center gap-3">
                <Settings2 className="w-10 h-10 text-yellow-400" /> Account settings
              </h1>
              <p className="text-muted-foreground text-lg">Update your profile, socials, and wallet preferences.</p>
            </div>
            <Badge variant="outline" className="bg-yellow-500/10 border-yellow-400/40 text-yellow-200">
              Signed in as {session?.user?.email}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container-custom py-10">
        {error ? (
          <Card className="card-glass border border-red-500/40 max-w-2xl mx-auto mb-8">
            <CardContent className="p-8 text-center text-muted-foreground">{error}</CardContent>
          </Card>
        ) : null}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-xl grid-cols-2">
            <TabsTrigger value="profile" className="gap-2">
              <UserCircle className="w-4 h-4" /> Profile
            </TabsTrigger>
            <TabsTrigger value="wallet" className="gap-2">
              <Wallet className="w-4 h-4" /> Wallet
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="card-glass">
              <CardHeader>
                <CardTitle>Profile information</CardTitle>
                <CardDescription>Keep your public profile up to date for companies and hunters.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    <div className="h-24 rounded-lg bg-card animate-pulse" />
                    <div className="h-24 rounded-lg bg-card animate-pulse" />
                  </div>
                ) : (
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(submitProfile)} className="space-y-6">
                      <div>
                        <FormLabel>Avatar</FormLabel>
                        <div className="flex items-center gap-4 mt-2">
                          {profileForm.watch("avatarUrl") ? (
                            <img
                              src={profileForm.watch("avatarUrl") ?? ""}
                              alt="Avatar"
                              className="h-16 w-16 rounded-full border border-border object-cover"
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-full border border-dashed border-border flex items-center justify-center text-sm text-muted-foreground">
                              No avatar
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-lg cursor-pointer hover:bg-white/5 transition">
                              <UploadCloud className="w-4 h-4" />
                              <span>Upload avatar</span>
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/svg+xml"
                                className="hidden"
                                onChange={(event) => {
                                  const file = event.target.files?.[0]
                                  if (file) {
                                    void handleAvatarUpload(file)
                                  }
                                }}
                              />
                            </label>
                            {avatarUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            {profileForm.watch("avatarUrl") ? (
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => profileForm.setValue("avatarUrl", undefined, { shouldValidate: true })}
                              >
                                Remove
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Jane Doe"
                                  value={field.value ?? ""}
                                  onChange={(event) => {
                                    const value = event.target.value
                                    field.onChange(value === "" ? undefined : value)
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileForm.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Remote"
                                  value={field.value ?? ""}
                                  onChange={(event) => {
                                    const value = event.target.value
                                    field.onChange(value === "" ? undefined : value)
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={profileForm.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Textarea
                                rows={4}
                                placeholder="Share your expertise and focus areas"
                                value={field.value ?? ""}
                                onChange={(event) => {
                                  const value = event.target.value
                                  field.onChange(value === "" ? undefined : value)
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="githubUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>GitHub</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://github.com/username"
                                  value={field.value ?? ""}
                                  onChange={(event) => {
                                    const value = event.target.value
                                    field.onChange(value === "" ? undefined : value)
                                  }}
                                />
                              </FormControl>
                              <FormDescription className="flex items-center gap-2 text-xs">
                                <Github className="w-3 h-3" /> Showcase your repositories.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileForm.control}
                          name="twitterUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Twitter / X</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://twitter.com/username"
                                  value={field.value ?? ""}
                                  onChange={(event) => {
                                    const value = event.target.value
                                    field.onChange(value === "" ? undefined : value)
                                  }}
                                />
                              </FormControl>
                              <FormDescription className="flex items-center gap-2 text-xs">
                                <Twitter className="w-3 h-3" /> Connect with the community.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="linkedinUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>LinkedIn</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://linkedin.com/in/username"
                                  value={field.value ?? ""}
                                  onChange={(event) => {
                                    const value = event.target.value
                                    field.onChange(value === "" ? undefined : value)
                                  }}
                                />
                              </FormControl>
                              <FormDescription className="flex items-center gap-2 text-xs">
                                <Linkedin className="w-3 h-3" /> Optional professional profile.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileForm.control}
                          name="portfolioUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Portfolio</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://"
                                  value={field.value ?? ""}
                                  onChange={(event) => {
                                    const value = event.target.value
                                    field.onChange(value === "" ? undefined : value)
                                  }}
                                />
                              </FormControl>
                              <FormDescription className="flex items-center gap-2 text-xs">
                                <Globe className="w-3 h-3" /> Personal site or case studies.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                          {profileForm.formState.isSubmitting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : null}
                          Save profile
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wallet">
            <Card className="card-glass">
              <CardHeader>
                <CardTitle>Wallet settings</CardTitle>
                <CardDescription>
                  Update the wallet address associated with your bounty payouts. Signature is required for verification.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...walletForm}>
                  <form onSubmit={walletForm.handleSubmit(submitWallet)} className="space-y-6">
                    <FormField
                      control={walletForm.control}
                      name="walletAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wallet address</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your Solana wallet address"
                              {...field}
                              onChange={(event) => {
                                const value = event.target.value.trim()
                                field.onChange(value)
                                if (value) {
                                  generateMessageToSign(value)
                                  walletForm.setValue("signature", "") // Reset signature when address changes
                                } else {
                                  setMessageToSign("")
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {messageToSign && (
                      <div className="p-4 rounded-lg bg-muted border">
                        <FormLabel className="text-sm font-medium">Message to sign</FormLabel>
                        <div className="mt-2 p-3 bg-background rounded border font-mono text-sm whitespace-pre-wrap">
                          {messageToSign}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Copy this message and sign it in your Solana wallet (Phantom, Backpack, etc.). The wallet
                          will return a base58 signature you can paste below.
                        </p>
                      </div>
                    )}
                    <FormField
                      control={walletForm.control}
                      name="signature"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Proof signature</FormLabel>
                          <FormControl>
                            <Input placeholder="Paste the signed message from your wallet" {...field} />
                          </FormControl>
                          <FormDescription>
                            1. Enter your wallet address above to generate a message<br/>
                            2. Sign that message in your Solana wallet (use the "Sign Message" feature)<br/>
                            3. Paste the base58 signature returned by your wallet client
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-3">
                      <Button type="submit" disabled={walletForm.formState.isSubmitting}>
                        {walletForm.formState.isSubmitting ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Wallet className="w-4 h-4 mr-2" />
                        )}
                        Update wallet
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
